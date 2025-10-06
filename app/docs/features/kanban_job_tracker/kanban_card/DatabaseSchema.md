# Database Schema Documentation - Enhanced Kanban Card Detail View

**Version:** 1.1 (Updated Oct 6, 2025)
**Migrations:**
- 014_add_enhanced_kanban_fields.sql
- 023_sync_job_status_on_card_move.sql (Bug Fix)
- 024_fix_existing_job_statuses.sql (Data Fix)
**Dependencies:** 013_add_application_submission_fields.sql
**Parent Feature:** Kanban Job Application Tracker

---

## Schema Overview

This migration extends the existing `jobs` table with status-specific fields to support the Enhanced Kanban Card Detail View feature. The schema adds interview tracking, offer analysis, retrospective learning, and AI-generated insights capabilities.

### Design Philosophy
1. **Denormalized for Speed** - Status-specific fields stored directly in jobs table for faster reads
2. **JSONB for Flexibility** - AI insights stored as JSONB to avoid future schema changes
3. **Audit Trail** - Status history tracked automatically via triggers
4. **Single-user Optimized** - No complex multi-user constraints needed

### New Fields Added (10 total)
- **Interview Tracking** (3 fields): phase tracking + AI prep suggestions
- **Offer Analysis** (4 fields): salary, currency, benefits + AI analysis
- **Retrospective** (2 fields): reason + learnings for "Not Now" status
- **Analytics** (1 field): status transition history

---

## Migration 014: Field Specifications

### 1. Interview Tracking Fields

#### `interview_phase_total`
```sql
interview_phase_total INTEGER CHECK (interview_phase_total >= 0 AND interview_phase_total <= 10)
```
- **Type:** Integer (nullable)
- **Purpose:** Total number of interview rounds for this application
- **Valid Values:** 0-10 (typical range: 1-5)
- **Examples:**
  - `3` = Phone Screen → Technical → Final Round
  - `4` = Recruiter → Hiring Manager → Technical → Team Fit
- **UI Display:** "Interview Process: Phase {current}/{total}"

#### `interview_phase_current`
```sql
interview_phase_current INTEGER CHECK (interview_phase_current >= 0 AND interview_phase_current <= interview_phase_total)
```
- **Type:** Integer (nullable)
- **Purpose:** Current interview phase (0-indexed)
- **Valid Values:** 0 to `interview_phase_total` (must not exceed total)
- **Examples:**
  - `0` = First round (phone screen)
  - `2` = Third round (if total is 3, this is the final round)
- **Constraint:** Must be ≤ interview_phase_total
- **UI Display:** Progress bar showing current/total

#### `interview_prep_suggestions`
```sql
interview_prep_suggestions JSONB
```
- **Type:** JSONB (nullable)
- **Purpose:** AI-generated interview preparation topics
- **Structure:**
```json
{
  "topics": [
    "Deep dive into React Server Components (they use Next.js 14)",
    "Prepare Core Web Vitals optimization examples (LCP, CLS)",
    "System design: Real estate search architecture at scale",
    "Behavioral: Tell me about a time you improved performance"
  ],
  "generated_at": "2025-10-06T10:30:00Z",
  "model": "claude-3-haiku-20240307"
}
```
- **UI Display:** Checklist with checkboxes for tracking completion

---

### 2. Offer & Salary Analysis Fields

#### `salary_offer_amount`
```sql
salary_offer_amount DECIMAL(12, 2) CHECK (salary_offer_amount >= 0)
```
- **Type:** Decimal (12 digits, 2 decimal places)
- **Purpose:** Annual gross salary offer
- **Valid Values:** 0 or positive numbers
- **Examples:**
  - `1200000.00` = ฿1.2M THB
  - `120000.00` = $120K USD
- **Precision:** Supports up to 999,999,999,999.99

#### `salary_offer_currency`
```sql
salary_offer_currency TEXT DEFAULT 'THB' CHECK (salary_offer_currency IN ('THB', 'USD', 'EUR', 'GBP', 'SGD', 'AUD'))
```
- **Type:** Text (fixed values)
- **Default:** 'THB' (Thai Baht)
- **Valid Values:**
  - `THB` = Thai Baht (฿)
  - `USD` = US Dollar ($)
  - `EUR` = Euro (€)
  - `GBP` = British Pound (£)
  - `SGD` = Singapore Dollar (S$)
  - `AUD` = Australian Dollar (A$)
