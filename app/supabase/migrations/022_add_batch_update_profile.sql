-- Migration 022: Add batch update function for profiles with details
-- Date: 2025-10-06
-- Description: Adds RPC function to update profile, work experiences, and skills in single transaction
-- Dependencies: 004_profile_transactions.sql, 019_fix_update_master_profile_return.sql

BEGIN;

-- ==================================
-- 1. CREATE BATCH UPDATE RPC FUNCTION
-- ==================================

-- Function: Update Master Profile with Details (Atomic Transaction)
-- Updates profile and all related work_experiences and skills in one call
CREATE OR REPLACE FUNCTION update_master_profile_with_details(
  p_profile_id UUID,
  p_expected_version INTEGER,
  p_profile_updates JSONB,
  p_experiences JSONB DEFAULT '[]'::JSONB,
  p_skills JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_version INTEGER;
  v_user_id UUID;
  v_session_id TEXT;
  v_updated_profile JSONB;
  v_exp JSONB;
  v_skill JSONB;
  v_exp_id UUID;
  v_skill_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  -- Lock row and get current version and session_id
  SELECT version, session_id INTO v_current_version, v_session_id
  FROM master_profiles
  WHERE id = p_profile_id
    AND deleted_at IS NULL
    AND (
      (user_id IS NOT NULL AND user_id = v_user_id)
      OR (user_id IS NULL)
    )
  FOR UPDATE;

  -- Check if profile exists and user has access
  IF v_current_version IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'current_version', NULL,
      'error_message', 'Profile not found or access denied',
      'profile', NULL
    );
  END IF;

  -- Check version conflict
  IF v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false,
      'current_version', v_current_version,
      'error_message', 'Version conflict: Profile was modified by another session',
      'profile', NULL
    );
  END IF;

  -- Update master profile
  UPDATE master_profiles
  SET
    profile_name = COALESCE(p_profile_updates->>'profile_name', profile_name),
    is_default = COALESCE((p_profile_updates->>'is_default')::BOOLEAN, is_default),
    full_name = COALESCE(p_profile_updates->>'full_name', full_name),
    email = COALESCE(p_profile_updates->>'email', email),
    phone_primary = COALESCE(p_profile_updates->>'phone_primary', phone_primary),
    phone_secondary = COALESCE(p_profile_updates->>'phone_secondary', phone_secondary),
    linkedin_url = COALESCE(p_profile_updates->>'linkedin_url', linkedin_url),
    github_url = COALESCE(p_profile_updates->>'github_url', github_url),
    portfolio_url = COALESCE(p_profile_updates->>'portfolio_url', portfolio_url),
    location = COALESCE(p_profile_updates->>'location', location),
    professional_summary = COALESCE(p_profile_updates->>'professional_summary', professional_summary),
    years_of_experience = COALESCE((p_profile_updates->>'years_of_experience')::INTEGER, years_of_experience),
    current_position = COALESCE(p_profile_updates->>'current_position', current_position),
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_profile_id;

  -- Handle work experiences (upsert)
  IF jsonb_array_length(p_experiences) > 0 THEN
    FOR v_exp IN SELECT * FROM jsonb_array_elements(p_experiences)
    LOOP
      v_exp_id := (v_exp->>'id')::UUID;

      IF v_exp_id IS NOT NULL THEN
        -- Update existing experience
        UPDATE work_experiences
        SET
          company_name = v_exp->>'company_name',
          position_title = v_exp->>'position_title',
          location = v_exp->>'location',
          start_date = (v_exp->>'start_date')::DATE,
          end_date = (v_exp->>'end_date')::DATE,
          is_current = COALESCE((v_exp->>'is_current')::BOOLEAN, false),
          description = v_exp->>'description',
          display_order = COALESCE((v_exp->>'display_order')::INTEGER, 0),
          updated_at = NOW()
        WHERE id = v_exp_id AND profile_id = p_profile_id;
      ELSE
        -- Insert new experience
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
          p_profile_id,
          v_exp->>'company_name',
          v_exp->>'position_title',
          v_exp->>'location',
          (v_exp->>'start_date')::DATE,
          (v_exp->>'end_date')::DATE,
          COALESCE((v_exp->>'is_current')::BOOLEAN, false),
          v_exp->>'description',
          COALESCE((v_exp->>'display_order')::INTEGER, 0)
        );
      END IF;
    END LOOP;
  END IF;

  -- Handle skills (upsert)
  IF jsonb_array_length(p_skills) > 0 THEN
    FOR v_skill IN SELECT * FROM jsonb_array_elements(p_skills)
    LOOP
      v_skill_id := (v_skill->>'id')::UUID;

      IF v_skill_id IS NOT NULL THEN
        -- Update existing skill
        UPDATE skills
        SET
          skill_name = v_skill->>'skill_name',
          category = v_skill->>'category',
          proficiency_level = v_skill->>'proficiency_level',
          years_of_experience = (v_skill->>'years_of_experience')::INTEGER,
          display_order = COALESCE((v_skill->>'display_order')::INTEGER, 0)
        WHERE id = v_skill_id AND profile_id = p_profile_id;
      ELSE
        -- Insert new skill
        INSERT INTO skills (
          profile_id,
          skill_name,
          category,
          proficiency_level,
          years_of_experience,
          display_order
        )
        VALUES (
          p_profile_id,
          v_skill->>'skill_name',
          v_skill->>'category',
          v_skill->>'proficiency_level',
          (v_skill->>'years_of_experience')::INTEGER,
          COALESCE((v_skill->>'display_order')::INTEGER, 0)
        );
      END IF;
    END LOOP;
  END IF;

  -- Fetch and return the updated profile with all details
  SELECT to_jsonb(mp.*) INTO v_updated_profile
  FROM master_profiles mp
  WHERE mp.id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'current_version', v_current_version + 1,
    'error_message', NULL,
    'profile', v_updated_profile
  );
END;
$$;

-- ==================================
-- 2. GRANT PERMISSIONS
-- ==================================

GRANT EXECUTE ON FUNCTION update_master_profile_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION update_master_profile_with_details TO anon;

-- ==================================
-- 3. VERIFICATION
-- ==================================

DO $$
DECLARE
  v_function_count INTEGER;
BEGIN
  -- Check function exists
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name = 'update_master_profile_with_details';

  IF v_function_count = 0 THEN
    RAISE EXCEPTION 'Migration verification failed: update_master_profile_with_details function not found';
  END IF;

  RAISE NOTICE 'Migration 022 successful: Batch update function created';
END $$;

COMMIT;

-- ==================================
-- MIGRATION NOTES
-- ==================================

-- This migration adds update_master_profile_with_details RPC function that updates
-- the profile and all its related work_experiences and skills in a single transaction.
--
-- This drastically improves performance by reducing 50+ HTTP requests down to 1.
--
-- The function handles:
-- - Optimistic locking check on the profile
-- - Profile field updates
-- - Upsert work experiences (update if ID exists, insert if not)
-- - Upsert skills (update if ID exists, insert if not)
--
-- All operations are atomic - if any part fails, the entire transaction rolls back.
--
-- Note: This function doesn't handle deletions - the frontend should continue to
-- call deleteWorkExperience/deleteSkill separately when users explicitly remove items.
