-- Migration 019: Fix update_master_profile to return full profile data
-- Date: 2025-10-06
-- Description: Fixes the update_master_profile RPC to return complete profile instead of just success status
-- Dependencies: 004_profile_transactions.sql, 005_security_locking.sql

BEGIN;

-- ==================================
-- UPDATE RPC FUNCTION
-- ==================================

-- Function: Update Master Profile (Returns full updated profile)
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
  v_session_id TEXT;
  v_updated_profile JSONB;
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

  -- Update profile (only provided fields)
  UPDATE master_profiles
  SET
    profile_name = COALESCE(p_updates->>'profile_name', profile_name),
    is_default = COALESCE((p_updates->>'is_default')::BOOLEAN, is_default),
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

  -- Fetch and return the updated profile
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
-- VERIFICATION
-- ==================================

DO $$
DECLARE
  v_function_count INTEGER;
BEGIN
  -- Check update_master_profile function exists
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name = 'update_master_profile';

  IF v_function_count = 0 THEN
    RAISE EXCEPTION 'Migration verification failed: update_master_profile function not found';
  END IF;

  RAISE NOTICE 'Migration 019 successful: update_master_profile now returns full profile data';
END $$;

COMMIT;

-- ==================================
-- MIGRATION NOTES
-- ==================================

-- This migration fixes the return value of update_master_profile to include
-- the complete updated profile data, not just a success status.
--
-- New return format:
-- {
--   "success": true/false,
--   "current_version": number,
--   "error_message": string/null,
--   "profile": { ...full profile object... } or null
-- }
--
-- This resolves the 520 error on profile updates caused by the frontend
-- expecting profile data but receiving only status information.
