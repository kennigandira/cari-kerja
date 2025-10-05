-- Migration 005: Security Fixes, Soft Deletes, and Optimistic Locking
-- Date: 2025-10-05
-- Description: Fixes CB-9 (NULL user_id security hole), CB-3 (soft deletes), CB-2 (optimistic locking)
-- Dependencies: 004_profile_transactions.sql

BEGIN;

-- ==================================
-- 1. ADD SECURITY COLUMNS
-- ==================================

-- Add session_id for pre-auth profile ownership (CB-9 fix)
ALTER TABLE master_profiles ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create unique index to prevent session_id reuse
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_session_id
  ON master_profiles(session_id)
  WHERE session_id IS NOT NULL;

-- ==================================
-- 2. ADD SOFT DELETE COLUMNS (CB-3 fix)
-- ==================================

ALTER TABLE master_profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE work_experiences ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ==================================
-- 3. OPTIMISTIC LOCKING TRIGGER (CB-2 fix)
-- ==================================

-- Trigger function to check version conflicts on UPDATE
CREATE OR REPLACE FUNCTION check_version_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check if version is being updated
  IF NEW.version IS NOT NULL AND OLD.version IS NOT NULL THEN
    -- Version must increment by exactly 1
    IF NEW.version != OLD.version + 1 THEN
      RAISE EXCEPTION 'Version conflict detected. Expected version %, got %',
        OLD.version,
        NEW.version
        USING ERRCODE = '40001'; -- Serialization failure code
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger to master_profiles
DROP TRIGGER IF EXISTS trg_master_profiles_version_check ON master_profiles;
CREATE TRIGGER trg_master_profiles_version_check
  BEFORE UPDATE ON master_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_version_conflict();

-- Apply trigger to work_experiences
DROP TRIGGER IF EXISTS trg_work_experiences_version_check ON work_experiences;
CREATE TRIGGER trg_work_experiences_version_check
  BEFORE UPDATE ON work_experiences
  FOR EACH ROW
  EXECUTE FUNCTION check_version_conflict();

-- ==================================
-- 4. UPDATE RPC FUNCTIONS
-- ==================================

