-- Job Kanban Database Schema
-- Version: 1.0
-- Date: 2025-10-05

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Input data
  input_type TEXT CHECK (input_type IN ('url', 'text')) NOT NULL,
  input_content TEXT NOT NULL,
  original_url TEXT,

  -- Extracted metadata
  company_name TEXT,
  position_title TEXT,
  location TEXT,
  posted_date TIMESTAMP WITH TIME ZONE,
  salary_range TEXT,
  job_type TEXT, -- full-time, contract, remote, hybrid

  -- Job description (preserve HTML)
  job_description_html TEXT,
  job_description_text TEXT,

  -- Match analysis
  match_percentage INTEGER CHECK (match_percentage >= 0 AND match_percentage <= 100),
  match_analysis JSONB, -- {strengths: [], partial_matches: [], gaps: []}

  -- Kanban status
  status TEXT DEFAULT 'processing' CHECK (status IN (
    'processing',
    'to_submit',
    'waiting_for_call',
    'ongoing',
    'success',
    'not_now'
  )),
  kanban_order INTEGER DEFAULT 0,

  -- Application folder path (syncs with 04_Applications/)
  folder_path TEXT
);

-- Job documents table (CV & Cover Letter versions)
CREATE TABLE job_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  document_type TEXT CHECK (document_type IN ('cv', 'cover_letter')) NOT NULL,
  version TEXT CHECK (version IN ('initial', 'reviewed', 'regenerated')) NOT NULL,
  regeneration_number INTEGER DEFAULT 0,

  -- File paths in Supabase Storage bucket: job-documents
  markdown_path TEXT,
  latex_path TEXT,
  pdf_path TEXT,

  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'processing', 'completed', 'failed'
  )),
  error_message TEXT,

  UNIQUE(job_id, document_type, version, regeneration_number)
);

-- Regeneration requests table
CREATE TABLE regeneration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES job_documents(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  user_feedback TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Result document
  new_document_id UUID REFERENCES job_documents(id) ON DELETE SET NULL
);

-- Processing queue for background jobs
CREATE TABLE processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  task_type TEXT CHECK (task_type IN (
    'extract_job_info',
    'calculate_match',
    'generate_cv',
    'generate_cover_letter',
    'review_cv',
    'review_cover_letter',
    'compile_pdf',
    'sync_to_filesystem'
  )) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed'
  )),
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,

  -- Task specific data
  task_data JSONB,
  task_result JSONB
);

-- Indexes for performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_kanban_order ON jobs(status, kanban_order);
CREATE INDEX idx_job_documents_job_id ON job_documents(job_id);
CREATE INDEX idx_processing_queue_status ON processing_queue(status, priority DESC, created_at);
CREATE INDEX idx_regeneration_requests_job_id ON regeneration_requests(job_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_documents_updated_at BEFORE UPDATE ON job_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
-- Note: Configure these based on your authentication setup
-- For now, we'll keep them permissive for development

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE regeneration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_queue ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust based on your auth setup)
CREATE POLICY "Enable all for authenticated users" ON jobs
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON job_documents
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON regeneration_requests
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON processing_queue
  FOR ALL USING (true);

-- Comments for documentation
COMMENT ON TABLE jobs IS 'Main table storing job postings and application tracking';
COMMENT ON TABLE job_documents IS 'Stores CV and cover letter documents in multiple versions';
COMMENT ON TABLE regeneration_requests IS 'Tracks user requests to regenerate documents with feedback';
COMMENT ON TABLE processing_queue IS 'Background job queue for async processing';

COMMENT ON COLUMN jobs.match_analysis IS 'JSON object containing: {strengths: string[], partial_matches: string[], gaps: string[]}';
COMMENT ON COLUMN jobs.kanban_order IS 'Order of cards within the same status column';
COMMENT ON COLUMN job_documents.regeneration_number IS 'Increments with each regeneration request (0 for initial/reviewed)';