- **UI Display:** Dropdown with currency symbols

#### `offer_benefits`
```sql
offer_benefits TEXT
```
- **Type:** Text (free-form, nullable)
- **Purpose:** List of benefits offered
- **Format:** Comma-separated or bullet list (user's choice)
- **Examples:**
  - "Health insurance, dental, 15 days vacation, stock options"
  - "• Remote work\n• Flexible hours\n• Learning budget ฿50K/year"
- **Future:** Can be converted to JSONB array for structured data

#### `offer_ai_analysis`
```sql
offer_ai_analysis JSONB
```
- **Type:** JSONB (nullable)
- **Purpose:** AI-generated salary competitiveness analysis
- **Structure:**
```json
{
  "is_competitive": "above_average",
  "analysis": "This offer is 15% above market average for Frontend Engineers in Bangkok with 8+ years experience.",
  "market_average": {
    "amount": 1040000,
    "currency": "THB"
  },
  "sources": [
    {
      "title": "Thailand Tech Salaries 2025",
      "url": "https://techsalaries.th/report-2025",
      "excerpt": "Senior Frontend Engineers: ฿900K - ฿1.2M"
    },
    {
      "title": "Glassdoor: Frontend Engineer Bangkok",
      "url": "https://glassdoor.com/salaries/bangkok-frontend-engineer",
      "excerpt": "Average base: ฿1.05M"
    }
  ],
  "recommendation": "Strong offer. Accept if other factors (culture, growth) align.",
  "generated_at": "2025-10-06T14:20:00Z",
  "model": "claude-3-haiku-20240307"
}
```
- **Valid `is_competitive` values:** `"above_average"`, `"average"`, `"below_average"`

---

### 3. Retrospective Fields (Learning System)

#### `retrospective_reason`
```sql
retrospective_reason TEXT
```
- **Type:** Text (nullable)
- **Purpose:** Why was this application declined/withdrawn?
- **Examples:**
  - "Salary offer was 20% below market rate"
  - "Company culture didn't align with remote-first preference"
  - "Received better offer from another company"
  - "Role required 50% backend work, not aligned with career goals"
- **UI Display:** Dropdown + "Other (specify)" textarea

#### `retrospective_learnings`
```sql
retrospective_learnings TEXT
```
- **Type:** Text (nullable)
- **Purpose:** What to improve for next time?
- **Format:** Free-form text or bullet points
- **Examples:**
  - "Improve Node.js skills for full-stack roles"
  - "Ask about salary range upfront before investing time"
  - "Research company culture more thoroughly before applying"
  - "Negotiate better during offer stage, didn't advocate enough"
- **Future Use:** Analyze retrospectives to identify skill gaps and patterns

---

### 4. Analytics & Status History

#### `status_history`
```sql
status_history JSONB DEFAULT '[]'::jsonb
```
- **Type:** JSONB Array
- **Purpose:** Track all status transitions for analytics
- **Structure:**
```json
[
  {
    "from_status": null,
    "to_status": "processing",
    "timestamp": "2025-10-01T08:00:00Z",
    "duration_days": 0
  },
  {
    "from_status": "processing",
    "to_status": "to_submit",
    "timestamp": "2025-10-01T09:30:00Z",
    "duration_days": 0.0625
  },
  {
    "from_status": "to_submit",
    "to_status": "waiting_for_call",
    "timestamp": "2025-10-02T10:00:00Z",
    "duration_days": 1.02
  },
  {
    "from_status": "waiting_for_call",
    "to_status": "ongoing",
    "timestamp": "2025-10-08T14:00:00Z",
    "duration_days": 6.17
  }
]
```
- **Auto-populated:** Via `track_job_status_changes` trigger
- **Analytics Use Cases:**
  - Average time in "Waiting for Call" status
  - Conversion rates between statuses
  - Identify bottlenecks in pipeline

---

## Processing Queue Extensions

### New Task Types

#### `generate_interview_prep`
```sql
ALTER TABLE processing_queue
  ADD CONSTRAINT processing_queue_task_type_check
    CHECK (task_type IN (
      ...,
      'generate_interview_prep',  -- NEW
      'analyze_salary_offer'       -- NEW
    ));
```

**Task: `generate_interview_prep`**
- **Triggered:** When user clicks "Get Interview Prep ✨" button
- **Input:** `task_data.job_id`
- **Process:**
  1. Fetch job description + candidate profile
  2. Send to Claude API with interview prep prompt
  3. Parse response into topics array
  4. Store in `interview_prep_suggestions` JSONB
- **Output:** `task_result.topics` array

**Task: `analyze_salary_offer`**
- **Triggered:** When user clicks "Analyze Offer ✨" button
- **Input:**
  - `task_data.job_id`
  - `task_data.salary_amount`
  - `task_data.salary_currency`
  - `task_data.benefits`
- **Process:**
  1. Fetch job details (position, location)
  2. AI web search for market data
  3. Compare offer to market average
  4. Generate recommendation
- **Output:** `task_result.analysis` object (stored in `offer_ai_analysis`)

---

## Indexes for Performance

### New Indexes

```sql
-- Interview phase queries
CREATE INDEX idx_jobs_interview_phase
  ON jobs(interview_phase_current, interview_phase_total)
  WHERE interview_phase_total IS NOT NULL;

-- Salary offer filtering
CREATE INDEX idx_jobs_salary_offer
  ON jobs(salary_offer_currency, salary_offer_amount)
  WHERE salary_offer_amount IS NOT NULL;

-- Retrospective analysis
CREATE INDEX idx_jobs_retrospective
  ON jobs(status)
  WHERE retrospective_reason IS NOT NULL;

-- JSONB field searches (GIN indexes)
CREATE INDEX idx_jobs_interview_prep_gin
  ON jobs USING GIN (interview_prep_suggestions);

CREATE INDEX idx_jobs_offer_analysis_gin
  ON jobs USING GIN (offer_ai_analysis);

CREATE INDEX idx_jobs_status_history_gin
  ON jobs USING GIN (status_history);
```

### Index Usage Examples

**Find jobs in interview phase 2 of 3:**
```sql
SELECT * FROM jobs
WHERE interview_phase_current = 2
  AND interview_phase_total = 3;
-- Uses: idx_jobs_interview_phase
```

**Find high salary offers in USD:**
```sql
SELECT * FROM jobs
WHERE salary_offer_currency = 'USD'
  AND salary_offer_amount > 150000;
-- Uses: idx_jobs_salary_offer
```

**Find all retrospectives mentioning "salary":**
```sql
SELECT * FROM jobs
WHERE retrospective_reason ILIKE '%salary%';
-- Uses: Full text search (consider adding tsvector for large scale)
```

**Query JSONB for specific AI model:**
```sql
SELECT * FROM jobs
WHERE interview_prep_suggestions->>'model' = 'claude-3-haiku-20240307';
-- Uses: idx_jobs_interview_prep_gin
```

---

## Triggers & Functions

### Auto-Update Status History

```sql
CREATE OR REPLACE FUNCTION update_job_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only add to history if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = COALESCE(NEW.status_history, '[]'::jsonb) ||
      jsonb_build_object(
        'from_status', OLD.status,
        'to_status', NEW.status,
        'timestamp', NOW(),
        'duration_days', EXTRACT(EPOCH FROM (NOW() - OLD.status_updated_at)) / 86400
      );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER track_job_status_changes
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_job_status_history();
```

**Trigger Behavior:**
- **Fires:** Only when status changes (not on other field updates)
- **Action:** Appends new status transition to `status_history` array
- **Calculates:** Duration in current status (in days)
- **Safe:** Uses COALESCE to handle NULL status_history

---

## Migration Script: 014_add_enhanced_kanban_fields.sql

### Full Migration

```sql
-- Migration 014: Enhanced Kanban Card Detail Fields
-- Version: 014
-- Date: 2025-10-06
-- Purpose: Add status-specific fields for enhanced card detail view

BEGIN;

-- ============================================================================
-- STEP 1: Add Interview Tracking Fields
-- ============================================================================

ALTER TABLE jobs
  ADD COLUMN interview_phase_total INTEGER
    CHECK (interview_phase_total >= 0 AND interview_phase_total <= 10),
  ADD COLUMN interview_phase_current INTEGER
    CHECK (interview_phase_current >= 0 AND interview_phase_current <= interview_phase_total),
  ADD COLUMN interview_prep_suggestions JSONB;

COMMENT ON COLUMN jobs.interview_phase_total IS 'Total number of interview phases';
COMMENT ON COLUMN jobs.interview_phase_current IS 'Current interview phase (0-indexed)';
COMMENT ON COLUMN jobs.interview_prep_suggestions IS 'AI-generated interview topics: {topics: string[], generated_at: timestamp}';

-- ============================================================================
-- STEP 2: Add Offer & Salary Analysis Fields
-- ============================================================================

ALTER TABLE jobs
  ADD COLUMN salary_offer_amount DECIMAL(12, 2)
    CHECK (salary_offer_amount >= 0),
  ADD COLUMN salary_offer_currency TEXT DEFAULT 'THB'
    CHECK (salary_offer_currency IN ('THB', 'USD', 'EUR', 'GBP', 'SGD', 'AUD')),
  ADD COLUMN offer_benefits TEXT,
  ADD COLUMN offer_ai_analysis JSONB;

COMMENT ON COLUMN jobs.salary_offer_amount IS 'Salary offer amount (annual gross)';
COMMENT ON COLUMN jobs.salary_offer_currency IS 'Currency code for salary offer';
COMMENT ON COLUMN jobs.offer_benefits IS 'List of benefits offered';
COMMENT ON COLUMN jobs.offer_ai_analysis IS 'AI-generated salary competitiveness analysis';

-- ============================================================================
-- STEP 3: Add Retrospective Fields
-- ============================================================================

ALTER TABLE jobs
  ADD COLUMN retrospective_reason TEXT,
  ADD COLUMN retrospective_learnings TEXT;

COMMENT ON COLUMN jobs.retrospective_reason IS 'Why was this opportunity declined?';
COMMENT ON COLUMN jobs.retrospective_learnings IS 'Key learnings and areas to improve';

-- ============================================================================
-- STEP 4: Add Status History
-- ============================================================================

ALTER TABLE jobs
  ADD COLUMN status_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN jobs.status_history IS 'Array of status changes for analytics';

-- ============================================================================
-- STEP 5: Add Indexes
-- ============================================================================

CREATE INDEX idx_jobs_interview_phase
  ON jobs(interview_phase_current, interview_phase_total)
  WHERE interview_phase_total IS NOT NULL;

CREATE INDEX idx_jobs_salary_offer
  ON jobs(salary_offer_currency, salary_offer_amount)
  WHERE salary_offer_amount IS NOT NULL;

CREATE INDEX idx_jobs_retrospective
  ON jobs(status)
  WHERE retrospective_reason IS NOT NULL;

CREATE INDEX idx_jobs_interview_prep_gin ON jobs USING GIN (interview_prep_suggestions);
CREATE INDEX idx_jobs_offer_analysis_gin ON jobs USING GIN (offer_ai_analysis);
CREATE INDEX idx_jobs_status_history_gin ON jobs USING GIN (status_history);

-- ============================================================================
-- STEP 6: Create Status History Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_job_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = COALESCE(NEW.status_history, '[]'::jsonb) ||
      jsonb_build_object(
        'from_status', OLD.status,
        'to_status', NEW.status,
        'timestamp', NOW(),
        'duration_days', EXTRACT(EPOCH FROM (NOW() - OLD.status_updated_at)) / 86400
      );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_job_status_changes
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_job_status_history();

-- ============================================================================
-- STEP 7: Update Processing Queue Task Types
-- ============================================================================

ALTER TABLE processing_queue
  DROP CONSTRAINT processing_queue_task_type_check;

ALTER TABLE processing_queue
  ADD CONSTRAINT processing_queue_task_type_check
    CHECK (task_type IN (
      'extract_job_info',
      'calculate_match',
      'generate_cv',
      'generate_cover_letter',
      'review_cv',
      'review_cover_letter',
      'compile_pdf',
      'sync_to_filesystem',
      'generate_interview_prep',     -- NEW
      'analyze_salary_offer'          -- NEW
    ));

-- ============================================================================
-- STEP 8: Backfill Status History for Existing Jobs
-- ============================================================================

UPDATE jobs
SET status_history = jsonb_build_array(
  jsonb_build_object(
    'from_status', NULL,
    'to_status', status,
    'timestamp', created_at,
    'duration_days', 0
  )
)
WHERE status_history IS NULL OR status_history = '[]'::jsonb;

COMMIT;
```

---

## Data Migration Considerations

### Existing Jobs Handling
- **NULL values:** All new fields are nullable, existing jobs work fine
- **Status history:** Backfilled with initial status transition
- **Defaults:** Only `salary_offer_currency` has default ('THB')

### Rollback Plan
```sql
-- Rollback migration 014
BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_jobs_interview_phase;
DROP INDEX IF EXISTS idx_jobs_salary_offer;
DROP INDEX IF EXISTS idx_jobs_retrospective;
DROP INDEX IF EXISTS idx_jobs_interview_prep_gin;
DROP INDEX IF EXISTS idx_jobs_offer_analysis_gin;
DROP INDEX IF EXISTS idx_jobs_status_history_gin;

-- Drop trigger
DROP TRIGGER IF EXISTS track_job_status_changes ON jobs;
DROP FUNCTION IF EXISTS update_job_status_history();

-- Remove columns
ALTER TABLE jobs
  DROP COLUMN IF EXISTS interview_phase_total,
  DROP COLUMN IF EXISTS interview_phase_current,
  DROP COLUMN IF EXISTS interview_prep_suggestions,
  DROP COLUMN IF EXISTS salary_offer_amount,
  DROP COLUMN IF EXISTS salary_offer_currency,
  DROP COLUMN IF EXISTS offer_benefits,
  DROP COLUMN IF EXISTS offer_ai_analysis,
  DROP COLUMN IF EXISTS retrospective_reason,
  DROP COLUMN IF EXISTS retrospective_learnings,
  DROP COLUMN IF EXISTS status_history;

-- Revert processing_queue constraint
ALTER TABLE processing_queue
  DROP CONSTRAINT processing_queue_task_type_check;

ALTER TABLE processing_queue
  ADD CONSTRAINT processing_queue_task_type_check
    CHECK (task_type IN (
      'extract_job_info',
      'calculate_match',
      'generate_cv',
      'generate_cover_letter',
      'review_cv',
      'review_cover_letter',
      'compile_pdf',
      'sync_to_filesystem'
    ));

COMMIT;
```

---

## Testing Queries

### Verify Migration Success

```sql
-- Check all new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'jobs'
  AND column_name IN (
    'interview_phase_total',
    'interview_phase_current',
    'interview_prep_suggestions',
    'salary_offer_amount',
    'salary_offer_currency',
    'offer_benefits',
    'offer_ai_analysis',
    'retrospective_reason',
    'retrospective_learnings',
    'status_history'
  )
ORDER BY ordinal_position;

-- Check indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'jobs'
  AND indexname LIKE 'idx_jobs_%interview%'
     OR indexname LIKE 'idx_jobs_%offer%'
     OR indexname LIKE 'idx_jobs_%retrospective%'
     OR indexname LIKE 'idx_jobs_%gin%';

-- Check trigger exists
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgrelid = 'jobs'::regclass
  AND tgname = 'track_job_status_changes';

-- Check processing_queue constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'processing_queue_task_type_check';
```

### Sample Data Insertion

```sql
-- Test interview tracking
UPDATE jobs
SET interview_phase_total = 3,
    interview_phase_current = 1,
    interview_prep_suggestions = '{
      "topics": [
        "React performance optimization",
        "System design for real estate platforms",
        "Behavioral: conflict resolution"
      ],
      "generated_at": "2025-10-06T10:00:00Z",
      "model": "claude-3-haiku-20240307"
    }'::jsonb
WHERE id = 'some-job-id';

-- Test offer analysis
UPDATE jobs
SET salary_offer_amount = 1200000.00,
    salary_offer_currency = 'THB',
    offer_benefits = 'Health insurance, 15 days vacation, stock options',
    offer_ai_analysis = '{
      "is_competitive": "above_average",
      "analysis": "15% above market for Bangkok",
      "sources": [{"title": "Tech Salaries 2025", "url": "https://..."}],
      "recommendation": "Strong offer, accept if culture fits"
    }'::jsonb
WHERE id = 'some-job-id';

-- Test retrospective
UPDATE jobs
SET retrospective_reason = 'Salary below market rate',
    retrospective_learnings = 'Ask about salary range upfront'
WHERE id = 'some-job-id';
```

---

## Performance Considerations

### Query Optimization
- **JSONB GIN indexes** enable fast containment queries (`@>`, `?`, `?&`)
- **Partial indexes** (WHERE clauses) reduce index size for sparse fields
- **Compound indexes** on (currency, amount) support range queries

### Storage Impact
- **10 new columns:** ~50-200 bytes per row (varies with JSONB size)
- **Status history:** Grows linearly with status changes (~100 bytes per transition)
- **AI insights:** ~2-5 KB per job (interview prep + offer analysis combined)
- **Estimated:** ~10 KB per fully populated job record

### Scaling Recommendations
- For >10K jobs: Consider partitioning by created_at
- For >100K jobs: Move status_history to separate table
- Monitor JSONB field sizes, implement cleanup for old data

---

## Migration 023: Sync Job Status on Card Move (Bug Fix)

**Date:** October 6, 2025
**Purpose:** Fix job.status not syncing when kanban cards move between columns
**File:** `023_sync_job_status_on_card_move.sql`

### Problem Statement
When users drag cards between kanban columns, only `kanban_cards.column_id` was updated. The linked `jobs.status` field remained unchanged, causing the modal to show incorrect status.

### Solution
Enhanced `move_card_between_columns()` RPC function to:
1. Get the card's linked `job_id`
2. Look up destination column name
3. Map column name to appropriate `JobStatus` value
4. Update `jobs.status` atomically

### Column Name → Job Status Mapping

| Column Name | Job Status Value |
|-------------|------------------|
| "To Submit" | `to_submit` |
| "Waiting for Call" | `waiting_for_call` |
| "Interviewing" | `ongoing` |
| "Offer" | `success` |
| "Not Now" / "Rejected" | `not_now` |
| "Processing" | `processing` |

**Implementation uses ILIKE for case-insensitive partial matching:**
```sql
v_new_job_status := CASE
  WHEN v_column_name ILIKE '%to submit%' THEN 'to_submit'
  WHEN v_column_name ILIKE '%waiting%' THEN 'waiting_for_call'
  WHEN v_column_name ILIKE '%interview%' THEN 'ongoing'
  WHEN v_column_name ILIKE '%offer%' THEN 'success'
  WHEN v_column_name ILIKE '%not now%' THEN 'not_now'
  WHEN v_column_name ILIKE '%rejected%' THEN 'not_now'
  WHEN v_column_name ILIKE '%processing%' THEN 'processing'
  ELSE NULL
END;
```

---

## Migration 024: Fix Existing Job Status Data (Bug Fix)

**Date:** October 6, 2025
**Purpose:** One-time data fix to sync existing mismatched job statuses
**File:** `024_fix_existing_job_statuses.sql`

### Problem Statement
Migration 023 only fixes FUTURE card movements. Existing jobs in the database already had mismatched statuses (e.g., cards in "Waiting for Call" column but job.status = "to_submit").

### Solution
One-time UPDATE query to sync all existing jobs with their current card positions:

```sql
UPDATE jobs j
SET status = CASE
  WHEN kc.name ILIKE '%to submit%' THEN 'to_submit'
  WHEN kc.name ILIKE '%waiting%' THEN 'waiting_for_call'
  WHEN kc.name ILIKE '%interview%' THEN 'ongoing'
  WHEN kc.name ILIKE '%offer%' THEN 'success'
  WHEN kc.name ILIKE '%not now%' THEN 'not_now'
  WHEN kc.name ILIKE '%rejected%' THEN 'not_now'
  WHEN kc.name ILIKE '%processing%' THEN 'processing'
  ELSE j.status
END,
updated_at = NOW()
FROM kanban_cards cards
INNER JOIN kanban_columns kc ON kc.id = cards.column_id
WHERE j.id = cards.job_id
  AND cards.job_id IS NOT NULL
  AND j.status != [expected status based on column];
```

**Records Updated:** All jobs with kanban cards that had mismatched statuses

---

## Related Documentation

- **Migration Files:**
  - `/app/supabase/migrations/014_add_enhanced_kanban_fields.sql`
  - `/app/supabase/migrations/023_sync_job_status_on_card_move.sql`
  - `/app/supabase/migrations/024_fix_existing_job_statuses.sql`
- **Parent Schema:** `../DatabaseSchema.md`
- **API Spec:** `./APISpecification.md`
- **PRD:** `./PRD.md`
