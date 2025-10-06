-- Migration: Add Application Submission Tracking Fields
-- Version: 013
-- Date: 2025-10-06
-- Purpose: Separate job discovery (original_url) from application submission tracking

BEGIN;

-- Step 1: Add new columns for application submission tracking
ALTER TABLE jobs
  -- Application submission details
  ADD COLUMN application_url TEXT,
  ADD COLUMN application_method TEXT,
  ADD COLUMN recruiter_email TEXT,
  ADD COLUMN recruiter_name TEXT,
  ADD COLUMN application_notes TEXT,
  ADD COLUMN application_deadline DATE,
  ADD COLUMN application_submitted_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Backfill application_url from original_url for existing records
-- (Assumes job posting URL is same as application URL initially)
UPDATE jobs
SET application_url = original_url
WHERE input_type = 'url'
  AND original_url IS NOT NULL
  AND application_url IS NULL;

-- Step 3: Add constraints
ALTER TABLE jobs
  ADD CONSTRAINT check_application_method
    CHECK (application_method IS NULL OR application_method IN (
      'online_form',
      'email',
      'linkedin',
      'recruiter',
      'referral',
      'other'
    )),
  ADD CONSTRAINT check_recruiter_email_format
    CHECK (recruiter_email IS NULL OR recruiter_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Step 4: Add indexes for performance
CREATE INDEX idx_jobs_application_deadline
  ON jobs(application_deadline)
  WHERE application_deadline IS NOT NULL;

CREATE INDEX idx_jobs_application_method
  ON jobs(application_method)
  WHERE application_method IS NOT NULL;

CREATE INDEX idx_jobs_submitted_at
  ON jobs(application_submitted_at DESC)
  WHERE application_submitted_at IS NOT NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN jobs.application_url IS 'Where to submit the application (may differ from original_url)';
COMMENT ON COLUMN jobs.application_method IS 'How to apply: online_form, email, linkedin, recruiter, referral, other';
COMMENT ON COLUMN jobs.recruiter_email IS 'Recruiter contact email if application_method is email';
COMMENT ON COLUMN jobs.recruiter_name IS 'Recruiter or hiring manager name';
COMMENT ON COLUMN jobs.application_notes IS 'Special submission instructions or requirements';
COMMENT ON COLUMN jobs.application_deadline IS 'Application deadline date';
COMMENT ON COLUMN jobs.application_submitted_at IS 'Timestamp when application was submitted';

COMMIT;
