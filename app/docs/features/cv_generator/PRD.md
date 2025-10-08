# Product Requirements Document (PRD)
# CV & Cover Letter Generator - Background Processing

**Version:** 1.0
**Status:** Draft
**Last Updated:** October 7, 2025
**Owner:** Product Team
**Priority:** MEDIUM-HIGH

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Context & Background](#2-context--background)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Stories & Personas](#4-user-stories--personas)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Implementation Phases](#8-implementation-phases)
9. [Dependencies & Risks](#9-dependencies--risks)
10. [Out of Scope](#10-out-of-scope)

---

## 1. Executive Summary

### 1.1 Feature Name
**Automated CV & Cover Letter Generator** (Background Worker)

### 1.2 Problem Statement

**Current State:**
- CV and cover letter generation happens via local CLI (`.claude/commands/cv_letsgo.md`)
- User must be present for entire 15-30 minute generation process
- Cannot generate applications while away from computer or sleeping
- Single-threaded process - cannot queue multiple jobs

**Pain Points:**
- **Availability Constraint**: Must be at computer to start/monitor generation
- **Time Blocking**: 15-30 minutes per application where user can't do other work
- **No Batch Processing**: Can't queue 5 jobs before bed and wake up to ready CVs
- **Mobile Limitation**: Can't start generation from phone while browsing job boards
- **Fragile Process**: If CLI fails mid-way, lose all progress

**Impact on Goals:**
- Current: 10-15 applications/month
- Target: 20+ applications/month
- **Blocker**: Time availability limits application velocity

### 1.3 Solution Overview

Build a cloud-based background processing system that:
1. **Generates** tailored CVs and cover letters asynchronously via Cloudflare Workers
2. **Queues** tasks in Supabase processing queue (infrastructure already exists)
3. **Notifies** user when generation complete
4. **Stores** generated documents in Supabase Storage
5. **Integrates** with kanban board for easy triggering and access

### 1.4 Key Goals

**PRIMARY GOAL:**
1. **Remove availability constraint** - Generate CVs without user presence
   - **Target**: Queue 5 jobs, walk away, return to 5 ready applications
   - **Metric**: Applications generated while user offline

**SECONDARY GOALS:**
2. **Increase application velocity** - From 10-15/month to 20+/month
3. **Reduce context switching** - No 15-30min blocks of waiting
4. **Maintain quality** - Match or exceed current CLI output quality
5. **Enable mobile workflow** - Start generation from phone

### 1.5 Success Metrics

**PRIMARY METRICS (MVP - Phase 1):**

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Applications per month | 10-15 | 20+ | Manual tracking |
| Time saved per week | 0 | ≥ 2 hours | Usage analytics |
| Offline generations | 0 | 30% of total | Worker logs |
| Generation success rate | N/A | ≥ 95% | Worker task completion rate |

**BUSINESS OUTCOME METRICS:**

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Time from job discovery → ready CV | 15-30 min | ≤ 10 min (async) | Time tracking |
| Failed generation recovery time | Manual restart | Auto-retry | Error logs |
| Mobile-initiated generations | 0 | 20% of total | Trigger source tracking |

---

## 2. Context & Background

### 2.1 Current System Architecture

```
Current Flow (CLI-based):
┌─────────────────────────────────┐
│ User runs /cv_letsgo command    │
│ (Must stay at computer)         │
└──────────┬──────────────────────┘
           │
           ↓ (15-30 minutes, blocking)
┌───────────────────────────────────────┐
│ 1. Extract job info                   │
│ 2. Create application folder          │
│ 3. Calculate match percentage         │
│ 4. Generate CV (draft)                │
│ 5. Generate cover letter (draft)      │
│ 6. Optimistic review (CV + CL)        │
│ 7. Skeptical review (CV + CL)         │
│ 8. Manager synthesis (final versions) │
│ 9. Convert to LaTeX (8 files)         │
│ 10. Compile to PDF (8 files)          │
│ 11. Done                               │
└───────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│ 04_Applications/CompanyName_... │
│ ├── job-spec.md                 │
│ ├── *-cv.md/.tex/.pdf (4 vers) │
│ └── *-cover-letter-*.* (4 vers)│
└─────────────────────────────────┘
```

### 2.2 Proposed System Architecture

```
Proposed Flow (Cloud-based):
┌─────────────────────────────────┐
│ User clicks "Generate CV" on    │
│ kanban card (takes 2 seconds)   │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│ Cloudflare Worker Queue         │
│ Task Type: 'generate_cv'        │
│ Status: 'pending'               │
└──────────┬──────────────────────┘
           │
           ↓ (Background processing)
┌────────────────────────────────────┐
│ Worker picks up task               │
│ 1. Fetch master profile            │
│ 2. Fetch job description           │
│ 3. Generate CV markdown            │
│ 4. Generate cover letter markdown  │
│ 5. Convert to LaTeX                │
│ 6. Compile to PDF (external svc)  │
│ 7. Store in Supabase Storage       │
│ 8. Update task status: 'completed'│
└────────────┬───────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│ User receives notification      │
│ "Your CV for [Company] is ready"│
│ Downloads from kanban card      │
└─────────────────────────────────┘
```

### 2.3 Why Now?

1. **Infrastructure Ready**: Task queue system already exists in database
2. **Proven Workflow**: CLI version validates prompt quality and process
3. **Clear ROI**: 33%+ increase in applications (10-15 → 20+)
4. **Job Market Timing**: Active job search phase, need velocity
5. **Technical Feasibility**: Cloudflare Workers already deployed for job parser

---

## 3. Goals & Success Metrics

### 3.1 Primary Goals

#### Goal 1: Remove Availability Constraint
**Metric:** % of CVs generated while user offline
**Target:** ≥ 30% of generations happen overnight or while user away
**Measurement:** Worker execution timestamps vs user activity

#### Goal 2: Increase Application Velocity
**Metric:** Applications per month
**Target:** 20+ (up from 10-15)
**Measurement:** Manual tracking in kanban board

#### Goal 3: Maintain Quality
**Metric:** CV quality score (skeptical reviewer)
**Target:** ≥ 4/5 average rating
**Measurement:** Run cv-skeptical-reviewer agent on generated CVs

### 3.2 Secondary Goals

- **Time Savings:** ≥ 2 hours per week saved on CV generation
- **Success Rate:** ≥ 95% task completion without errors
- **Mobile Enablement:** 20% of generations triggered from mobile device

### 3.3 Anti-Goals (What We're NOT Trying to Achieve)

- ❌ Replace CLI tool (keep as power-user option)
- ❌ Real-time streaming generation (async is fine)
- ❌ In-browser PDF compilation (use external service)
- ❌ Custom CV templates per job (use master profile only)

---

## 4. User Stories & Personas

### 4.1 Primary Persona

**Name:** Kenni Gandira
**Role:** Senior Frontend Engineer
**Age:** 30+
**Location:** Bangkok, Thailand
**Tech Stack:** Vue.js, TypeScript, React, Node.js
**Job Search Status:** Actively seeking (10-15 applications/month)

**Goals:**
- Apply to 20+ positions per month
- Maintain high-quality tailored CVs
- Minimize time spent on repetitive tasks
- Respond quickly to new job postings

**Pain Points:**
- Can't generate CVs while at work or sleeping
- Miss opportunities due to slow response time
- Waste time babysitting CLI for 15-30 minutes
- Can't start application from phone

### 4.2 User Stories

#### Epic 1: Background CV Generation

**US-1.1: Queue CV Generation from Kanban Card** (Must-Have)
```
As a job seeker
I want to click "Generate CV" on a kanban job card
So that the system creates a tailored CV in the background

Acceptance Criteria:
- ✅ "Generate CV" button visible on job card detail view
- ✅ Clicking creates task in processing_queue_tasks table
- ✅ Task shows status: pending → processing → completed
- ✅ User sees progress indicator on kanban card
- ✅ Notification when generation complete
- ✅ Generated CV downloadable from kanban card
```

**Priority**: P0 (Critical)
**Size**: 5 points
**Dependencies**: Master profile data exists, Kanban card detail view

---

**US-1.2: Worker Generates CV Markdown** (Must-Have)
```
As the system
I want to generate CV markdown from master profile
So that CVs are tailored to each job description

Acceptance Criteria:
- ✅ Worker fetches master profile from Supabase
- ✅ Worker fetches job description from job card
- ✅ Uses Claude API to generate tailored CV markdown
- ✅ Follows current cv_letsgo.md prompt quality
- ✅ Stores markdown in Supabase Storage
- ✅ Updates task status on completion
- ✅ Handles failures with retry logic (3 attempts)
```

**Priority**: P0 (Critical)
**Size**: 13 points
**Dependencies**: Anthropic API access, Master profile API

---

**US-1.3: Worker Generates Cover Letter** (Should-Have)
```
As a job seeker
I want a cover letter generated alongside my CV
So that I have a complete application package

Acceptance Criteria:
- ✅ Cover letter generated in same worker task
- ✅ 300-350 word limit enforced
- ✅ Uses master profile data
- ✅ Tailored to job description
- ✅ Stored alongside CV in Supabase Storage
- ✅ Both CV and CL available together
```

**Priority**: P1 (High)
**Size**: 8 points
**Dependencies**: US-1.2 completed

---

**US-1.4: PDF Compilation via External Service** (Must-Have)
```
As the system
I want to compile LaTeX to PDF using an external service
So that I can avoid resource limits in Cloudflare Workers

Acceptance Criteria:
- ✅ LaTeX files sent to Render.com service (tectonic)
- ✅ PDFs returned and stored in Supabase Storage
- ✅ Fallback if external service fails (retry or notify user)
- ✅ PDF quality matches current CLI output
```

**Priority**: P0 (Critical)
**Size**: 8 points
**Dependencies**: US-1.2 completed, External service account

---

#### Epic 2: Enhanced Review Process (Phase 2)

**US-2.1: Multi-Stage Review Process** (Nice-to-Have)
```
As a job seeker
I want my CV to go through optimistic and skeptical reviews
So that I get the highest quality final output

Acceptance Criteria:
- ✅ Draft CV generated immediately
- ✅ Optimistic review queued as separate task
- ✅ Skeptical review runs after optimistic
- ✅ Manager synthesis creates final version
- ✅ All 4 versions stored and accessible
- ✅ User notified at each stage
```

**Priority**: P2 (Low - Phase 2)
**Size**: 13 points
**Dependencies**: US-1.2 completed, Claude API budget

---

**US-2.2: Version Comparison UI** (Nice-to-Have)
```
As a job seeker
I want to compare different CV versions side-by-side
So that I can choose the best one for each application

Acceptance Criteria:
- ✅ View all versions in kanban card detail
- ✅ Preview each version
- ✅ Mark preferred version
- ✅ Download any version as PDF
```

**Priority**: P2 (Low - Phase 2)
**Size**: 5 points
**Dependencies**: US-2.1 completed

---

## 5. Functional Requirements

### 5.1 Core Features (Must-Have - Phase 1)

#### F-1: Background Task Queue Integration

**Description:** Use existing processing_queue_tasks table to queue CV generation tasks

**Requirements:**

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| F-1.1 | Create generate_cv task | P0 | Task inserted with all required fields |
| F-1.2 | Task status tracking | P0 | Status: pending → processing → completed/failed |
| F-1.3 | Task payload structure | P0 | JSON with job_id, profile_id, options |
| F-1.4 | Retry logic | P0 | Auto-retry up to 3 times on failure |
| F-1.5 | Task timeout | P0 | Fail task if exceeds 5 minutes |

**Task Payload Structure:**
```typescript
{
  task_type: 'generate_cv',
  payload: {
    job_id: string,           // From kanban card
    profile_id: string,       // Master profile to use
    generate_cover_letter: boolean,
    include_reviews: boolean, // Phase 2 only
    output_format: 'pdf',     // Future: 'markdown', 'latex'
  },
  status: 'pending',
  created_at: timestamp,
  started_at: null,
  completed_at: null,
  attempts: 0,
  max_attempts: 3,
  error_message: null
}
```

---

#### F-2: CV Markdown Generation

**Description:** Generate tailored CV markdown using Claude API

**Requirements:**

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| F-2.1 | Fetch master profile | P0 | Profile data retrieved from Supabase |
| F-2.2 | Fetch job description | P0 | Job description from jobs table |
| F-2.3 | Claude API integration | P0 | Use proven prompt from cv_letsgo.md |
| F-2.4 | Markdown formatting | P0 | Output valid markdown matching current format |
| F-2.5 | Storage in Supabase | P0 | Save to Supabase Storage bucket |

**Prompt Strategy:**
Reuse proven prompt from `.claude/commands/cv_letsgo.md` with modifications:
- Remove multi-stage review (Phase 1)
- Focus on single high-quality output
- Maintain factual accuracy requirements
- Include all master profile data

---

#### F-3: Cover Letter Generation

**Description:** Generate tailored cover letter alongside CV

**Requirements:**

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| F-3.1 | 300-350 word limit | P0 | Cover letter within word count |
| F-3.2 | Job-specific tailoring | P0 | References job requirements |
| F-3.3 | Professional tone | P0 | Matches current CLI quality |
| F-3.4 | Markdown format | P0 | Valid markdown output |

---

#### F-4: LaTeX Compilation

**Description:** Convert markdown to LaTeX and compile to PDF

**Requirements:**

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| F-4.1 | Markdown → LaTeX conversion | P0 | Uses current template structure |
| F-4.2 | External LaTeX service | P0 | Render.com with tectonic (FREE) |
| F-4.3 | PDF quality validation | P0 | Output matches CLI PDF quality |
| F-4.4 | Error handling | P0 | Fallback if compilation fails |

**LaTeX Service Options:**
1. **Render.com + Tectonic** (RECOMMENDED - FREE)
   - Free tier: 750 hours/month (24/7 uptime)
   - Uses same tectonic as local CLI
   - API: POST LaTeX string, receive PDF
   - Pros: FREE, same quality, no rate limits
   - Cons: Cold starts (~30s), slower compilation

2. **Gotenberg** (Self-hosted alternative)
   - Docker container
   - Markdown/HTML → PDF via Chromium
   - Pros: Full control, no limits
   - Cons: Requires paid hosting (~$10/month)

3. **SwiftLaTeX** (Browser-based alternative)
   - WebAssembly LaTeX compiler
   - Runs in user's browser
   - Pros: Zero server cost
   - Cons: Different engine, browser dependency

---

#### F-5: Notification System

**Description:** Notify user when CV generation complete

**Requirements:**

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| F-5.1 | In-app notification | P0 | Notification appears in UI |
| F-5.2 | Email notification | P1 | Email sent with download link |
| F-5.3 | Notification content | P0 | Company name, job title, CV ready |
| F-5.4 | Notification persistence | P0 | Notification stored in database |

---

### 5.2 Enhanced Features (Should-Have - Phase 2)

#### F-6: Multi-Stage Review Process

**Description:** Implement 3-stage review (optimistic → skeptical → manager synthesis)

**Requirements:**
- Chain multiple tasks (draft → optimistic → skeptical → final)
- Each stage as separate worker task
- Store intermediate versions
- User can access any version

**Estimated Effort:** 13 points

---

#### F-7: Bulk Generation

**Description:** Queue multiple CV generations at once

**Requirements:**
- Select multiple jobs from kanban board
- Queue all as separate tasks
- Progress indicator for batch
- Summary notification when all complete

**Estimated Effort:** 8 points

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| CV Generation Time | < 3 minutes | Worker execution time |
| PDF Compilation Time | < 1 minute | External service response |
| Task Queue Latency | < 5 seconds | Time from trigger to worker pickup |
| Concurrent Generations | Support 5 simultaneous | Load testing |

### 6.2 Reliability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Task Success Rate | ≥ 95% | Retry logic, error handling |
| Data Loss Prevention | 0% | Store intermediate results |
| Graceful Degradation | Yes | Fallback to CLI if worker fails |

### 6.3 Security

| Requirement | Implementation |
|-------------|----------------|
| API Key Protection | Store in Cloudflare Worker secrets |
| Data Access Control | RLS policies for master profile |
| PDF Storage Security | Private Supabase Storage bucket with signed URLs |
| Audit Trail | Log all task executions |

### 6.4 Cost

| Component | Free Tier | Estimated Cost |
|-----------|-----------|----------------|
| Cloudflare Workers | 100k requests/day | $0/month (within free tier) |
| Anthropic Claude API | Pay-per-token | $5-10/month (20 CVs × $0.30 avg) |
| Supabase Storage | 1GB free | $0/month (PDFs ~2MB each) |
| Render.com (Tectonic) | 750 hours/month | $0/month (FREE, 24/7 uptime) |
| **Total** | | **$5-10/month** |

---

## 7. Technical Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical design.

**High-Level Components:**
1. Frontend UI (Kanban card integration)
2. Cloudflare Worker (task processing)
3. Supabase Storage (file storage)
4. External LaTeX service (PDF compilation)
5. Notification system

---

## 8. Implementation Phases

### Phase 1: MVP - Async Generation (3-4 weeks)

**Scope:**
- Single-stage CV generation (no reviews)
- Cover letter generation
- PDF compilation via external service
- Basic notification system

**User Value:**
- Can queue CV generation and walk away
- 95%+ of current CLI quality
- 20+ applications/month achievable

**Deliverables:**
- Cloudflare Worker implementation
- Kanban UI integration
- Supabase Storage setup
- Basic testing suite

---

### Phase 2: Enhanced Generation (2-3 weeks)

**Scope:**
- 3-stage review process
- Version management UI
- Bulk generation
- Email notifications

**User Value:**
- Same quality as CLI (4 versions)
- Comparison between versions
- Batch processing for efficiency

---

## 9. Dependencies & Risks

### 9.1 External Dependencies

| Dependency | Purpose | Risk | Mitigation |
|------------|---------|------|------------|
| Anthropic Claude API | CV generation | Rate limits, cost | Budget monitoring, retry logic |
| Render.com (Free Tier) | PDF compilation (tectonic) | Cold starts, slower CPU | Use UptimeRobot to keep warm |
| Supabase Storage | File storage | Storage limits | Monitor usage, 1GB sufficient |
| Master Profile Data | CV content | Data not migrated | Ensure profile migration complete |

### 9.2 Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| LaTeX compilation in cloud | Low | Medium | Use Render.com + tectonic (same as local) |
| Claude API costs | Medium | Medium | Monitor usage, set budget alerts |
| Worker timeout (60s limit) | Medium | High | Split into multiple tasks if needed |
| PDF quality mismatch | Low | Medium | Extensive testing, template refinement |
| Storage quota exceeded | Low | Low | Monitor usage, implement cleanup |

### 9.3 Product Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Users prefer CLI | Medium | High | Keep CLI as option, dog food cloud version |
| Quality degradation | Low | High | Extensive testing, comparison with CLI |
| Feature complexity creep | Medium | Medium | Strict MVP scope, defer enhancements |

---

## 10. Out of Scope

The following features are explicitly **NOT** included in this release:

### 10.1 Advanced Features
- ❌ Real-time streaming generation progress
- ❌ Custom CV templates per job
- ❌ A/B testing of CV variations
- ❌ AI-powered optimization suggestions
- ❌ Integration with external ATS systems

### 10.2 CLI Replacement
- ❌ Deprecating CLI tool (keep as power-user option)
- ❌ Migrating all workflows to cloud
- ❌ Removing local file generation

### 10.3 Advanced Customization
- ❌ Per-job custom prompts
- ❌ Visual CV designer
- ❌ Interactive editing of generated CVs
- ❌ Version control/branching of CVs

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-07 | Initial PRD creation | Product Team |

---

## Approval Signatures

- **Product Owner:** ⏳ Pending Review
- **Product Manager:** ⏳ Pending Review
- **Engineering Lead:** ⏳ Pending Review

---

## Next Steps

1. ⏳ Review PRD with stakeholders
2. ⏳ Technical spike: LaTeX compilation options (1 week)
3. ⏳ Create detailed user stories with DoR/DoD
4. ⏳ Estimate effort and plan sprints
5. ⏳ Kickoff Sprint 1 (MVP development)

---

## Related Documents

- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical design
- **User Stories:** [USER_STORIES.md](./USER_STORIES.md) - Sprint-ready stories
- **Implementation Plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Phased rollout
- **CLI Workflow:** [/.claude/commands/cv_letsgo.md](/.claude/commands/cv_letsgo.md) - Current working version
