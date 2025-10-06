-- Migration 014: Enhanced Kanban Card Detail Fields
-- Version: 014
-- Date: 2025-10-06
-- Purpose: Add status-specific fields for enhanced card detail view
-- Related Feature: Enhanced Kanban Card Detail View
-- Documentation: /app/docs/features/kanban_job_tracker/kanban_card/

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

COMMENT ON COLUMN jobs.interview_phase_total IS 'Total number of interview phases (e.g., 3 for Phone → Technical → Final)';
COMMENT ON COLUMN jobs.interview_phase_current IS 'Current interview phase (0-indexed, so 0 = first phase)';
COMMENT ON COLUMN jobs.interview_prep_suggestions IS 'AI-generated interview topics: {topics: string[], generated_at: timestamp, model: string}';

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
COMMENT ON COLUMN jobs.salary_offer_currency IS 'Currency code for salary offer (THB, USD, EUR, GBP, SGD, AUD)';
COMMENT ON COLUMN jobs.offer_benefits IS 'List of benefits offered (health insurance, stock options, remote work, etc.)';
COMMENT ON COLUMN jobs.offer_ai_analysis IS 'AI-generated salary competitiveness analysis with market comparison and sources';

-- ============================================================================
-- STEP 3: Add Retrospective Fields (for "Not Now" status)
-- ============================================================================

ALTER TABLE jobs
  ADD COLUMN retrospective_reason TEXT,
  ADD COLUMN retrospective_learnings TEXT;

COMMENT ON COLUMN jobs.retrospective_reason IS 'Why was this opportunity declined or withdrawn? (for learning and improvement)';
COMMENT ON COLUMN jobs.retrospective_learnings IS 'Key learnings and areas to improve based on this application experience';

-- ============================================================================
-- STEP 4: Add Status Change Tracking (for analytics)
-- ============================================================================

ALTER TABLE jobs
  ADD COLUMN status_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN jobs.status_history IS 'Array of status changes for analytics and timeline view: [{from_status, to_status, timestamp, duration_days}, ...]';

-- ============================================================================
-- STEP 5: Add Indexes for Performance
-- ============================================================================

-- Index for filtering jobs by interview phase
CREATE INDEX idx_jobs_interview_phase
  ON jobs(interview_phase_current, interview_phase_total)
  WHERE interview_phase_total IS NOT NULL;

-- Index for salary offer queries
CREATE INDEX idx_jobs_salary_offer
  ON jobs(salary_offer_currency, salary_offer_amount)
  WHERE salary_offer_amount IS NOT NULL;

-- Index for retrospective analysis
CREATE INDEX idx_jobs_retrospective
  ON jobs(status)
  WHERE retrospective_reason IS NOT NULL;

-- GIN indexes for JSONB fields (for querying nested data)
CREATE INDEX idx_jobs_interview_prep_gin ON jobs USING GIN (interview_prep_suggestions);
CREATE INDEX idx_jobs_offer_analysis_gin ON jobs USING GIN (offer_ai_analysis);
CREATE INDEX idx_jobs_status_history_gin ON jobs USING GIN (status_history);

-- ============================================================================
-- STEP 6: Create Helper Function to Update Status History
-- ============================================================================

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
        'duration_days', EXTRACT(EPOCH FROM (NOW() - OLD.updated_at)) / 86400
      );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_job_status_history IS 'Automatically tracks status changes to status_history JSONB array';

-- Apply trigger to automatically track status changes
CREATE TRIGGER track_job_status_changes
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_job_status_history();

-- ============================================================================
-- STEP 7: Update Processing Queue to Support New AI Tasks
-- ============================================================================

-- Add new task types to processing_queue
ALTER TABLE processing_queue
  DROP CONSTRAINT IF EXISTS processing_queue_task_type_check;

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
      'generate_interview_prep',     -- NEW: AI interview preparation
      'analyze_salary_offer'          -- NEW: AI salary analysis
    ));

COMMENT ON CONSTRAINT processing_queue_task_type_check ON processing_queue IS 'Allowed task types including AI-powered interview prep and salary analysis';

-- ============================================================================
-- STEP 8: Create RPC Functions for Status-Specific Operations
-- ============================================================================

