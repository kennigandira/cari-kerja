/**
 * Job Parser Types
 *
 * TypeScript interfaces for AI-powered job parser
 * Matches Cloudflare Worker API spec (/api/parse-job)
 */

export interface ParseJobRequest {
  url?: string
  text?: string
}

export interface ParseJobResponse {
  // Extracted required fields
  company_name: string
  position_title: string
  job_description_text: string

  // Extracted optional fields
  location: string | null
  salary_range: string | null
  job_type: 'full-time' | 'contract' | 'remote' | 'hybrid' | null
  posted_date: string | null

  // Metadata
  confidence: number // 0-100
  parsing_source: 'url_jina' | 'manual_paste'
  parsing_model: string // e.g., "claude-sonnet-4.5-20250514"
  raw_content: string // Original markdown/text
  original_url: string | null
}

export interface ParseJobError {
  error: string
  code?: string
  fallback?: 'manual_paste'
  extracted?: Partial<ParseJobResponse>
  requestId?: string // For support correlation
}

// Helper type for modal state
export type InputType = 'url' | 'paste'
