# Technical Decision Document: TD001
# General Architecture - Master Profile System

**Version:** 1.0
**Date:** October 5, 2025
**Status:** Proposed
**Decision Makers:** Architecture Team, Engineering Leads

---

## Document Purpose

This document outlines the core architectural decisions for implementing the Master Profile Creation & Management system within the existing Cari Kerja application.

---

## 1. System Architecture Overview

### 1.1 Current Architecture (Existing)

```
┌─────────────────────────────────────────────────────────┐
│                    EXISTING SYSTEM                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Vue 3 Frontend  ───────►  Supabase DB                 │
│  (Kanban UI)                 (Jobs, Documents)          │
│       │                                                 │
│       │                                                 │
│       ▼                           ▲                     │
│  Cloudflare Workers  ─────────────┘                     │
│  (Cron: Every 5min)                                     │
│  - extract_job_info                                     │
│  - calculate_match                                      │
│  - generate_cv                                          │
│  - generate_cover_letter                                │
│  - review_cv/cover_letter                               │
│                                                         │
│  Source of Truth: 01_Profile/master_profile.md (FILE)  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Proposed Architecture (With Master Profile)

```
┌──────────────────────────────────────────────────────────────┐
│                    ENHANCED SYSTEM                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐         ┌───────────────────────┐   │
│  │  Vue 3 Frontend    │         │  Supabase Database    │   │
│  │                    │         │                       │   │
│  │  - Job Kanban      │◄────────┤  - jobs               │   │
│  │  - Profile Manager │         │  - job_documents      │   │
│  │  - CV Upload       │         │  - processing_queue   │   │
│  │  - Profile Forms   │         │                       │   │
│  └──────┬─────────────┘         │  NEW:                 │   │
│         │                       │  - master_profiles    │   │
│         │                       │  - work_experiences   │   │
│         ▼                       │  - skills             │   │
│  ┌────────────────────┐         │  - education          │   │
│  │  Cloudflare Workers│         │  - certifications     │   │
│  │                    │         │  - languages          │   │
│  │  Existing:         │◄────────┤  - profile_versions   │   │
│  │  - Job processing  │         │                       │   │
│  │                    │         └───────────────────────┘   │
│  │  NEW:              │                                     │
│  │  - CV extraction   │────►  Anthropic Claude API          │
│  │  - Profile         │       (CV → Structured Data)        │
│  │    validation      │                                     │
│  │  - File upload     │         ┌───────────────────────┐   │
│  │                    │◄────────┤ Supabase Storage      │   │
│  └────────────────────┘         │ - master-profile-cvs/ │   │
│                                 │ - job-documents/      │   │
│                                 └───────────────────────┘   │
│                                                              │
│  Source of Truth: Supabase DB (master_profiles table)       │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Key Architectural Decisions

### Decision AD-001: Database as Source of Truth

**Status:** ✅ **APPROVED**

**Context:**
Currently, profile data exists in `01_Profile/master_profile.md` (markdown file). This approach has limitations:
- No structured validation
- Manual editing prone to errors
- No version control
- Cannot support multiple profiles
- No audit trail

**Decision:**
**Migrate master profile to Supabase PostgreSQL database as the single source of truth.**

**Rationale:**
1. **Data Integrity:** Database constraints ensure valid data
2. **Scalability:** Support multiple profiles per user
3. **Versioning:** Built-in audit trail with profile_versions table
4. **Integration:** Seamless integration with existing job system
5. **Performance:** Indexed queries faster than file parsing

**Consequences:**
- ✅ Structured data validation
- ✅ Support for multiple profiles
- ✅ Version history tracking
- ✅ Better integration with job matching
- ❌ Migration effort from file-based system
- ❌ Slightly increased database complexity

**Migration Strategy:**
1. Create new tables (Phase 1)
2. Build import tool for existing master_profile.md
3. Run import as one-time migration
4. Keep file as backup during transition
5. Eventually deprecate file-based approach

---

### Decision AD-002: Database Schema Design

**Status:** ✅ **APPROVED**

**Decision:**
**Use normalized relational schema with one-to-many relationships for complex data.**

**Schema Overview:**

```sql
master_profiles (1) ─────► work_experiences (N)
                │                   │
                │                   └────► achievements (N)
                │
                ├────────────────► skills (N)
                ├────────────────► education (N)
                ├────────────────► certifications (N)
                ├────────────────► languages (N)
                └────────────────► profile_versions (N)

jobs (N) ─────────────────► profile_versions (1)
                              (immutable link)
```

**Key Design Principles:**

1. **Normalization**
   - Separate tables for repeatable entities (skills, experiences)
   - Reduces data duplication
   - Easier to query and update

2. **Immutable Profile-Job Link**
   - Jobs link to specific `profile_versions` entry
   - Even if profile changes, job retains original version
   - Critical for audit trail

