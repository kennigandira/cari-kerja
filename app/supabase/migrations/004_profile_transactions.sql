-- Migration 004: Master Profile Tables + Transaction RPC Functions
-- Date: 2025-10-05
-- Description: Core tables for master profiles with atomic transaction support
-- Dependencies: None (first profile-related migration)

BEGIN;

-- ==================================
-- 1. ENABLE EXTENSIONS
-- ==================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================
-- 2. CREATE TABLES
-- ==================================

-- Master Profiles Table
CREATE TABLE IF NOT EXISTS master_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- NULL allowed for pre-auth profiles
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Identification
  profile_name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT true NOT NULL,

  -- Contact Information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_primary VARCHAR(50),
  phone_secondary VARCHAR(50),
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  location VARCHAR(255) NOT NULL,

  -- Professional Summary
  professional_summary TEXT NOT NULL,
  years_of_experience INTEGER,
  current_position VARCHAR(255),

  -- Versioning (optimistic locking)
  version INTEGER DEFAULT 1 NOT NULL,

  -- Constraints
  CONSTRAINT unique_profile_name_per_user UNIQUE NULLS NOT DISTINCT (user_id, profile_name),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_summary_length CHECK (LENGTH(professional_summary) >= 50 AND LENGTH(professional_summary) <= 2000),
  CONSTRAINT valid_years_experience CHECK (years_of_experience IS NULL OR (years_of_experience >= 0 AND years_of_experience <= 50))
);

-- Work Experiences Table
CREATE TABLE IF NOT EXISTS work_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES master_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  company_name VARCHAR(255) NOT NULL,
  position_title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false NOT NULL,
  description TEXT,

  display_order INTEGER DEFAULT 0 NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,

  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT current_no_end_date CHECK (NOT (is_current = true AND end_date IS NOT NULL)),
  CONSTRAINT valid_start_date CHECK (start_date >= '1960-01-01' AND start_date <= CURRENT_DATE + INTERVAL '1 year')
);

-- Skills Table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES master_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  skill_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  proficiency_level VARCHAR(50),
  years_of_experience INTEGER,

  display_order INTEGER DEFAULT 0 NOT NULL,

  CONSTRAINT unique_skill_per_profile UNIQUE (profile_id, skill_name),
  CONSTRAINT valid_proficiency CHECK (proficiency_level IS NULL OR proficiency_level IN ('Expert', 'Advanced', 'Intermediate', 'Beginner')),
  CONSTRAINT valid_skill_years CHECK (years_of_experience IS NULL OR (years_of_experience >= 0 AND years_of_experience <= 50))
);

-- ==================================
-- 3. CREATE INDEXES
-- ==================================

CREATE INDEX idx_profiles_user_id ON master_profiles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_profiles_user_default ON master_profiles(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_experiences_profile ON work_experiences(profile_id, display_order);
CREATE INDEX idx_skills_profile ON skills(profile_id, category, display_order);

-- ==================================
-- 4. CREATE TRIGGERS
-- ==================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_master_profiles
  BEFORE UPDATE ON master_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_work_experiences
  BEFORE UPDATE ON work_experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================================
-- 5. CREATE RPC FUNCTIONS
-- ==================================

-- Function: Create Master Profile (Atomic Transaction)
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
  v_exp JSONB;
  v_skill JSONB;
BEGIN
  -- Get authenticated user ID (NULL if not authenticated)
  v_user_id := auth.uid();

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
        (v_exp->>'start_date')::DATE,
        (v_exp->>'end_date')::DATE,
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

-- Function: Update Master Profile (Atomic Transaction with Optimistic Locking)
CREATE OR REPLACE FUNCTION update_master_profile(
  p_profile_id UUID,
  p_expected_version INTEGER,
  p_updates JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_version INTEGER;
  v_user_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  -- Lock row and get current version
  SELECT version INTO v_current_version
  FROM master_profiles
  WHERE id = p_profile_id
    AND (user_id IS NULL OR user_id = v_user_id)
  FOR UPDATE;

  -- Check if profile exists and user has access
  IF v_current_version IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'current_version', NULL,
      'error_message', 'Profile not found or access denied'
    );
  END IF;

  -- Check version conflict
  IF v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false,
      'current_version', v_current_version,
      'error_message', 'Version conflict: Profile was modified by another session'
    );
  END IF;

  -- Update profile (only provided fields)
  UPDATE master_profiles
  SET
    profile_name = COALESCE(p_updates->>'profile_name', profile_name),
    full_name = COALESCE(p_updates->>'full_name', full_name),
    email = COALESCE(p_updates->>'email', email),
    phone_primary = COALESCE(p_updates->>'phone_primary', phone_primary),
    phone_secondary = COALESCE(p_updates->>'phone_secondary', phone_secondary),
    linkedin_url = COALESCE(p_updates->>'linkedin_url', linkedin_url),
    github_url = COALESCE(p_updates->>'github_url', github_url),
    portfolio_url = COALESCE(p_updates->>'portfolio_url', portfolio_url),
    location = COALESCE(p_updates->>'location', location),
    professional_summary = COALESCE(p_updates->>'professional_summary', professional_summary),
    years_of_experience = COALESCE((p_updates->>'years_of_experience')::INTEGER, years_of_experience),
    current_position = COALESCE(p_updates->>'current_position', current_position),
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'current_version', v_current_version + 1,
    'error_message', NULL
  );
