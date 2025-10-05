-- Migration 010: Fix session_id Unique Constraint
-- Date: 2025-10-05
-- Description: Allow multiple profiles per authenticated user by making session_id unique only for pre-auth profiles
-- Issue: idx_profiles_session_id prevents authenticated users from creating multiple profiles

BEGIN;

-- Drop the overly restrictive unique index
DROP INDEX IF EXISTS idx_profiles_session_id;

-- Create a new unique index that only applies to pre-auth profiles (user_id IS NULL)
-- This allows:
-- 1. Pre-auth users: ONE profile per session (prevents session hijacking)
-- 2. Authenticated users: MULTIPLE profiles (no session_id restriction)
CREATE UNIQUE INDEX idx_profiles_session_id_preauth
  ON master_profiles(session_id)
  WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Verification
DO $$
DECLARE
  v_index_count INTEGER;
BEGIN
  -- Check old index is gone
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname = 'idx_profiles_session_id';

  IF v_index_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: old index still exists';
  END IF;

  -- Check new index exists
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname = 'idx_profiles_session_id_preauth';

  IF v_index_count = 0 THEN
    RAISE EXCEPTION 'Migration failed: new index not created';
  END IF;

  RAISE NOTICE 'Migration 010 successful: session_id constraint fixed';
END $$;

COMMIT;

-- Migration Notes:
-- Before: session_id must be unique for ALL profiles (blocks multiple profiles per user)
-- After: session_id must be unique ONLY for pre-auth profiles (user_id IS NULL)
--
-- This allows authenticated users to create multiple profiles while maintaining
-- security for pre-authentication scenarios.
