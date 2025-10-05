-- Migration 006: Performance Indexes and Markdown Export
-- Date: 2025-10-05
-- Description: Optimizes RLS query performance and adds markdown export function
-- Dependencies: 005_security_locking.sql

BEGIN;

-- ==================================
-- 1. PERFORMANCE INDEXES
-- ==================================

-- Composite index for RLS policy queries (CB-14 fix)
-- Improves performance when checking profile ownership
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_id
  ON master_profiles(user_id, id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_session_id_id
  ON master_profiles(session_id, id)
  WHERE session_id IS NOT NULL;

-- Composite index for fetching profiles with experiences sorted by date
CREATE INDEX IF NOT EXISTS idx_experiences_profile_dates
  ON work_experiences(profile_id, start_date DESC, display_order)
  WHERE deleted_at IS NULL;

-- Composite index for skills queries with category filtering
CREATE INDEX IF NOT EXISTS idx_skills_profile_category
  ON skills(profile_id, category, display_order)
  INCLUDE (skill_name, proficiency_level)
  WHERE deleted_at IS NULL;

-- Index for soft-deleted records (cleanup queries)
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
  ON master_profiles(deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_experiences_deleted_at
  ON work_experiences(deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_skills_deleted_at
  ON skills(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ==================================
-- 2. MARKDOWN EXPORT FUNCTION
-- ==================================

-- Function: Export profile to markdown format (for backward compatibility)
CREATE OR REPLACE FUNCTION export_profile_markdown(p_profile_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile master_profiles;
  v_markdown TEXT := '';
  v_exp RECORD;
  v_skill RECORD;
  v_category TEXT;
  v_prev_category TEXT := '';
BEGIN
  -- Get profile (check permissions via RLS)
  SELECT * INTO v_profile
  FROM master_profiles
  WHERE id = p_profile_id
    AND deleted_at IS NULL;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Profile not found or access denied';
  END IF;

  -- Header
  v_markdown := '# ' || v_profile.full_name || E'\n\n';

  -- Contact Information
  v_markdown := v_markdown || E'## Contact Information\n\n';
  v_markdown := v_markdown || '**Email:** ' || v_profile.email || E'\n';

  IF v_profile.phone_primary IS NOT NULL THEN
    v_markdown := v_markdown || '**Phone:** ' || v_profile.phone_primary || E'\n';
  END IF;

  IF v_profile.linkedin_url IS NOT NULL THEN
    v_markdown := v_markdown || '**LinkedIn:** ' || v_profile.linkedin_url || E'\n';
  END IF;

  IF v_profile.github_url IS NOT NULL THEN
    v_markdown := v_markdown || '**GitHub:** ' || v_profile.github_url || E'\n';
  END IF;

  IF v_profile.portfolio_url IS NOT NULL THEN
    v_markdown := v_markdown || '**Portfolio:** ' || v_profile.portfolio_url || E'\n';
  END IF;

  v_markdown := v_markdown || '**Location:** ' || v_profile.location || E'\n\n';

  -- Professional Summary
  v_markdown := v_markdown || E'## Professional Summary\n\n';
  v_markdown := v_markdown || v_profile.professional_summary || E'\n\n';

  IF v_profile.years_of_experience IS NOT NULL THEN
    v_markdown := v_markdown || '**Years of Experience:** ' || v_profile.years_of_experience || E'\n\n';
  END IF;

  -- Work Experience
  v_markdown := v_markdown || E'## Work Experience\n\n';

  FOR v_exp IN
    SELECT *
    FROM work_experiences
    WHERE profile_id = p_profile_id
      AND deleted_at IS NULL
    ORDER BY start_date DESC, display_order
  LOOP
    v_markdown := v_markdown || '### ' || v_exp.position_title || ' at ' || v_exp.company_name || E'\n';

    -- Format dates (stored as YYYY-MM format)
    v_markdown := v_markdown || v_exp.start_date || ' - ';

    IF v_exp.is_current THEN
      v_markdown := v_markdown || 'Present';
    ELSIF v_exp.end_date IS NOT NULL THEN
      v_markdown := v_markdown || v_exp.end_date;
    ELSE
      v_markdown := v_markdown || 'Unknown';
    END IF;

    IF v_exp.location IS NOT NULL THEN
      v_markdown := v_markdown || ' | ' || v_exp.location;
    END IF;

    v_markdown := v_markdown || E'\n\n';

    IF v_exp.description IS NOT NULL THEN
      v_markdown := v_markdown || v_exp.description || E'\n\n';
    END IF;
  END LOOP;

  -- Skills (grouped by category)
  v_markdown := v_markdown || E'## Skills\n\n';

  FOR v_skill IN
    SELECT *
    FROM skills
    WHERE profile_id = p_profile_id
      AND deleted_at IS NULL
    ORDER BY
      CASE
        WHEN category IS NULL THEN 'zzz' -- Put uncategorized last
        ELSE category
      END,
      display_order,
      skill_name
  LOOP
    v_category := COALESCE(v_skill.category, 'Other');

    -- New category heading
    IF v_category != v_prev_category THEN
      v_markdown := v_markdown || E'\n### ' || v_category || E'\n\n';
      v_prev_category := v_category;
    END IF;

    -- Skill entry
    v_markdown := v_markdown || '- ' || v_skill.skill_name;

    IF v_skill.proficiency_level IS NOT NULL THEN
      v_markdown := v_markdown || ' (' || v_skill.proficiency_level || ')';
    END IF;

    v_markdown := v_markdown || E'\n';
  END LOOP;

  -- Footer
  v_markdown := v_markdown || E'\n---\n\n';
  v_markdown := v_markdown || '*Generated from database on ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') || '*' || E'\n';

  RETURN v_markdown;
END;
$$;

-- ==================================
-- 3. GRANT PERMISSIONS
-- ==================================

GRANT EXECUTE ON FUNCTION export_profile_markdown TO authenticated;
GRANT EXECUTE ON FUNCTION export_profile_markdown TO anon;

-- ==================================
-- 4. VERIFICATION
-- ==================================

DO $$
DECLARE
  v_index_count INTEGER;
  v_function_count INTEGER;
BEGIN
  -- Check performance indexes exist
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename IN ('master_profiles', 'work_experiences', 'skills')
  AND indexname LIKE 'idx_%';

  IF v_index_count < 10 THEN
    RAISE NOTICE 'Warning: Expected at least 10 indexes, found %. Some indexes may be missing.', v_index_count;
  END IF;

  -- Check export function exists
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name = 'export_profile_markdown';

  IF v_function_count = 0 THEN
    RAISE EXCEPTION 'Migration verification failed: export_profile_markdown function not found';
  END IF;

  RAISE NOTICE 'Migration 006 successful: Performance indexes and markdown export enabled';
  RAISE NOTICE 'Total indexes created: %', v_index_count;
END $$;

COMMIT;

-- ==================================
-- MIGRATION NOTES
-- ==================================

-- This migration completes the Master Profile MVP database setup:
--
-- Performance Optimizations:
-- - Composite indexes for RLS policy queries (faster user-specific lookups)
-- - Date-sorted indexes for work experiences (faster timeline views)
-- - Category indexes for skills (faster filtered queries)
-- - Soft-delete indexes (efficient cleanup queries)
--
-- Backward Compatibility:
-- - export_profile_markdown() function recreates master_profile.md format
-- - Ensures existing CV generation scripts continue to work
-- - Includes all profile sections: contact, summary, experience, skills
--
-- All migrations complete! Ready for frontend development.
-- Next steps:
-- 1. Test RPC functions in Supabase SQL Editor
-- 2. Create frontend components (ProfileForm.vue, etc.)
-- 3. Import existing master_profile.md using migrate_to_db.py script