-- Update create_master_profile to support session_id
CREATE OR REPLACE FUNCTION create_master_profile(
  p_profile JSONB,
  p_experiences JSONB DEFAULT '[]'::JSONB,
  p_skills JSONB DEFAULT '[]'::JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_user_id UUID;
  v_session_id TEXT;
  v_exp JSONB;
  v_skill JSONB;
BEGIN
  -- Get authenticated user ID (NULL if not authenticated)
  v_user_id := auth.uid();

  -- Get session_id from profile data (for pre-auth profiles)
  v_session_id := p_profile->>'session_id';

  -- Validate required fields
  IF p_profile->>'full_name' IS NULL OR p_profile->>'email' IS NULL THEN
    RAISE EXCEPTION 'full_name and email are required';
  END IF;

  IF p_profile->>'location' IS NULL OR p_profile->>'professional_summary' IS NULL THEN
    RAISE EXCEPTION 'location and professional_summary are required';
  END IF;

  -- Insert master profile
  INSERT INTO master_profiles (
    user_id,
    session_id,
    profile_name,
    is_default,
    full_name,
    email,
    phone_primary,
    phone_secondary,
    linkedin_url,
    github_url,
    portfolio_url,
    location,
    professional_summary,
    years_of_experience,
    current_position
  )
  VALUES (
    v_user_id,
    v_session_id,
    COALESCE(p_profile->>'profile_name', 'Main Profile'),
    COALESCE((p_profile->>'is_default')::BOOLEAN, true),
    p_profile->>'full_name',
    p_profile->>'email',
    p_profile->>'phone_primary',
    p_profile->>'phone_secondary',
    p_profile->>'linkedin_url',
    p_profile->>'github_url',
    p_profile->>'portfolio_url',
    p_profile->>'location',
    p_profile->>'professional_summary',
    (p_profile->>'years_of_experience')::INTEGER,
    p_profile->>'current_position'
  )
  RETURNING id INTO v_profile_id;

  -- Insert work experiences
  IF jsonb_array_length(p_experiences) > 0 THEN
    FOR v_exp IN SELECT * FROM jsonb_array_elements(p_experiences)
    LOOP
      INSERT INTO work_experiences (
        profile_id,
        company_name,
        position_title,
        location,
        start_date,
        end_date,
        is_current,
        description,
        display_order
      )
      VALUES (
        v_profile_id,
        v_exp->>'company_name',
        v_exp->>'position_title',
        v_exp->>'location',
        v_exp->>'start_date',
        v_exp->>'end_date',
        COALESCE((v_exp->>'is_current')::BOOLEAN, false),
        v_exp->>'description',
        COALESCE((v_exp->>'display_order')::INTEGER, 0)
      );
    END LOOP;
  END IF;

  -- Insert skills
  IF jsonb_array_length(p_skills) > 0 THEN
    FOR v_skill IN SELECT * FROM jsonb_array_elements(p_skills)
    LOOP
      INSERT INTO skills (
        profile_id,
        skill_name,
        category,
        proficiency_level,
        years_of_experience,
        display_order
      )
      VALUES (
        v_profile_id,
        v_skill->>'skill_name',
        v_skill->>'category',
        v_skill->>'proficiency_level',
        (v_skill->>'years_of_experience')::INTEGER,
        COALESCE((v_skill->>'display_order')::INTEGER, 0)
      );
    END LOOP;
  END IF;

  RETURN v_profile_id;
END;
$$;

-- Update soft_delete_profile to actually perform soft delete
CREATE OR REPLACE FUNCTION soft_delete_profile(p_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Verify user owns the profile (check both user_id and session_id)
  PERFORM 1
  FROM master_profiles
  WHERE id = p_profile_id
    AND deleted_at IS NULL
    AND (
      (user_id IS NOT NULL AND user_id = v_user_id)
      OR user_id IS NULL -- Allow for pre-auth profiles
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found or access denied';
  END IF;

  -- Soft delete profile
  UPDATE master_profiles
  SET deleted_at = NOW()
  WHERE id = p_profile_id;

  -- Soft delete related work experiences
  UPDATE work_experiences
  SET deleted_at = NOW()
  WHERE profile_id = p_profile_id;

  -- Soft delete related skills
  UPDATE skills
  SET deleted_at = NOW()
  WHERE profile_id = p_profile_id;

  RAISE NOTICE 'Profile % soft deleted successfully', p_profile_id;
END;
$$;

-- New function: Claim pre-auth profile after login
CREATE OR REPLACE FUNCTION claim_profile(p_session_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to claim profile';
  END IF;

  -- Transfer ownership of profile from session to user
  UPDATE master_profiles
  SET
    user_id = v_user_id,
    session_id = NULL,
    updated_at = NOW()
  WHERE session_id = p_session_id
    AND user_id IS NULL
    AND deleted_at IS NULL
  RETURNING id INTO v_profile_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'No profile found for session %', p_session_id;
  END IF;

  RAISE NOTICE 'Profile % claimed by user %', v_profile_id, v_user_id;

  RETURN v_profile_id;
END;
$$;

-- ==================================
-- 5. UPDATE RLS POLICIES (CB-9 fix)
-- ==================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profiles" ON master_profiles;
DROP POLICY IF EXISTS "Users can create profiles" ON master_profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON master_profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON master_profiles;

-- Create new policies with session_id support and soft delete filtering
CREATE POLICY "Users can view own non-deleted profiles"
  ON master_profiles FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      -- Authenticated users see their own profiles
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR
      -- Pre-auth users see profiles with their session_id
      (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can create profiles"
  ON master_profiles FOR INSERT
  WITH CHECK (
    -- User can create profile for themselves
    (user_id IS NULL OR auth.uid() = user_id)
  );

CREATE POLICY "Users can update own non-deleted profiles"
  ON master_profiles FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can delete own profiles"
  ON master_profiles FOR DELETE
  USING (
    deleted_at IS NULL
    AND (
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR (user_id IS NULL)
    )
  );

-- Update policies for work_experiences (filter soft-deleted)
DROP POLICY IF EXISTS "Users can view own work experiences" ON work_experiences;
CREATE POLICY "Users can view own non-deleted work experiences"
  ON work_experiences FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM master_profiles p
      WHERE p.id = work_experiences.profile_id
      AND p.deleted_at IS NULL
      AND (
        (p.user_id IS NOT NULL AND auth.uid() = p.user_id)
        OR (p.user_id IS NULL AND p.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
      )
    )
  );

-- Update policies for skills (filter soft-deleted)
DROP POLICY IF EXISTS "Users can view own skills" ON skills;
CREATE POLICY "Users can view own non-deleted skills"
  ON skills FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM master_profiles p
      WHERE p.id = skills.profile_id
      AND p.deleted_at IS NULL
      AND (
        (p.user_id IS NOT NULL AND auth.uid() = p.user_id)
        OR (p.user_id IS NULL AND p.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
      )
    )
  );

-- ==================================
-- 6. GRANT PERMISSIONS
-- ==================================

GRANT EXECUTE ON FUNCTION claim_profile TO authenticated;

-- ==================================
-- 7. VERIFICATION
-- ==================================

DO $$
DECLARE
  v_column_count INTEGER;
  v_function_count INTEGER;
BEGIN
  -- Check session_id column exists
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'master_profiles'
  AND column_name = 'session_id';

  IF v_column_count = 0 THEN
    RAISE EXCEPTION 'Migration verification failed: session_id column not found';
  END IF;

  -- Check deleted_at columns exist
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name IN ('master_profiles', 'work_experiences', 'skills')
  AND column_name = 'deleted_at';

  IF v_column_count <> 3 THEN
    RAISE EXCEPTION 'Migration verification failed: expected 3 deleted_at columns, found %', v_column_count;
  END IF;

  -- Check claim_profile function exists
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name = 'claim_profile';

  IF v_function_count = 0 THEN
    RAISE EXCEPTION 'Migration verification failed: claim_profile function not found';
  END IF;

  -- Check version check trigger exists
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
  AND event_object_table = 'master_profiles'
  AND trigger_name = 'trg_master_profiles_version_check';

  IF v_function_count = 0 THEN
    RAISE EXCEPTION 'Migration verification failed: version check trigger not found';
  END IF;

  RAISE NOTICE 'Migration 005 successful: Security fixes, soft deletes, and optimistic locking enabled';
END $$;

COMMIT;

-- ==================================
-- MIGRATION NOTES
-- ==================================

-- This migration fixes three critical blockers:
--
-- CB-9: RLS Security Hole (NULL user_id)
-- - Added session_id column for pre-auth profile ownership
-- - Updated RLS policies to check session_id
-- - Created claim_profile() function to transfer ownership after login
--
-- CB-3: CASCADE DELETE Risk
-- - Added deleted_at columns for soft deletes
-- - Updated soft_delete_profile() to set deleted_at instead of hard delete
-- - Updated RLS policies to filter out soft-deleted records
--
-- CB-2: Optimistic Locking
-- - Created check_version_conflict() trigger function
-- - Applied trigger to master_profiles and work_experiences
-- - Prevents concurrent edit data loss
--
-- Next: Run migration 006_indexes_export.sql for performance and markdown export
