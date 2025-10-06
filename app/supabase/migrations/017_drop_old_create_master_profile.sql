-- Migration 017: Drop Old create_master_profile Function
-- Date: 2025-10-06
-- Description: Remove function overloading conflict
-- Issue: Two versions of create_master_profile exist causing PGRST203 error

BEGIN;

-- Drop the old 3-parameter version
DROP FUNCTION IF EXISTS create_master_profile(JSONB, JSONB, JSONB);

-- Keep the new 5-parameter version (already exists from migration 016)

COMMIT;

-- Migration Notes:
-- Removes function overloading conflict between:
--   - create_master_profile(p_profile, p_experiences, p_skills)
--   - create_master_profile(p_profile, p_experiences, p_skills, p_education, p_certifications)
--
-- Now only the 5-parameter version exists
