# API Specification - CV Upload & Extraction

**Version:** 1.0
**Date:** October 6, 2025
**API Type:** Supabase Edge Functions
**Base URL:** `https://[project-ref].supabase.co/functions/v1`

---

## Authentication

All endpoints require Supabase authentication:

```http
Authorization: Bearer {supabase-anon-key}
X-Session-ID: {session-id}  // For pre-auth users
```

---

## Endpoints

### 1. Upload CV File

#### `POST /cv-upload`

**Description:** Upload CV file and create extraction task

**Request:**
```http
POST /functions/v1/cv-upload
Content-Type: multipart/form-data
Authorization: Bearer eyJhbGci...
X-Session-ID: 550e8400-e29b-41d4...

Body:
  cv: File (binary)
```

**Response 200 (Success):**
```json
{
  "upload_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_id": "660e8400-e29b-41d4-a716-446655440001",
  "file_path": "cv-uploads/user-id/resume.pdf",
  "status": "pending",
  "message": "CV uploaded successfully. Extraction in progress...",
  "estimated_completion_seconds": 20
}
```

**Response 400 (Invalid File Type):**
```json
{
  "error": "Invalid file type. Only PDF and DOCX supported.",
  "code": "INVALID_FILE_TYPE",
  "details": {
    "received_type": "text/plain",
    "allowed_types": [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
  }
}
```

**Response 413 (File Too Large):**
```json
{
  "error": "File too large. Maximum size is 10MB.",
  "code": "FILE_TOO_LARGE",
  "details": {
    "file_size_bytes": 12582912,
    "max_size_bytes": 10485760,
    "file_size_mb": 12.0
  }
}
```

**Response 429 (Rate Limited):**
```json
{
  "error": "Rate limit exceeded. You can upload a maximum of 5 CVs per hour.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retry_after_seconds": 1800,
    "current_count": 6,
    "limit": 5,
    "window_reset_at": "2025-10-06T18:00:00Z"
  }
}
```

**Response 500 (Server Error):**
```json
{
  "error": "Internal server error. Please try again later.",
  "code": "INTERNAL_ERROR",
  "request_id": "req_abc123"
}
```

---

### 2. Check Extraction Status

#### `GET /cv-extraction-status/{task_id}`

**Description:** Poll extraction task status and get results

**Request:**
```http
GET /functions/v1/cv-extraction-status/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGci...
X-Session-ID: 550e8400-e29b-41d4...
```

**Response 200 (Pending):**
```json
{
  "task_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "pending",
  "message": "Waiting for worker to pick up task...",
  "created_at": "2025-10-06T17:30:00Z",
  "elapsed_seconds": 5
}
```

**Response 200 (Processing):**
```json
{
  "task_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "processing",
  "progress": 60,
  "message": "Extracting work experience section...",
  "started_at": "2025-10-06T17:30:10Z",
  "elapsed_seconds": 15
}
```

**Response 200 (Completed):**
```json
{
  "task_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "extracted_data": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_primary": "+66123456789",
    "location": "Bangkok, Thailand",
    "professional_summary": "Senior Frontend Engineer with 8+ years of experience...",
    "years_of_experience": 8,
    "current_position": "Senior Frontend Engineer",
    "work_experiences": [
      {
        "company_name": "Tech Corp",
        "position_title": "Senior Frontend Engineer",
        "location": "Bangkok, Thailand",
        "start_date": "2020-01",
        "end_date": null,
        "is_current": true,
        "description": "Led frontend development team..."
      }
    ],
    "skills": [
      {
        "skill_name": "React",
        "category": "Frontend",
        "proficiency_level": "Expert",
        "years_of_experience": 8
      },
      {
        "skill_name": "TypeScript",
        "category": "Programming Languages",
        "proficiency_level": "Expert",
        "years_of_experience": 6
      }
    ]
  },
  "confidence_score": 0.92,
  "confidence_scores": {
    "full_name": 0.98,
    "email": 0.95,
    "phone_primary": 0.85,
    "location": 0.90,
    "professional_summary": 0.88,
    "work_experiences": 0.92,
    "skills": 0.90
  },
  "validation_errors": [],
  "completed_at": "2025-10-06T17:30:25Z",
  "extraction_time_seconds": 15
}
```

**Response 200 (Failed):**
```json
{
  "task_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "failed",
  "error_message": "Unable to extract text from PDF. File may be image-based or corrupted.",
  "error_code": "TEXT_EXTRACTION_FAILED",
  "retry_available": true,
  "retry_count": 0,
  "max_retries": 3,
  "failed_at": "2025-10-06T17:30:15Z"
}
```

**Response 404 (Not Found):**
```json
{
  "error": "Extraction task not found.",
  "code": "TASK_NOT_FOUND",
  "task_id": "invalid-uuid"
}
```

**Response 403 (Unauthorized):**
```json
{
  "error": "You don't have permission to access this extraction task.",
  "code": "UNAUTHORIZED_ACCESS"
}
```

