# Database Schema: Job Parser Metadata

**Version:** 1.0
**Date:** October 6, 2025
**Status:** Approved
**Related:** TechnicalArchitecture.md, APISpecification.md

---

## Overview

This document describes the database schema changes required to support the AI-Powered Job Parser feature. We add **4 new columns** to the existing `jobs` table to store parsing metadata.

**Migration File:** `023_add_job_parsing_fields.sql`

**Design Principle:** Extend existing schema rather than create new tables (minimal complexity).

---

## Schema Changes

### New Columns in `jobs` Table

```sql
ALTER TABLE jobs
  ADD COLUMN parsing_source TEXT CHECK (parsing_source IN ('url_jina', 'manual_paste')),
  ADD COLUMN parsing_confidence INTEGER CHECK (parsing_confidence >= 0 AND parsing_confidence <= 100),
  ADD COLUMN parsing_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  ADD COLUMN raw_content TEXT;
```

### Column Descriptions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `parsing_source` | TEXT | YES | NULL | How the job was added: `url_jina` (scraped via Jina AI) or `manual_paste` |
| `parsing_confidence` | INTEGER | YES | NULL | AI confidence score 0-100 from Claude extraction |
| `parsing_model` | TEXT | YES | `claude-sonnet-4-20250514` | AI model used for extraction |
| `raw_content` | TEXT | YES | NULL | Original HTML/markdown content (for re-parsing if needed) |

**Why nullable?**
- Existing jobs (created before parser feature) won't have these fields
- Legacy jobs can coexist with new parsed jobs

---

## Complete Migration Script

### File: `app/supabase/migrations/023_add_job_parsing_fields.sql`

```sql
-- Migration 023: Add Job Parser Metadata Fields
-- Created: 2025-10-06
-- Purpose: Store parsing metadata for AI-powered job extraction
-- Related: docs/features/kanban_job_tracker/job_parser/

BEGIN;

-- Step 1: Add new columns
ALTER TABLE jobs
  ADD COLUMN parsing_source TEXT,
  ADD COLUMN parsing_confidence INTEGER,
  ADD COLUMN parsing_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  ADD COLUMN raw_content TEXT;

-- Step 2: Add constraints
ALTER TABLE jobs
  ADD CONSTRAINT check_parsing_source
    CHECK (parsing_source IS NULL OR parsing_source IN ('url_jina', 'manual_paste'));

ALTER TABLE jobs
  ADD CONSTRAINT check_parsing_confidence
    CHECK (parsing_confidence IS NULL OR (parsing_confidence >= 0 AND parsing_confidence <= 100));

-- Step 3: Add indexes for analytics
CREATE INDEX idx_jobs_parsing_source ON jobs(parsing_source)
  WHERE parsing_source IS NOT NULL;

CREATE INDEX idx_jobs_parsing_confidence ON jobs(parsing_confidence)
  WHERE parsing_confidence IS NOT NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN jobs.parsing_source IS 'How job was added: url_jina (Jina AI scraping) or manual_paste';
COMMENT ON COLUMN jobs.parsing_confidence IS 'AI confidence score 0-100 from Claude extraction';
COMMENT ON COLUMN jobs.parsing_model IS 'AI model used for extraction (e.g., claude-sonnet-4-20250514)';
COMMENT ON COLUMN jobs.raw_content IS 'Original HTML/markdown content for re-parsing if needed';

COMMIT;

-- Rollback script (if needed):
-- BEGIN;
-- ALTER TABLE jobs
--   DROP COLUMN IF EXISTS parsing_source,
--   DROP COLUMN IF EXISTS parsing_confidence,
--   DROP COLUMN IF EXISTS parsing_model,
--   DROP COLUMN IF EXISTS raw_content;
-- DROP INDEX IF EXISTS idx_jobs_parsing_source;
-- DROP INDEX IF EXISTS idx_jobs_parsing_confidence;
-- COMMIT;
```

---

## Existing `jobs` Table Schema (Reference)