-- Update interview phase
CREATE OR REPLACE FUNCTION update_interview_phase(
  p_job_id UUID,
  p_phase_total INTEGER,
  p_phase_current INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jobs
  SET
    interview_phase_total = p_phase_total,
    interview_phase_current = p_phase_current,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

COMMENT ON FUNCTION update_interview_phase IS 'Update interview phase tracking fields';

-- Save salary offer
CREATE OR REPLACE FUNCTION save_salary_offer(
  p_job_id UUID,
  p_amount DECIMAL(12,2),
  p_currency TEXT,
  p_benefits TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate currency
  IF p_currency NOT IN ('THB', 'USD', 'EUR', 'GBP', 'SGD', 'AUD') THEN
    RAISE EXCEPTION 'Invalid currency: %. Must be THB, USD, EUR, GBP, SGD, or AUD', p_currency;
  END IF;

  -- Update job
  UPDATE jobs
  SET
    salary_offer_amount = p_amount,
    salary_offer_currency = p_currency,
    offer_benefits = p_benefits,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

COMMENT ON FUNCTION save_salary_offer IS 'Save salary offer details with currency validation';

-- Save retrospective
CREATE OR REPLACE FUNCTION save_retrospective(
  p_job_id UUID,
  p_reason TEXT,
  p_learnings TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jobs
  SET
    retrospective_reason = p_reason,
    retrospective_learnings = p_learnings,
    status = 'not_now',  -- Ensure status is set
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

COMMENT ON FUNCTION save_retrospective IS 'Save retrospective data and set status to not_now';

-- ============================================================================
-- STEP 9: Seed Data / Backfill (Initialize status_history for existing jobs)
-- ============================================================================

-- Initialize status_history for existing jobs with their current status
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

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================

/*
NEW FIELDS ADDED TO `jobs` TABLE:

1. INTERVIEW TRACKING:
   - interview_phase_total (int): Total interview rounds
   - interview_phase_current (int): Current round (0-indexed)
   - interview_prep_suggestions (jsonb): AI-generated topics
     Structure: {topics: string[], generated_at: timestamp, model: string}

2. OFFER ANALYSIS:
   - salary_offer_amount (decimal): Offer amount (annual gross)
   - salary_offer_currency (text): THB, USD, EUR, GBP, SGD, AUD
   - offer_benefits (text): List of benefits
   - offer_ai_analysis (jsonb): AI market comparison
     Structure: {is_competitive, analysis, sources[], recommendation, generated_at}

3. RETROSPECTIVE:
   - retrospective_reason (text): Why declined/withdrawn
   - retrospective_learnings (text): What to improve

4. ANALYTICS:
   - status_history (jsonb): Status transition log
     Structure: [{from_status, to_status, timestamp, duration_days}, ...]

5. NEW PROCESSING TASKS:
   - generate_interview_prep: AI generates interview topics
   - analyze_salary_offer: AI analyzes offer competitiveness

6. NEW RPC FUNCTIONS:
   - update_interview_phase(job_id, phase_total, phase_current)
   - save_salary_offer(job_id, amount, currency, benefits)
   - save_retrospective(job_id, reason, learnings)

7. NEW INDEXES:
   - idx_jobs_interview_phase (interview tracking)
   - idx_jobs_salary_offer (salary queries)
   - idx_jobs_retrospective (retrospective analysis)
   - idx_jobs_interview_prep_gin (JSONB search)
   - idx_jobs_offer_analysis_gin (JSONB search)
   - idx_jobs_status_history_gin (JSONB search)

8. NEW TRIGGER:
   - track_job_status_changes: Auto-logs status changes to status_history
*/

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
To rollback this migration, run:

BEGIN;

-- Drop trigger
DROP TRIGGER IF EXISTS track_job_status_changes ON jobs;
DROP FUNCTION IF EXISTS update_job_status_history();

-- Drop RPC functions
DROP FUNCTION IF EXISTS update_interview_phase(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS save_salary_offer(UUID, DECIMAL, TEXT, TEXT);
DROP FUNCTION IF EXISTS save_retrospective(UUID, TEXT, TEXT);

-- Drop indexes
DROP INDEX IF EXISTS idx_jobs_interview_phase;
DROP INDEX IF EXISTS idx_jobs_salary_offer;
DROP INDEX IF EXISTS idx_jobs_retrospective;
DROP INDEX IF EXISTS idx_jobs_interview_prep_gin;
DROP INDEX IF EXISTS idx_jobs_offer_analysis_gin;
DROP INDEX IF EXISTS idx_jobs_status_history_gin;

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
*/
