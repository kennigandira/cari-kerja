# API Specification - Master Profile Endpoints

**Version:** 1.0 (v1)
**Base URL:** `/api/v1/profiles`
**Authentication:** JWT Bearer token (future), currently permissive

---

## Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create profile | Future |
| GET | `/` | List all profiles | Future |
| GET | `/:id` | Get profile details | Future |
| PUT | `/:id` | Update profile | Future |
| DELETE | `/:id` | Delete/archive profile | Future |
| POST | `/:id/set-default` | Set as default | Future |
| POST | `/:id/duplicate` | Duplicate profile | Future |
| POST | `/upload-cv` | Upload CV file | Future |
| GET | `/extraction-jobs/:taskId` | Check extraction status | Future |

---

## Detailed Specifications

### POST /api/v1/profiles
**Create new master profile**

**Request:**
```typescript
Content-Type: application/json

{
  "profile": {
    "profile_name": "Senior Frontend Profile",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_primary": "+66123456789",
    "location": "Bangkok, Thailand",
    "professional_summary": "Frontend Engineer with 8+ years...",
    "years_of_experience": 8,
    "is_default": true
  },
  "work_experiences": [
    {
      "company_name": "Acme Corp",
      "position_title": "Senior Frontend Engineer",
      "location": "Bangkok, Thailand",
      "start_date": "2023-01-01",
      "end_date": null,
      "is_current": true,
      "description": "Building scalable web applications...",
      "display_order": 0
    }
  ],
  "skills": [...],
  "education": [...],
  "certifications": [...],
  "languages": [...]
}
```

**Response:** 201 Created
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "profile_name": "Senior Frontend Profile",
    "full_name": "John Doe",
    "version": 1,
    "created_at": "2025-10-05T10:30:00Z",
    ...
  },
  "meta": {
    "timestamp": "2025-10-05T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

**Errors:**
- `400` Validation Error
- `409` Profile name already exists
- `500` Internal Server Error

---

### GET /api/v1/profiles
**List all user's profiles with pagination**

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20, max 100
- `sort` (optional): Sort field, default `updated_at`, options: `created_at`, `updated_at`, `profile_name`
- `order` (optional): Sort order, default `desc`, options: `asc`, `desc`

**Response:** 200 OK
```typescript
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": "uuid",
        "profile_name": "Senior Frontend Profile",
        "is_default": true,
        "updated_at": "2025-10-05T10:30:00Z",
        ...
      }
    ],
    "default_profile_id": "uuid",
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 5,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  },
  "meta": {
    "timestamp": "2025-10-05T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

---

### PUT /api/v1/profiles/:id
**Update existing profile**

**Headers:**
- `If-Match: <version>` - Optimistic locking (optional but recommended)

**Request:**
```typescript
{
  "profile": {...},
  "work_experiences": [...],
  "skills": [...],
  ...
  "change_summary": "Updated work experience" // optional
}
```

**Response:** 200 OK

**Errors:**
- `404` Profile not found
- `409` Version conflict (optimistic lock failure)

---

### POST /api/v1/profiles/upload-cv
**Upload CV file for extraction**

**Request:**
```typescript
Content-Type: multipart/form-data

{
  "file": File,          // PDF, DOCX, or TXT
  "profile_name": string // optional
}
```

**Response:** 202 Accepted
```typescript
{
  "success": true,
  "data": {
    "file_path": "master-profile-cvs/user-id/profile-id/timestamp_resume.pdf",
    "extraction_task_id": "uuid",
    "estimated_completion_seconds": 20
  }
}
```

---

### GET /api/v1/profiles/extraction-jobs/:taskId
**Check CV extraction status**

**Response:** 200 OK

**Status: Pending**
```typescript
{
  "success": true,
  "data": {
    "status": "pending",
    "progress_percentage": 0
  }
}
```

**Status: Processing**
```typescript
{
  "success": true,
  "data": {
    "status": "processing",
    "progress_percentage": 50
  }
}
```

**Status: Completed**
```typescript
{
  "success": true,
  "data": {
    "status": "completed",
    "result": {
      "profile_data": {...},
      "work_experiences": [...],
      "skills": [...],
      "confidence_scores": {
        "email": 0.95,
        "phone_primary": 0.80,
        ...
      },
      "warnings": [
        "Low confidence in phone_primary. Please verify."
      ]
    }
  }
}
```

**Status: Failed**
```typescript
{
  "success": false,
  "data": {
    "status": "failed",
    "error_message": "Failed to parse PDF file"
  }
}
```

---

## Rate Limiting

All API endpoints are rate limited to prevent abuse:

| Endpoint Pattern | Limit | Window | Burst Allowance |
|-----------------|-------|--------|-----------------|
| `POST /api/v1/profiles` | 10 requests | per minute | +5 (first minute) |
| `PUT /api/v1/profiles/:id` | 30 requests | per minute | +10 |
| `POST /api/v1/profiles/upload-cv` | 5 requests | per hour | +2 (first hour) |
| `GET /api/v1/profiles/extraction-jobs/:id` | 60 requests | per minute | N/A (polling) |
| All other `GET` endpoints | 100 requests | per minute | +20 |
| All other `DELETE` endpoints | 20 requests | per minute | +5 |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1696512000 (Unix timestamp)
X-RateLimit-Retry-After: 45 (seconds until reset)
```

**429 Rate Limit Exceeded Response:**
```typescript
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 45 seconds.",
    "retry_after_seconds": 45
  },
  "meta": {
    "timestamp": "2025-10-05T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

**Implementation Note:** Rate limiting is per-user (based on `auth.uid()`). For unauthenticated requests (if supported), limit by IP address.

---

## Error Response Format

**Standard Error:**
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "field": "email",           // optional, which field failed
    "details": {...}            // optional, validation details
  },
  "meta": {
    "timestamp": "2025-10-05T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` (400) - Invalid request data or failed validation
- `UNAUTHORIZED` (401) - Missing or invalid authentication token
- `FORBIDDEN` (403) - Authenticated but not authorized for this resource
- `NOT_FOUND` (404) - Resource does not exist
- `CONFLICT` (409) - Duplicate resource or version mismatch (optimistic locking)
- `PAYLOAD_TOO_LARGE` (413) - File upload exceeds 5MB limit
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests, see rate limiting section
- `INTERNAL_ERROR` (500) - Unexpected server error
- `SERVICE_UNAVAILABLE` (503) - Temporary service disruption (maintenance, database down)

---

**For full implementation details, see:** `TD003_Backend_Architecture.md`