3. **Flexible Ordering**
   - `display_order` field for user-controlled ordering
   - Important for CV generation (order matters)

4. **Soft Constraints**
   - Optional fields allow flexibility
   - Required fields enforced at DB level
   - Additional validation at application level

**Alternatives Considered:**

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **JSONB Single Table** | Simple, flexible schema | Hard to query, no relational integrity | ❌ Rejected |
| **Normalized (Chosen)** | Type safety, queryable, validated | More tables to manage | ✅ Approved |
| **Hybrid** | Balance of both | Complex, harder to maintain | ❌ Rejected |

---

### Decision AD-003: File Storage Strategy

**Status:** ✅ **APPROVED**

**Decision:**
**Store uploaded CV files in Supabase Storage with metadata in database.**

**Implementation:**

```typescript
// Storage bucket structure
supabase-storage/
└── master-profile-cvs/
    └── {user_id}/
        └── {profile_id}/
            └── {timestamp}_{original_filename}

// Database reference
master_profiles.original_cv_file_path = "master-profile-cvs/user123/profile456/1696543200_resume.pdf"
```

**Rationale:**
1. **Separation of Concerns:** Binary files in storage, metadata in DB
2. **Cost Efficiency:** Storage cheaper than database BLOBs
3. **Performance:** CDN delivery for file downloads
4. **Security:** Signed URLs with expiration
5. **Scalability:** Independent scaling of storage and database

**Security Measures:**
- Private bucket (not public)
- Row-Level Security (RLS) enforced
- Signed URLs for downloads (expire after 1 hour)
- File type validation (whitelist: PDF, DOCX, TXT)
- Size limits (5MB max)
- Virus scanning (future: integrate ClamAV or similar)

---

### Decision AD-004: CV Extraction Architecture

**Status:** ✅ **APPROVED**

**Decision:**
**Use Anthropic Claude API for CV extraction via asynchronous Cloudflare Worker.**

**Flow:**

```
1. User uploads CV
   ↓
2. Frontend uploads to Supabase Storage
   ↓
3. Frontend calls /api/profiles/upload-cv
   ↓
4. Worker creates extraction task in processing_queue
   ↓
5. Worker returns task_id to frontend
   ↓
6. Frontend polls /api/profiles/extraction/{task_id}
   ↓
7. Cron job (every 5min) processes pending tasks
   ↓
8. Worker downloads file, calls Claude API
   ↓
9. Worker parses response, saves to extraction_results
   ↓
10. Frontend receives extracted data
   ↓
11. Frontend pre-fills form with data
```

**Why Asynchronous:**
- CV extraction takes 10-30 seconds
- Avoids HTTP timeout issues
- Better UX with progress updates
- Consistent with existing job processing pattern

**Error Handling:**
- Retry logic: 3 attempts with exponential backoff
- Timeout: 60 seconds per attempt
- Fallback: Manual entry if extraction fails
- User notification: Clear error messages

---

### Decision AD-005: API Design Pattern

**Status:** ✅ **APPROVED**

**Decision:**
**RESTful API with resource-based endpoints following existing Hono patterns.**

**Endpoint Structure:**

```
POST   /api/profiles/upload-cv         # Upload CV file
GET    /api/profiles/extraction/:id    # Check extraction status
POST   /api/profiles                   # Create profile
GET    /api/profiles                   # List profiles
GET    /api/profiles/:id               # Get profile with details
PUT    /api/profiles/:id               # Update profile
DELETE /api/profiles/:id               # Delete profile
POST   /api/profiles/:id/set-default   # Set as default
POST   /api/profiles/:id/duplicate     # Duplicate profile
GET    /api/profiles/:id/versions      # Get version history
```

**Consistency with Existing:**
- Same Hono middleware (auth, CORS)
- Same error response format
- Same validation patterns
- Same database access patterns (Supabase client)

**Request/Response Format:**

```typescript
// Standard success response
{
  success: true,
  data: {...},
  meta: {
    timestamp: "2025-10-05T10:30:00Z",
    request_id: "req_abc123"
  }
}

// Standard error response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid email format",
    field: "email",
    details: {...}
  },
  meta: {
    timestamp: "2025-10-05T10:30:00Z",
    request_id: "req_abc123"
  }
}
```

---

### Decision AD-006: Authentication & Authorization

**Status:** ✅ **APPROVED**

**Decision:**
**Use Supabase Auth with Row-Level Security (RLS) for authorization.**

**Current State:**
- Authentication: Not yet implemented (permissive RLS policies)
- Future-ready: Auth middleware placeholder exists

**Master Profile RLS Policies:**

