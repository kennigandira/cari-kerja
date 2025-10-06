-- Migration 021: Remove version check triggers from child tables
-- Date: 2025-10-06
-- Description: Removes optimistic locking triggers from work_experiences and skills tables
-- Dependencies: 005_security_locking.sql

BEGIN;

-- ==================================
-- 1. REMOVE VERSION CHECK TRIGGERS FROM CHILD TABLES
-- ==================================

-- Drop version check trigger from work_experiences
-- Work experiences are child records that don't have concurrent editing scenarios
-- The version field remains for audit purposes but doesn't need enforcement
DROP TRIGGER IF EXISTS trg_work_experiences_version_check ON work_experiences;

-- Drop version check trigger from skills (if exists)
-- Skills are also child records without concurrent editing needs
DROP TRIGGER IF EXISTS trg_skills_version_check ON skills;

-- Note: We keep the trigger on master_profiles where it's actually needed
-- Master profiles have optimistic locking because users directly edit them in the UI

-- ==================================
-- 2. VERIFICATION
-- ==================================

DO $$
DECLARE
  v_master_profile_trigger INTEGER;
  v_work_exp_trigger INTEGER;
  v_skills_trigger INTEGER;
BEGIN
  -- Verify master_profiles trigger still exists
  SELECT COUNT(*) INTO v_master_profile_trigger
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
  AND event_object_table = 'master_profiles'
  AND trigger_name = 'trg_master_profiles_version_check';

  IF v_master_profile_trigger = 0 THEN
    RAISE EXCEPTION 'Migration verification failed: master_profiles version trigger was accidentally removed';
  END IF;

  -- Verify work_experiences trigger was removed
  SELECT COUNT(*) INTO v_work_exp_trigger
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
  AND event_object_table = 'work_experiences'
  AND trigger_name = 'trg_work_experiences_version_check';

  IF v_work_exp_trigger > 0 THEN
    RAISE EXCEPTION 'Migration verification failed: work_experiences version trigger still exists';
  END IF;

  -- Verify skills trigger was removed (if it existed)
  SELECT COUNT(*) INTO v_skills_trigger
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
  AND event_object_table = 'skills'
  AND trigger_name = 'trg_skills_version_check';

  IF v_skills_trigger > 0 THEN
    RAISE EXCEPTION 'Migration verification failed: skills version trigger still exists';
  END IF;

  RAISE NOTICE 'Migration 021 successful: Version check triggers removed from child tables, kept on master_profiles';
END $$;

COMMIT;

-- ==================================
-- MIGRATION NOTES
-- ==================================

-- This migration removes the version check triggers from work_experiences and skills tables
-- that were added in migration 005.
--
-- Reason: These child tables don't have concurrent editing scenarios that require
-- optimistic locking. Users edit work experiences and skills through the parent
-- profile form, not independently. The version conflict trigger was causing updates
-- to fail because the frontend sends the complete object including the current version,
-- which the trigger interpreted as trying to set version to the same value instead
-- of incrementing it.
--
-- The master_profiles table retains its version check trigger because profiles
-- are edited directly by users and do need optimistic locking protection.
--
-- The version field remains in work_experiences and skills tables for audit purposes,
-- but is no longer enforced by triggers.