END;
$$;

-- Function: Soft Delete Profile
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

  -- Note: Actual soft delete columns added in migration 005
  -- This function will be updated in 005 to set deleted_at
  -- For now, it's a placeholder that checks permissions

  -- Verify user owns the profile
  PERFORM 1
  FROM master_profiles
  WHERE id = p_profile_id
    AND (user_id IS NULL OR user_id = v_user_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found or access denied';
  END IF;

  -- Actual deletion will be updated in migration 005
  RAISE NOTICE 'Profile % marked for deletion (soft delete will be enabled in migration 005)', p_profile_id;
END;
$$;

-- ==================================
-- 6. ROW LEVEL SECURITY
-- ==================================

ALTER TABLE master_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for master_profiles
CREATE POLICY "Users can view own profiles"
  ON master_profiles FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create profiles"
  ON master_profiles FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
  ON master_profiles FOR UPDATE
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
  ON master_profiles FOR DELETE
  USING (user_id IS NULL OR auth.uid() = user_id);

-- RLS Policies for work_experiences
CREATE POLICY "Users can view own work experiences"
  ON work_experiences FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = work_experiences.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can create work experiences"
  ON work_experiences FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = work_experiences.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can update work experiences"
  ON work_experiences FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = work_experiences.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can delete work experiences"
  ON work_experiences FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = work_experiences.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

-- RLS Policies for skills
CREATE POLICY "Users can view own skills"
  ON skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = skills.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can create skills"
  ON skills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = skills.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can update skills"
  ON skills FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = skills.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can delete skills"
  ON skills FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = skills.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

-- ==================================
-- 7. GRANT PERMISSIONS
-- ==================================

GRANT EXECUTE ON FUNCTION create_master_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_master_profile TO anon;
GRANT EXECUTE ON FUNCTION update_master_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_master_profile TO anon;
GRANT EXECUTE ON FUNCTION soft_delete_profile TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_profile TO anon;

-- ==================================
-- 8. VERIFICATION
-- ==================================

DO $$
DECLARE
  v_table_count INTEGER;
  v_function_count INTEGER;
BEGIN
  -- Check tables created
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('master_profiles', 'work_experiences', 'skills');

  IF v_table_count <> 3 THEN
    RAISE EXCEPTION 'Migration verification failed: expected 3 tables, found %', v_table_count;
  END IF;

  -- Check RPC functions created
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('create_master_profile', 'update_master_profile', 'soft_delete_profile');

  IF v_function_count <> 3 THEN
    RAISE EXCEPTION 'Migration verification failed: expected 3 functions, found %', v_function_count;
  END IF;

  RAISE NOTICE 'Migration 004 successful: % tables, % functions created', v_table_count, v_function_count;
END $$;

COMMIT;

-- ==================================
-- MIGRATION NOTES
-- ==================================

-- This migration creates the core profile tables and RPC functions for atomic transactions.
-- It fixes CB-1 (Transaction Integrity) by using stored procedures.
--
-- Security note: The NULL user_id pattern still has a security hole (CB-9).
-- This will be fixed in migration 005 with session_id approach.
--
-- Soft delete is not yet implemented - placeholder function exists.
-- Full soft delete will be added in migration 005.
--
-- Next: Run migration 005_security_locking.sql
