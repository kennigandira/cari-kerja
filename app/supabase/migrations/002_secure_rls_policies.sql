-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON jobs;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON job_documents;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON regeneration_requests;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON processing_queue;

-- Add created_by column to jobs table first
-- Step 1: Add column as nullable first with default for new rows
ALTER TABLE jobs ADD COLUMN created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Step 2: For existing rows that might have null created_by, we need to handle them
-- Since we can't get auth.uid() during migration, we'll delete any existing jobs without owners
-- In a production scenario, you might want to assign them to a specific user instead
DELETE FROM jobs WHERE created_by IS NULL;

-- Step 3: Make the column NOT NULL now that all rows have a value
ALTER TABLE jobs ALTER COLUMN created_by SET NOT NULL;

-- Step 4: Create index
CREATE INDEX idx_jobs_created_by ON jobs(created_by);

-- Jobs table policies
CREATE POLICY "Users can only access their own jobs" ON jobs
  FOR ALL USING (auth.uid() = created_by);

-- Job documents policies
CREATE POLICY "Users can only access documents for their own jobs" ON job_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_documents.job_id
      AND jobs.created_by = auth.uid()
    )
  );

-- Regeneration requests policies
CREATE POLICY "Users can only access regeneration requests for their own jobs" ON regeneration_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = regeneration_requests.job_id
      AND jobs.created_by = auth.uid()
    )
  );

-- Processing queue policies
CREATE POLICY "Users can only read their own processing queue items" ON processing_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = processing_queue.job_id
      AND jobs.created_by = auth.uid()
    )
  );

-- Only backend service role can modify processing queue
CREATE POLICY "Only service role can modify queue" ON processing_queue
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Only service role can update queue" ON processing_queue
  FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

-- Add RLS check to prevent users from modifying other users' jobs
CREATE OR REPLACE FUNCTION check_job_ownership() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = NEW.job_id
      AND jobs.created_by = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied: Job does not belong to the current user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add job ownership check triggers
CREATE TRIGGER check_job_documents_ownership
  BEFORE INSERT OR UPDATE ON job_documents
  FOR EACH ROW EXECUTE FUNCTION check_job_ownership();

CREATE TRIGGER check_regeneration_requests_ownership
  BEFORE INSERT OR UPDATE ON regeneration_requests
  FOR EACH ROW EXECUTE FUNCTION check_job_ownership();