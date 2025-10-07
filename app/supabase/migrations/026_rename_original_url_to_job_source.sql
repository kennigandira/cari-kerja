-- Migration 026: Rename original_url to job_source
-- Created: 2025-10-07
-- Purpose: Replace original_url with flexible job_source field (required, TEXT type)
-- Related: Feature request to track application submission sources (URL, email, or text)

BEGIN;

-- Step 1: Rename column (preserves existing data)
ALTER TABLE jobs
  RENAME COLUMN original_url TO job_source;

-- Step 2: Add NOT NULL constraint with default for new records
-- Use "external" as default for jobs without explicit source
ALTER TABLE jobs
  ALTER COLUMN job_source SET DEFAULT 'external';

-- Step 3: Update existing NULL or empty values to "external"
UPDATE jobs
SET job_source = 'external'
WHERE job_source IS NULL OR job_source = '';

-- Step 4: Now make it NOT NULL (safe after backfill)
ALTER TABLE jobs
  ALTER COLUMN job_source SET NOT NULL;

-- Step 5: Add length constraint (1-500 characters)
ALTER TABLE jobs
  ADD CONSTRAINT check_job_source_length
    CHECK (length(job_source) > 0 AND length(job_source) <= 500);

-- Step 6: Update column comment
COMMENT ON COLUMN jobs.job_source IS 'Where to submit application: URL, email, or portal name (required, 1-500 chars)';

COMMIT;

-- Rollback script (if needed):
-- BEGIN;
-- ALTER TABLE jobs DROP CONSTRAINT IF EXISTS check_job_source_length;
-- ALTER TABLE jobs ALTER COLUMN job_source DROP NOT NULL;
-- ALTER TABLE jobs ALTER COLUMN job_source DROP DEFAULT;
-- ALTER TABLE jobs RENAME COLUMN job_source TO original_url;
-- COMMIT;