```sql
-- Users can only see own profiles
CREATE POLICY "Users can view own profiles"
  ON master_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create profiles for themselves
CREATE POLICY "Users can create own profiles"
  ON master_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update own profiles
CREATE POLICY "Users can update own profiles"
  ON master_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete own profiles
CREATE POLICY "Users can delete own profiles"
  ON master_profiles FOR DELETE
  USING (auth.uid() = user_id);
```

**Multi-Tenancy:**
- Each user isolated by `user_id`
- RLS enforces at database level
- No application-level checks needed (defense in depth)

---

### Decision AD-007: Caching Strategy

**Status:** ✅ **APPROVED**

**Decision:**
**Client-side caching with Pinia stores, server-side caching for AI extraction results.**

**Client-Side (Frontend):**
```typescript
// Pinia store caches profiles
const profilesStore = useProfilesStore();

// Cache invalidation
- On create: Add to cache
- On update: Update cache entry
- On delete: Remove from cache
- On profile switch: Clear and reload
```

**Server-Side (Workers):**
```typescript
// Cache extraction results for 24 hours
// Prevents re-extraction of same CV

cacheKey = sha256(file_content)
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
// ... extract ...
cache.set(cacheKey, result, ttl: 86400);
```

**Why This Approach:**
- Reduces API calls
- Improves perceived performance
- Saves Anthropic API costs (extraction is expensive)
- Consistent with existing job caching patterns

---

### Decision AD-008: Validation Strategy

**Status:** ✅ **APPROVED**

**Decision:**
**Three-layer validation: Client → Server → Database.**

**Layer 1: Client-Side (Immediate Feedback)**
```typescript
// Real-time validation with @vueuse/integrations (Zod)
const schema = z.object({
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone"),
  // ... more rules
});

// Validate on blur, show errors immediately
```

**Layer 2: Server-Side (Security)**
```typescript
// Validate in API endpoint before DB operations
const validation = validateProfileData(request.body);
if (!validation.success) {
  return c.json({ error: validation.errors }, 400);
}
```

**Layer 3: Database (Integrity)**
```sql
-- Constraints enforce rules
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
CHECK (end_date >= start_date)
CHECK (metric_value >= 0)
```

**Benefits:**
- UX: Immediate feedback (client)
- Security: Cannot bypass client validation (server)
- Integrity: Last line of defense (database)

---

### Decision AD-009: Error Handling & Logging

**Status:** ✅ **APPROVED**

**Decision:**
**Structured logging with different log levels, user-friendly error messages.**

**Logging Levels:**

```typescript
// Development: Log everything
if (env.ENVIRONMENT === 'development') {
  console.log('[DEBUG]', details);
}

// Production: Only warnings and errors
console.warn('[WARN]', issue);
console.error('[ERROR]', error, { context });
```

**Error Categories:**

| Type | Example | User Message | Log Level |
|------|---------|--------------|-----------|
| Validation | Invalid email | "Please enter a valid email" | WARN |
| Business Logic | Duplicate profile name | "Profile name already exists" | INFO |
| Integration | AI API timeout | "Extraction taking longer than expected" | ERROR |
| System | Database down | "Service temporarily unavailable" | CRITICAL |

**Error Tracking (Future):**
- Integrate Sentry or similar
- Track error rates and patterns
- Alert on critical errors

---

### Decision AD-010: Performance Targets

**Status:** ✅ **APPROVED**

**Decision:**
**Set concrete performance targets for all operations.**

| Operation | Target | Measurement |
|-----------|--------|-------------|
| CV Upload (2MB) | < 5 seconds | Frontend to Storage |
| AI Extraction | < 30 seconds | Worker execution |
| Form Load | < 1 second | First Contentful Paint |
| Form Submit | < 2 seconds | API response time |
| Profile List | < 500ms | API + render |
| Auto-save | < 500ms | Debounced API call |

**Monitoring:**
- Cloudflare Workers analytics
- Frontend Performance API
- Supabase dashboard metrics

---

## 3. Technology Stack Decisions

### 3.1 Frontend Stack (No Changes)

| Technology | Version | Justification |
|------------|---------|---------------|
| Vue 3 | ^3.5.22 | Existing, mature, team expertise |
| TypeScript | ~5.9.3 | Type safety, existing |
| Pinia | ^3.0.3 | State management, existing |
| Tailwind CSS | ^4.1.14 | Styling, existing |
| Vite | ^7.1.7 | Build tool, existing |

**Rationale:** Maintain consistency with existing codebase.

### 3.2 Backend Stack (Minor Additions)

| Technology | Version | Justification |
|------------|---------|---------------|
| Hono | Latest | Existing, lightweight |
| Cloudflare Workers | N/A | Existing, serverless |
| @anthropic-ai/sdk | ^0.27.0 | **NEW** for CV extraction |
| pdf-parse | ^1.1.1 | **NEW** for PDF parsing |
| mammoth | ^1.7.0 | **NEW** for DOCX parsing |

