-- Migration 020: Fix RLS Policies for work_experiences and skills
-- Date: 2025-10-06
-- Description: Updates RLS policies to include session_id checks for pre-auth users
-- Dependencies: 005_security_locking.sql

BEGIN;

-- ==================================
-- 1. UPDATE WORK_EXPERIENCES RLS POLICIES
-- ==================================

-- Drop and recreate INSERT policy with session_id support
DROP POLICY IF EXISTS "Users can create work experiences" ON work_experiences;
CREATE POLICY "Users can create work experiences"
  ON work_experiences FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = work_experiences.profile_id
    AND p.deleted_at IS NULL
    AND (
      (p.user_id IS NOT NULL AND auth.uid() = p.user_id)
      OR (p.user_id IS NULL AND p.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  ));

-- Drop and recreate UPDATE policy with session_id support
DROP POLICY IF EXISTS "Users can update work experiences" ON work_experiences;
CREATE POLICY "Users can update own non-deleted work experiences"
  ON work_experiences FOR UPDATE
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

-- Drop and recreate DELETE policy with session_id support
DROP POLICY IF EXISTS "Users can delete work experiences" ON work_experiences;
CREATE POLICY "Users can delete own non-deleted work experiences"
  ON work_experiences FOR DELETE
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

-- ==================================
-- 2. UPDATE SKILLS RLS POLICIES
-- ==================================

-- Drop and recreate INSERT policy with session_id support
DROP POLICY IF EXISTS "Users can create skills" ON skills;
CREATE POLICY "Users can create skills"
  ON skills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = skills.profile_id
    AND p.deleted_at IS NULL
    AND (
      (p.user_id IS NOT NULL AND auth.uid() = p.user_id)
      OR (p.user_id IS NULL AND p.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  ));

-- Drop and recreate UPDATE policy with session_id support
DROP POLICY IF EXISTS "Users can update skills" ON skills;
CREATE POLICY "Users can update own non-deleted skills"
  ON skills FOR UPDATE
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

-- Drop and recreate DELETE policy with session_id support
DROP POLICY IF EXISTS "Users can delete skills" ON skills;
CREATE POLICY "Users can delete own non-deleted skills"
  ON skills FOR DELETE
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
-- 3. VERIFICATION
-- ==================================

DO $$
DECLARE
  v_work_exp_policies INTEGER;
  v_skills_policies INTEGER;
BEGIN
  -- Check work_experiences policies
  SELECT COUNT(*) INTO v_work_exp_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'work_experiences'
  AND policyname IN (
    'Users can create work experiences',
    'Users can update own non-deleted work experiences',
    'Users can delete own non-deleted work experiences',
    'Users can view own non-deleted work experiences'
  );

  IF v_work_exp_policies <> 4 THEN
    RAISE EXCEPTION 'Migration verification failed: expected 4 work_experiences policies, found %', v_work_exp_policies;
  END IF;

  -- Check skills policies
  SELECT COUNT(*) INTO v_skills_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'skills'
  AND policyname IN (
    'Users can create skills',
    'Users can update own non-deleted skills',
    'Users can delete own non-deleted skills',
    'Users can view own non-deleted skills'
  );

  IF v_skills_policies <> 4 THEN
    RAISE EXCEPTION 'Migration verification failed: expected 4 skills policies, found %', v_skills_policies;
  END IF;

  RAISE NOTICE 'Migration 020 successful: RLS policies updated for work_experiences and skills';
END $$;

COMMIT;

-- ==================================
-- MIGRATION NOTES
-- ==================================

-- This migration fixes the RLS policies for work_experiences and skills tables
-- to include session_id checks for pre-auth users.
--
-- Migration 005 added session_id support for master_profiles but didn't update
-- the policies for related tables, causing CORS/permission errors when updating
-- work experiences or skills.
--
-- Changes:
-- - All policies now check both user_id (authenticated) and session_id (pre-auth)
-- - All policies now filter out soft-deleted records (deleted_at IS NULL)
-- - Policy names updated to match the pattern from migration 005
