// Shared TypeScript types for Job Kanban App
// Used by both frontend and backend workers

export type InputType = 'url' | 'text';

export type JobStatus =
  | 'processing'
  | 'to_submit'
  | 'waiting_for_call'
  | 'ongoing'
  | 'success'
  | 'not_now';

export type DocumentType = 'cv' | 'cover_letter';

export type DocumentVersion = 'initial' | 'reviewed' | 'regenerated';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ApplicationMethod =
  | 'online_form'
  | 'email'
  | 'linkedin'
  | 'recruiter'
  | 'referral'
  | 'other';

export type TaskType =
  | 'extract_job_info'
  | 'calculate_match'
  | 'generate_cv'
  | 'generate_cover_letter'
  | 'review_cv'
  | 'review_cover_letter'
  | 'compile_pdf'
  | 'sync_to_filesystem'
  | 'generate_interview_prep'
  | 'analyze_salary_offer';

export interface MatchAnalysis {
  strengths: string[];
  partial_matches: string[];
  gaps: string[];
}

export interface Job {
  id: string;
  created_at: string;
  updated_at: string;

  // Input data
  input_type: InputType;
  input_content: string;
  original_url?: string;

  // Extracted metadata
  company_name?: string;
  position_title?: string;
  location?: string;
  posted_date?: string;
  salary_range?: string;
  job_type?: string;

  // Job description
  job_description_html?: string;
  job_description_text?: string;

  // Match analysis
  match_percentage?: number;
  match_analysis?: MatchAnalysis;

  // Kanban status
  status: JobStatus;
  kanban_order: number;

  // Application folder path
  folder_path?: string;

  // Application submission tracking
  application_url?: string;
  application_method?: ApplicationMethod;
  recruiter_email?: string;
  recruiter_name?: string;
  application_notes?: string;
  application_deadline?: string;
  application_submitted_at?: string;

  // Interview tracking (NEW - Migration 014)
  interview_phase_total?: number;
  interview_phase_current?: number;
  interview_prep_suggestions?: {
    topics: string[];
    generated_at: string;
    model: string;
  };

  // Offer & salary analysis (NEW - Migration 014)
  salary_offer_amount?: number;
  salary_offer_currency?: 'THB' | 'USD' | 'EUR' | 'GBP' | 'SGD' | 'AUD';
  offer_benefits?: string;
  offer_ai_analysis?: {
    is_competitive: 'above_average' | 'average' | 'below_average';
    analysis: string;
    sources: Array<{ title: string; url: string }>;
    recommendation: string;
    generated_at: string;
  };

  // Retrospective (NEW - Migration 014)
  retrospective_reason?: string;
  retrospective_learnings?: string;

  // Analytics (NEW - Migration 014)
  status_history?: Array<{
    from_status: string | null;
    to_status: string;
    timestamp: string;
    duration_days: number;
  }>;
}

export interface JobDocument {
  id: string;
  job_id: string;
  created_at: string;
  updated_at: string;

  document_type: DocumentType;
  version: DocumentVersion;
  regeneration_number: number;

  // File paths in Supabase Storage
  markdown_path?: string;
  latex_path?: string;
  pdf_path?: string;

  // Processing status
  processing_status: ProcessingStatus;
  error_message?: string;
}

export interface RegenerationRequest {
  id: string;
  job_id: string;
  document_id: string;
  created_at: string;

  user_feedback: string;
  status: ProcessingStatus;

  new_document_id?: string;
}

export interface ProcessingQueueTask {
  id: string;
  job_id: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;

  task_type: TaskType;
  status: ProcessingStatus;
  priority: number;
  retry_count: number;
  max_retries: number;
  error_message?: string;

  task_data?: Record<string, unknown>;
  task_result?: Record<string, unknown>;
}

// Frontend-specific extended types
export interface JobWithDocuments extends Job {
  documents?: JobDocument[];
}

// API Request/Response types
export interface CreateJobRequest {
  input_content: string;
  input_type?: InputType; // Auto-detected if not provided
}

export interface CreateJobResponse {
  job: Job;
  processing_tasks: ProcessingQueueTask[];
}

export interface RegenerateDocumentRequest {
  job_id: string;
  document_id: string;
  user_feedback: string;
}

export interface RegenerateDocumentResponse {
  request: RegenerationRequest;
  processing_task: ProcessingQueueTask;
}

export interface UpdateJobStatusRequest {
  job_id: string;
  status: JobStatus;
  kanban_order?: number;
}

// Worker-specific types
export interface JobExtractionResult {
  company_name: string;
  position_title: string;
  location?: string;
  posted_date?: string;
  salary_range?: string;
  job_type?: string;
  job_description_html: string;
  job_description_text: string;
}

export interface MatchCalculationResult {
  match_percentage: number;
  match_analysis: MatchAnalysis;
}

export interface DocumentGenerationResult {
  markdown_content: string;
  latex_content: string;
  pdf_url?: string;
}

// Utility types
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  processing: 'Processing',
  to_submit: 'To Submit',
  waiting_for_call: 'Waiting for Call',
  ongoing: 'Ongoing',
  success: 'Success',
  not_now: 'Not Now'
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  extract_job_info: 'Extracting Job Info',
  calculate_match: 'Calculating Match',
  generate_cv: 'Generating CV',
  generate_cover_letter: 'Generating Cover Letter',
  review_cv: 'Reviewing CV',
  review_cover_letter: 'Reviewing Cover Letter',
  compile_pdf: 'Compiling PDF',
  sync_to_filesystem: 'Syncing to Filesystem',
  generate_interview_prep: 'Generating Interview Prep',
  analyze_salary_offer: 'Analyzing Salary Offer'
};

export const APPLICATION_METHOD_LABELS: Record<ApplicationMethod, string> = {
  online_form: 'Online Application Form',
  email: 'Email to Recruiter',
  linkedin: 'LinkedIn Easy Apply',
  recruiter: 'Through Recruiter/Agency',
  referral: 'Internal Referral',
  other: 'Other'
};

// Master Profile Types
export interface MasterProfile {
  id: string;
  user_id?: string;
  session_id?: string;
  created_at: string;
  updated_at: string;

  profile_name: string;
  is_default: boolean;

  full_name: string;
  email: string;
  phone_primary?: string;
  phone_secondary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  location: string;

  professional_summary: string;
  years_of_experience?: number;
  current_position?: string;

  version: number;
  deleted_at?: string;
}

export interface WorkExperience {
  id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;

  company_name: string;
  position_title: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;

  display_order: number;
  version: number;
}

export interface Skill {
  id: string;
  profile_id: string;
  created_at: string;

  skill_name: string;
  category?: string;
  proficiency_level?: 'Expert' | 'Advanced' | 'Intermediate' | 'Beginner';
  years_of_experience?: number;

  display_order: number;
}

export interface Education {
  id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  institution_name: string;
  degree_or_field?: string;
  location?: string;
  description?: string;

  start_date?: string;  // ISO date string (YYYY-MM-DD)
  end_date?: string;
  date_precision: 'year' | 'month' | 'day';
  is_current: boolean;

  display_order: number;
  version: number;
}

export interface Certification {
  id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  certification_name: string;
  issuing_organization?: string;
  credential_id?: string;
  credential_url?: string;
  description?: string;

  issue_date?: string;  // ISO date string (YYYY-MM-DD)
  expiry_date?: string;
  date_precision: 'year' | 'month' | 'day';

  display_order: number;
  version: number;
}

export interface MasterProfileWithDetails extends MasterProfile {
  work_experiences?: WorkExperience[];
  skills?: Skill[];
  education?: Education[];
  certifications?: Certification[];
}