**New Dependencies Rationale:**
- **@anthropic-ai/sdk:** Official Claude API client
- **pdf-parse:** Battle-tested, 5M+ downloads/month
- **mammoth:** Microsoft-recommended DOCX parser

### 3.3 Database Stack (Additions Only)

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Database | Supabase PostgreSQL | Existing |
| Storage | Supabase Storage | Existing |
| **New Tables** | 7 tables | See schema in PRD |
| **Indexes** | 12 indexes | Performance optimization |

---

## 4. Security Decisions

### Decision SD-001: Input Sanitization

**All user inputs sanitized:**
- XSS prevention (Vue automatically escapes)
- SQL injection prevention (Supabase parameterized queries)
- File upload validation (MIME type, size, extension)

### Decision SD-002: File Upload Security

**Measures:**
1. Whitelist file types: PDF, DOCX, TXT
2. Max size: 5MB
3. Virus scanning (future)
4. Private bucket (not publicly accessible)
5. Signed URLs with 1-hour expiration

### Decision SD-003: Data Privacy

**Sensitive fields:**
- Email, phone numbers encrypted at rest (Supabase default)
- PII not logged
- RLS enforces access control
- GDPR-compliant data export (future)

---

## 5. Scalability Decisions

### Decision SC-001: Database Scaling

**Approach:** Vertical scaling with Supabase, horizontal scaling via read replicas (future)

**Projections:**
- 1,000 users × 3 profiles = 3,000 profiles
- 7 work experiences × 3,000 = 21,000 experiences
- 50 skills × 3,000 = 150,000 skills

**Total rows:** ~200K (well within PostgreSQL capacity)

### Decision SC-002: Worker Scaling

**Approach:** Cloudflare Workers auto-scale

**Concurrency:** 100 concurrent extractions supported

**Rate Limiting:**
- 100 requests/minute per user (API)
- 10 file uploads/hour per user (prevent abuse)

---

## 6. Migration Strategy

### Phase 1: Database Setup
1. Run migration SQL (create tables)
2. Deploy RLS policies
3. Create storage bucket

### Phase 2: Backend Development
1. Implement API endpoints
2. Implement CV extraction worker
3. Add validation logic

### Phase 3: Frontend Development
1. Build profile management UI
2. Build profile form components
3. Integrate with backend APIs

### Phase 4: Data Migration
1. Build import tool
2. Parse existing master_profile.md
3. Import to database
4. Verify data integrity

### Phase 5: Testing & Launch
1. E2E testing
2. User acceptance testing
3. Phased rollout
4. Monitor and iterate

---

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI extraction accuracy low | High | Medium | Confidence scores, easy editing, fallback to manual |
| Database migration fails | High | Low | Dry run, rollback plan, keep file backup |
| Performance degradation | Medium | Low | Load testing, caching, monitoring |
| Storage costs high | Low | Low | File size limits, cleanup policy |

---

## 8. Open Questions

1. **Q:** Should we implement profile sharing in future?
   **A:** Out of scope for now, revisit in Phase 3

2. **Q:** How long to retain uploaded CV files?
   **A:** Until profile is deleted (no automatic cleanup)

3. **Q:** Support for LinkedIn HTML import?
   **A:** Nice-to-have, defer to Phase 2

---

## 9. Decision Log

| ID | Decision | Date | Status |
|----|----------|------|--------|
| AD-001 | Database as source of truth | 2025-10-05 | ✅ Approved |
| AD-002 | Normalized schema | 2025-10-05 | ✅ Approved |
| AD-003 | Supabase Storage for files | 2025-10-05 | ✅ Approved |
| AD-004 | Async CV extraction | 2025-10-05 | ✅ Approved |
| AD-005 | RESTful API design | 2025-10-05 | ✅ Approved |
| AD-006 | Supabase Auth + RLS | 2025-10-05 | ✅ Approved |
| AD-007 | Client + server caching | 2025-10-05 | ✅ Approved |
| AD-008 | Three-layer validation | 2025-10-05 | ✅ Approved |
| AD-009 | Structured logging | 2025-10-05 | ✅ Approved |
| AD-010 | Performance targets | 2025-10-05 | ✅ Approved |

---

## 10. Next Steps

1. ✅ **Review this document** with foreman-backend-specialist
2. ⏳ **Create TD002** (Frontend Architecture)
3. ⏳ **Create TD003** (Backend Architecture)
4. ⏳ **Specialist review** (chase, foreman, cameron, house)
5. ⏳ **Implementation planning**

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-05 | Architecture Team | Initial draft |

---

**Approval:**
- Architecture Lead: _________________ Date: __________
- Backend Lead: _____________________ Date: __________
- Frontend Lead: ____________________ Date: __________