For context, here's the existing schema that we're extending:

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Input data (existing)
  input_type TEXT CHECK (input_type IN ('url', 'text')) NOT NULL,
  input_content TEXT NOT NULL,
  original_url TEXT,

  -- Extracted metadata (existing)
  company_name TEXT,
  position_title TEXT,
  location TEXT,
  posted_date TIMESTAMP WITH TIME ZONE,
  salary_range TEXT,
  job_type TEXT, -- full-time, contract, remote, hybrid

  -- Job description (existing)
  job_description_html TEXT,
  job_description_text TEXT,

  -- Match analysis (existing)
  match_percentage INTEGER CHECK (match_percentage >= 0 AND match_percentage <= 100),
  match_analysis JSONB,

  -- Kanban status (existing)
  status TEXT DEFAULT 'processing' CHECK (status IN (
    'processing',
    'to_submit',
    'waiting_for_call',
    'ongoing',
    'success',
    'not_now'
  )),
  kanban_order INTEGER DEFAULT 0,

  -- Application folder path (existing)
  folder_path TEXT,

  -- NEW: Parser metadata (Migration 023)
  parsing_source TEXT CHECK (parsing_source IN ('url_jina', 'manual_paste')),
  parsing_confidence INTEGER CHECK (parsing_confidence >= 0 AND parsing_confidence <= 100),
  parsing_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  raw_content TEXT
);
```

---

## Data Examples

### Example 1: Job Added via URL (Jina AI)

```sql
INSERT INTO jobs (
  input_type,
  input_content,
  original_url,
  company_name,
  position_title,
  location,
  salary_range,
  job_type,
  job_description_text,
  parsing_source,
  parsing_confidence,
  parsing_model,
  raw_content,
  status
) VALUES (
  'url',
  'https://jobs.airbnb.com/positions/5678',
  'https://jobs.airbnb.com/positions/5678',
  'Airbnb',
  'Senior Frontend Engineer',
  'Bangkok, Thailand',
  '80,000 - 120,000 THB/month',
  'full-time',
  'We are seeking a Senior Frontend Engineer to join our team in Bangkok...',
  'url_jina',
  95,
  'claude-sonnet-4-20250514',
  '# Senior Frontend Engineer\n\nAirbnb is hiring for a Senior Frontend Engineer position...',
  'processing'
);
```

### Example 2: Job Added via Manual Paste

```sql
INSERT INTO jobs (
  input_type,
  input_content,
  original_url,
  company_name,
  position_title,
  location,
  salary_range,
  job_type,
  job_description_text,
  parsing_source,
  parsing_confidence,
  parsing_model,
  raw_content,
  status
) VALUES (
  'text',
  'Senior Frontend Engineer at Grab\n\nLocation: Bangkok...',
  NULL,
  'Grab',
  'Senior Frontend Engineer',
  'Bangkok, Thailand',
  '100,000 - 150,000 THB/month',
  'full-time',
  'We are looking for an experienced frontend engineer...',
  'manual_paste',
  88,
  'claude-sonnet-4-20250514',
  'Senior Frontend Engineer at Grab\n\nLocation: Bangkok...',
  'processing'
);
```

### Example 3: Legacy Job (Pre-Parser)

```sql
-- Legacy job created before parser feature
-- parsing_* fields are NULL
SELECT
  id,
  company_name,
  position_title,
  parsing_source,      -- NULL
  parsing_confidence,  -- NULL
  parsing_model,       -- NULL
  raw_content          -- NULL
FROM jobs
WHERE created_at < '2025-10-07';
```

---

## Analytics Queries

### Query 1: Parser Success Rate

```sql
-- Calculate success rate by parsing source
SELECT
  parsing_source,
  COUNT(*) AS total_jobs,
  AVG(parsing_confidence) AS avg_confidence,
  COUNT(*) FILTER (WHERE parsing_confidence >= 80) AS high_confidence,
  ROUND(100.0 * COUNT(*) FILTER (WHERE parsing_confidence >= 80) / COUNT(*), 2) AS success_rate_pct
FROM jobs
WHERE parsing_source IS NOT NULL
GROUP BY parsing_source;

-- Expected output:
-- parsing_source | total_jobs | avg_confidence | high_confidence | success_rate_pct
-- url_jina       | 75         | 87.3           | 68              | 90.67
-- manual_paste   | 25         | 82.1           | 21              | 84.00
```

### Query 2: Low Confidence Jobs (Need Review)

```sql
-- Find jobs with low confidence that might need manual review
SELECT
  id,
  company_name,
  position_title,
  parsing_confidence,
  parsing_source,
  created_at
FROM jobs
WHERE parsing_confidence < 70
ORDER BY parsing_confidence ASC, created_at DESC
LIMIT 10;
```

### Query 3: Parsing Source Distribution

```sql
-- Compare URL vs manual paste usage
SELECT
  parsing_source,
  COUNT(*) AS count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM jobs
WHERE parsing_source IS NOT NULL
GROUP BY parsing_source;

-- Expected output:
-- parsing_source | count | percentage
-- url_jina       | 85    | 85.00
-- manual_paste   | 15    | 15.00
```

### Query 4: AI Model Usage Over Time

```sql
-- Track which AI models were used (if we upgrade models in future)
SELECT
  parsing_model,
  COUNT(*) AS jobs_parsed,
  AVG(parsing_confidence) AS avg_confidence,
  MIN(created_at) AS first_used,
  MAX(created_at) AS last_used
FROM jobs
WHERE parsing_model IS NOT NULL
GROUP BY parsing_model
ORDER BY first_used DESC;
```

---

## Re-Parsing Strategy

### Why Store `raw_content`?

If we improve the AI prompt in the future, we can re-parse all jobs without re-fetching URLs.

### Re-Parse All Jobs Script

```sql
-- Step 1: Create function to re-parse jobs
CREATE OR REPLACE FUNCTION reparse_job(job_id UUID)
RETURNS VOID AS $$
DECLARE
  raw TEXT;