---

### 3. Retry Failed Extraction

#### `POST /cv-extraction-retry/{task_id}`

**Description:** Retry a failed extraction task

**Request:**
```http
POST /functions/v1/cv-extraction-retry/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGci...
```

**Response 200 (Retry Initiated):**
```json
{
  "task_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "pending",
  "retry_count": 1,
  "max_retries": 3,
  "message": "Extraction retry initiated. Please check status."
}
```

**Response 429 (Max Retries Exceeded):**
```json
{
  "error": "Maximum retries exceeded. Please upload a new CV.",
  "code": "MAX_RETRIES_EXCEEDED",
  "retry_count": 3,
  "max_retries": 3
}
```

---

## Error Codes Reference

### File Validation Errors (4xx)

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `INVALID_FILE_TYPE` | 400 | File type not supported | Upload PDF or DOCX |
| `FILE_TOO_LARGE` | 413 | File exceeds 10MB limit | Compress or split CV |
| `FILE_CORRUPTED` | 400 | File cannot be read | Upload different file |
| `MALFORMED_REQUEST` | 400 | Invalid request format | Check API usage |

### Processing Errors (5xx)

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `EXTRACTION_FAILED` | 500 | AI extraction error | Retry or manual entry |
| `TEXT_EXTRACTION_FAILED` | 500 | PDF parsing failed | Try DOCX format |
| `AI_API_ERROR` | 502 | Claude API error | Retry later |
| `AI_TIMEOUT` | 504 | API took too long | Retry or upload shorter CV |
| `INVALID_RESPONSE` | 500 | AI returned malformed data | Retry or manual entry |

### Resource Errors (4xx)

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many uploads | Wait and retry |
| `STORAGE_ERROR` | 500 | File storage failed | Retry upload |
| `DATABASE_ERROR` | 500 | Database save failed | Retry |

### Authorization Errors (4xx)

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `UNAUTHORIZED_ACCESS` | 403 | No permission for task | Check login status |
| `TASK_NOT_FOUND` | 404 | Task ID invalid/expired | Start new upload |

---

## Data Models

### TypeScript Types

```typescript
// Request/Response Types
export interface UploadCVResponse {
  upload_id: string;
  task_id: string;
  file_path: string;
  status: 'pending';
  message: string;
  estimated_completion_seconds: number;
}

export interface ExtractionStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number; // 0-100 (if processing)
  message?: string;
  extracted_data?: ExtractedCVData;
  confidence_score?: number;
  confidence_scores?: Record<string, number>;
  validation_errors?: ValidationError[];
  error_message?: string;
  error_code?: string;
  retry_available?: boolean;
  retry_count?: number;
  max_retries?: number;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  extraction_time_seconds?: number;
}

export interface ExtractedCVData {
  full_name: string;
  email: string;
  phone_primary?: string;
  phone_secondary?: string;
  location: string;
  professional_summary: string;
  years_of_experience?: number;
  current_position?: string;
  work_experiences: WorkExperienceExtracted[];
  skills: SkillExtracted[];
}

export interface WorkExperienceExtracted {
  company_name: string;
  position_title: string;
  location?: string;
  start_date: string; // YYYY-MM format
  end_date?: string | null; // YYYY-MM or null
  is_current: boolean;
  description?: string;
}

export interface SkillExtracted {
  skill_name: string;
  category?: string;
  proficiency_level?: 'Expert' | 'Advanced' | 'Intermediate' | 'Beginner';
  years_of_experience?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface RetryExtractionResponse {
  task_id: string;
  status: 'pending';
  retry_count: number;
  max_retries: number;
  message: string;
}

export interface APIError {
  error: string;
  code: string;
  details?: Record<string, any>;
  request_id?: string;
}
```

---

## Rate Limiting

### Upload Rate Limit

**Limit:** 5 uploads per user per hour
**Window:** Rolling 1-hour window
**Enforcement:** Server-side (cannot be bypassed)

**Headers (returned on all requests):**
```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1696616400
```

**Example Request with Rate Limit Info:**
```http
POST /cv-upload
...

Response Headers:
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1696616400
```

---

## Webhook Support (Future)

**Not in MVP, but documented for future:**

Instead of polling, could use Supabase Realtime:

```typescript
// Subscribe to extraction task updates
const channel = supabase
  .channel('extraction-updates')
  .on('postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'cv_extraction_tasks',
      filter: `id=eq.${taskId}`
    },
    (payload) => {
      if (payload.new.status === 'completed') {
        handleExtractionComplete(payload.new.extracted_data);
      }
    }
  )
  .subscribe();
```

**Benefit:** No polling overhead, instant updates
**Complexity:** Adds WebSocket management
**Recommendation:** Use polling for MVP, WebSocket for v2

---

**Last Updated:** October 6, 2025
**Status:** API design complete, ready for implementation
