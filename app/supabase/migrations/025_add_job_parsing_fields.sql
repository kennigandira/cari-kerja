-- Migration 025: Add Job Parser Metadata Fields
-- Created: 2025-10-06
-- Purpose: Store parsing metadata for AI-powered job extraction
-- Related: docs/features/kanban_job_tracker/job_parser/
-- Architecture: Cloudflare Workers + Jina AI Reader + Claude Sonnet 4.5

BEGIN;

-- Step 1: Add new columns for job parser metadata
ALTER TABLE jobs
  ADD COLUMN parsing_source TEXT,
  ADD COLUMN parsing_confidence INTEGER,
  ADD COLUMN parsing_model TEXT DEFAULT 'claude-sonnet-4.5-20250514',
  ADD COLUMN raw_content TEXT;

-- Step 2: Add constraints
ALTER TABLE jobs
  ADD CONSTRAINT check_parsing_source
    CHECK (parsing_source IS NULL OR parsing_source IN ('url_jina', 'manual_paste'));

ALTER TABLE jobs
  ADD CONSTRAINT check_parsing_confidence
    CHECK (parsing_confidence IS NULL OR (parsing_confidence >= 0 AND parsing_confidence <= 100));

-- Step 3: Add indexes for analytics queries
CREATE INDEX idx_jobs_parsing_source ON jobs(parsing_source)
  WHERE parsing_source IS NOT NULL;

CREATE INDEX idx_jobs_parsing_confidence ON jobs(parsing_confidence)
  WHERE parsing_confidence IS NOT NULL;

-- Composite index for filtering by source and confidence
CREATE INDEX idx_jobs_parsing_metadata ON jobs(parsing_source, parsing_confidence)
  WHERE parsing_source IS NOT NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN jobs.parsing_source IS 'How job was added: url_jina (Jina AI scraping) or manual_paste';
COMMENT ON COLUMN jobs.parsing_confidence IS 'AI confidence score 0-100 from Claude extraction';
COMMENT ON COLUMN jobs.parsing_model IS 'AI model used for extraction (e.g., claude-sonnet-4.5-20250514)';
COMMENT ON COLUMN jobs.raw_content IS 'Original HTML/markdown content for re-parsing if needed';

COMMIT;

-- Rollback script (if needed):
-- BEGIN;
-- DROP INDEX IF EXISTS idx_jobs_parsing_metadata;
-- DROP INDEX IF EXISTS idx_jobs_parsing_confidence;
-- DROP INDEX IF EXISTS idx_jobs_parsing_source;
-- ALTER TABLE jobs
--   DROP CONSTRAINT IF EXISTS check_parsing_confidence,
--   DROP CONSTRAINT IF EXISTS check_parsing_source,
--   DROP COLUMN IF EXISTS raw_content,
--   DROP COLUMN IF EXISTS parsing_model,
--   DROP COLUMN IF EXISTS parsing_confidence,
--   DROP COLUMN IF EXISTS parsing_source;
-- COMMIT;