BEGIN
  -- Get raw content
  SELECT raw_content INTO raw
  FROM jobs
  WHERE id = job_id;

  IF raw IS NULL THEN
    RAISE EXCEPTION 'No raw content available for job %', job_id;
  END IF;

  -- Call Edge Function to re-parse
  -- (This would be done from application code, not pure SQL)
  -- For now, just mark that re-parsing is needed
  UPDATE jobs
  SET status = 'processing'
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Re-parse low confidence jobs
-- (Run from application code)
-- for each job with confidence < 70:
--   1. Fetch raw_content
--   2. Call Edge Function with improved prompt
--   3. Update jobs table with new extraction
```

### Re-Parse Trigger (Future Enhancement)

```sql
-- Auto-trigger re-parse when prompt version changes
CREATE TABLE parsing_prompts (
  version INTEGER PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- When new prompt added, re-parse all jobs with old version
-- (Implementation left for Phase 2)
```

---

## Storage Considerations

### Size Estimates

| Field | Average Size | 100 Jobs | 1000 Jobs |
|-------|--------------|----------|-----------|
| `raw_content` | 3 KB | 300 KB | 3 MB |
| `parsing_source` | 20 bytes | 2 KB | 20 KB |
| `parsing_confidence` | 4 bytes | 400 bytes | 4 KB |
| `parsing_model` | 50 bytes | 5 KB | 50 KB |
| **Total New** | ~3 KB | ~300 KB | ~3 MB |

**Supabase Free Tier:** 500 MB storage
**Impact:** Negligible (0.06% for 100 jobs, 0.6% for 1000 jobs)

---

## Indexes

### Index Strategy

```sql
-- Index on parsing_source (partial index - only non-NULL values)
CREATE INDEX idx_jobs_parsing_source ON jobs(parsing_source)
  WHERE parsing_source IS NOT NULL;

-- Index on parsing_confidence (for analytics queries)
CREATE INDEX idx_jobs_parsing_confidence ON jobs(parsing_confidence)
  WHERE parsing_confidence IS NOT NULL;

-- Composite index for filtering
CREATE INDEX idx_jobs_parsing_metadata ON jobs(parsing_source, parsing_confidence)
  WHERE parsing_source IS NOT NULL;
```

**Why partial indexes?**
- Legacy jobs (pre-parser) have NULL values
- Partial indexes are smaller and faster
- Only index rows that will be queried

---

## Row-Level Security (RLS)

No changes needed. Existing RLS policies on `jobs` table automatically apply to new columns:

```sql
-- Existing policy (no changes)
CREATE POLICY "Enable all for authenticated users" ON jobs
  FOR ALL USING (true);

-- New columns inherit this policy automatically
```

---

## Migration Testing

### Test Script

```bash
# Test migration locally
npx supabase db reset

# Check schema
psql $DATABASE_URL -c "\d jobs"

# Verify constraints
psql $DATABASE_URL -c "
INSERT INTO jobs (
  input_type, input_content, company_name, position_title,
  job_description_text, parsing_source, parsing_confidence
) VALUES (
  'url', 'https://test.com/job', 'TestCo', 'Engineer',
  'Description', 'url_jina', 95
);
"

# Verify indexes
psql $DATABASE_URL -c "
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'jobs'
AND indexname LIKE '%parsing%';
"
```

---

## Rollback Plan

If migration fails or needs rollback:

```sql
BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_jobs_parsing_source;
DROP INDEX IF EXISTS idx_jobs_parsing_confidence;
DROP INDEX IF EXISTS idx_jobs_parsing_metadata;

-- Drop columns
ALTER TABLE jobs
  DROP COLUMN IF EXISTS parsing_source,
  DROP COLUMN IF EXISTS parsing_confidence,
  DROP COLUMN IF EXISTS parsing_model,
  DROP COLUMN IF EXISTS raw_content;

COMMIT;
```

---

## Future Schema Enhancements (Out of Scope)

### Phase 2: Parsing History Table

Track all parsing attempts (success, failure, retries):

```sql
CREATE TABLE job_parsing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  parsing_source TEXT NOT NULL,
  parsing_model TEXT NOT NULL,
  confidence INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Phase 3: Prompt Versioning

Track prompt versions used for each parse:

```sql
ALTER TABLE jobs
  ADD COLUMN prompt_version INTEGER REFERENCES parsing_prompts(version);
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Backend Team | Initial schema design |

---

**Status:** ✅ Ready for Implementation
**Next Steps:**
1. Create migration file: `023_add_job_parsing_fields.sql`
2. Test locally: `npx supabase db reset`
3. Deploy: `npx supabase db push`
4. Verify: Check indexes and constraints
