# User Stories
# CV & Cover Letter Generator - Background Processing

**Version:** 1.0
**Last Updated:** October 7, 2025
**Status:** Sprint-Ready

---

## Story Format

All stories follow this format:
- **Title:** Concise description
- **Story:** As a [role], I want to [action], so that [benefit]
- **Priority:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- **Size:** Story points (Fibonacci: 1, 2, 3, 5, 8, 13, 21)
- **Sprint:** Target sprint for implementation
- **Dependencies:** Prerequisites that must be complete
- **Definition of Ready (DoR):** Criteria before starting work
- **Acceptance Criteria:** Testable requirements
- **Definition of Done (DoD):** Criteria for marking complete

---

## Sprint Planning Overview

### Phase 1: MVP (Sprints 1-3)

| Sprint | Duration | Focus | Stories | Total Points |
|--------|----------|-------|---------|--------------|
| Sprint 1 | 2 weeks | Task queue integration | US-1.1, US-1.2 | 13 points |
| Sprint 2 | 2 weeks | PDF generation | US-1.3, US-1.4 | 16 points |
| Sprint 3 | 1 week | Polish & testing | US-1.5, US-1.6 | 8 points |
| **Total** | **5 weeks** | **MVP Complete** | **6 stories** | **37 points** |

### Phase 2: Enhanced (Sprints 4-5)

| Sprint | Duration | Focus | Stories | Total Points |
|--------|----------|-------|---------|--------------|
| Sprint 4 | 2 weeks | Multi-stage reviews | US-2.1 | 13 points |
| Sprint 5 | 1 week | Version management | US-2.2, US-2.3 | 13 points |
| **Total** | **3 weeks** | **Enhanced** | **3 stories** | **26 points** |

---

## Epic 1: Background CV Generation (MVP)

### US-1.1: Queue CV Generation from Kanban Card

**Story:**
```
As a job seeker
I want to click "Generate CV" on a kanban job card
So that the system creates a tailored CV in the background without me having to wait
```

**Priority:** P0 (Critical) - Must have for MVP

**Size:** 5 points

**Sprint:** Sprint 1

**Dependencies:**
- ✅ Kanban card detail view exists
- ✅ Master profile feature deployed
- ✅ processing_queue_tasks table exists

**Definition of Ready:**
- [ ] Kanban card detail view UI spec reviewed
- [ ] Master profile API endpoints documented
- [ ] Task payload schema defined
- [ ] Mockups approved

**Acceptance Criteria:**

**AC-1: Generate CV Button**
- [ ] "Generate CV" button visible on job card detail view
- [ ] Button disabled if CV generation already in progress
- [ ] Button shows loading state during task creation
- [ ] Button text changes to "Generating..." when processing

**AC-2: Task Creation**
- [ ] Clicking button creates task in `processing_queue_tasks` table
- [ ] Task has correct fields:
  ```sql
  task_type = 'generate_cv'
  payload = {
    job_id: uuid,
    profile_id: uuid (from default profile),
    generate_cover_letter: true,
    include_reviews: false
  }
  status = 'pending'
  ```
- [ ] Task creation fails gracefully if no default profile exists

**AC-3: Status Display**
- [ ] Task status visible on kanban card (badge/indicator)
- [ ] Status updates every 5 seconds (polling)
- [ ] Shows: Pending → Processing → Completed/Failed
- [ ] Displays estimated time remaining

**AC-4: Error Handling**
- [ ] Error message if task creation fails
- [ ] User can retry if task creation fails
- [ ] Network errors handled gracefully

**Definition of Done:**
- [ ] Code implemented and reviewed
- [ ] Unit tests written (≥80% coverage)
- [ ] Integration tests for happy path
- [ ] Accessibility tested (keyboard navigation, screen reader)
- [ ] Manual testing on dev environment
- [ ] Documentation updated

**Technical Notes:**
- Use `useCVGenerator` composable for state management
- Polling interval: 5 seconds
- Stop polling after task completes or fails

---

### US-1.2: Worker Generates CV Markdown

**Story:**
```
As the system
I want to generate CV markdown from master profile
So that CVs are tailored to each job description
```

**Priority:** P0 (Critical) - Must have for MVP

**Size:** 8 points

**Sprint:** Sprint 1

**Dependencies:**
- ✅ US-1.1 completed (task queue working)
- ✅ Master profile data accessible via API
- ✅ Anthropic API key configured in worker

**Definition of Ready:**
- [ ] Worker cron trigger configured (every 30 seconds)
- [ ] Supabase service role key configured
- [ ] Claude API prompt documented
- [ ] Master profile query schema defined

**Acceptance Criteria:**

**AC-1: Task Polling**
- [ ] Worker cron runs every 30 seconds
- [ ] Worker queries for pending `generate_cv` tasks
- [ ] Worker updates task status to 'processing' before starting
- [ ] Worker skips tasks with attempts >= 3

**AC-2: Data Fetching**
- [ ] Worker fetches master profile with all nested data:
  ```typescript
  master_profiles {
    *,
    work_experiences (*,achievements(*)),
    skills (*),
    education (*),
    certifications (*)
  }
  ```
- [ ] Worker fetches job data:
  ```typescript
  jobs { company_name, position, job_description, required_skills }
  ```
- [ ] Handles missing data gracefully (logs warning, fails task)

**AC-3: CV Generation**
- [ ] Worker calls Claude API with master profile + job description
- [ ] Uses prompt from `.claude/commands/cv_letsgo.md` (simplified for single-stage)
- [ ] Validates output is valid markdown
- [ ] Output includes:
  - Contact info (from profile)
  - Professional summary (tailored to job)
  - Work experiences (relevant achievements highlighted)
  - Skills (matching job requirements)
  - Education
- [ ] Never fabricates information (all from master profile)

**AC-4: Storage**
- [ ] CV markdown stored in Supabase Storage:
  ```
  cv-generated-docs/{job_id}/final-cv.md
  ```
- [ ] File permissions: private (requires signed URL)
- [ ] Storage path returned in task result

**AC-5: Task Completion**
- [ ] Task status updated to 'completed' on success
- [ ] Task result includes:
  ```json
  {
    "cv_markdown_path": "/cv-generated-docs/.../final-cv.md",
    "generated_at": "2025-10-07T12:00:00Z"
  }
  ```

**AC-6: Error Handling**
- [ ] Retry up to 3 times on transient errors:
  - Claude API rate limit (429)
  - Network timeout
  - Temporary Supabase outage
- [ ] Fail permanently on:
  - Invalid profile data
  - Missing required fields
  - Claude API auth error (401)
- [ ] Error message stored in task.error_message
- [ ] User notified of failure

**Definition of Done:**
- [ ] Worker code implemented
- [ ] Unit tests (mock Claude API, Supabase)
- [ ] Integration tests on staging
- [ ] Load test: 10 concurrent tasks
- [ ] API cost tracking enabled
- [ ] Monitoring alerts configured
- [ ] Documentation: worker architecture

**Technical Notes:**
- Anthropic model: `claude-3-5-sonnet-20241022`
- Max tokens: 4000
- Temperature: 0.7
- Timeout: 60 seconds

---

### US-1.3: Worker Generates Cover Letter

**Story:**
```
As a job seeker
I want a cover letter generated alongside my CV
So that I have a complete application package ready
```

**Priority:** P1 (High) - Should have for MVP

**Size:** 5 points

**Sprint:** Sprint 2

**Dependencies:**
- ✅ US-1.2 completed (CV generation working)

**Definition of Ready:**
- [ ] Cover letter template documented
- [ ] Word count validation spec (300-350 words)
- [ ] Prompt engineering complete

**Acceptance Criteria:**

**AC-1: Cover Letter Generation**
- [ ] Worker generates cover letter markdown after CV
- [ ] Uses same master profile + job data
- [ ] Cover letter format:
  - Header (name, contact)
  - Date
  - Company address (if available)
  - Salutation (Dear Hiring Manager or specific name)
  - 3 paragraphs:
    1. Introduction + position interest
    2. Relevant experience/skills
    3. Call to action
  - Closing (Sincerely, [Name])
- [ ] Word count: 300-350 words
- [ ] Professional tone
- [ ] References specific job requirements

**AC-2: Storage**
- [ ] Cover letter markdown stored:
  ```
  cv-generated-docs/{job_id}/final-cover-letter.md
  ```
- [ ] Task result updated with cover letter path

**AC-3: Conditional Generation**
- [ ] Only generates if `payload.generate_cover_letter = true`
- [ ] Skips gracefully if false (not an error)

**Definition of Done:**
- [ ] Code implemented
- [ ] Unit tests
- [ ] Manual review of 5 sample cover letters
- [ ] Quality passes cv-skeptical-reviewer check

---

### US-1.4: PDF Compilation via External Service

**Story:**
```
As the system
I want to compile LaTeX to PDF using an external service
So that users can download print-ready CVs
```

**Priority:** P0 (Critical) - Must have for MVP

**Size:** 8 points

**Sprint:** Sprint 2

**Dependencies:**
- ✅ US-1.2 completed (markdown generation)
- ✅ Render.com tectonic service deployed (see LATEX_SERVICE.md)

**Definition of Ready:**
- [ ] Render.com service deployed and tested
- [ ] API endpoint URL configured in worker
- [ ] Markdown → LaTeX conversion logic documented
- [ ] LaTeX template refined

**Acceptance Criteria:**

**AC-1: Markdown → LaTeX Conversion**
- [ ] Worker converts CV markdown to LaTeX
- [ ] Uses template from `03_CV_Templates/master_cv.tex`
- [ ] Properly escapes LaTeX special characters
- [ ] Maintains formatting (bold, italic, lists)

**AC-2: LaTeX Compilation**
- [ ] Worker sends LaTeX to Render.com service (tectonic)
- [ ] Receives PDF binary
- [ ] Validates PDF is not corrupted (check file size > 10KB)
- [ ] Timeout: 60 seconds (free tier may be slower)

**AC-3: PDF Storage**
- [ ] PDF stored in Supabase Storage:
  ```
  cv-generated-docs/{job_id}/final-cv.pdf
  ```
- [ ] LaTeX source also stored (for debugging):
  ```
  cv-generated-docs/{job_id}/final-cv.tex
  ```

**AC-4: Cover Letter PDF**
- [ ] Same process for cover letter
- [ ] Stored as: `final-cover-letter.pdf`

**AC-5: Quality Validation**
- [ ] Manual test: PDF matches CLI-generated PDF quality
- [ ] PDF opens in Adobe Acrobat, Preview, Chrome
- [ ] Text is selectable (not an image)
- [ ] Formatting is correct (no overflow, page breaks)

**AC-6: Error Handling**
- [ ] Retry once if compilation fails
- [ ] If still fails:
  - Store markdown and LaTeX only
  - Notify user: "PDF compilation failed, markdown available"
  - User can download LaTeX and compile locally
- [ ] Log error details for debugging

**Definition of Done:**
- [ ] Code implemented
- [ ] Unit tests (mock Render.com service)
- [ ] Integration test with real Render.com endpoint
- [ ] 10 sample CVs compiled successfully
- [ ] PDF quality approved by product owner
- [ ] Fallback mechanism tested

**Technical Notes:**
- Render.com free tier: 750 hrs/month (24/7 uptime)
- Uses same tectonic as local CLI
- Compilation time: ~30-60s (slower CPU on free tier)
- No rate limits (self-hosted)

---

### US-1.5: Notification System

**Story:**
```
As a job seeker
I want to be notified when my CV is ready
So that I know when to download it
```

**Priority:** P1 (High) - Should have for MVP

**Size:** 5 points

**Sprint:** Sprint 3

**Dependencies:**
- ✅ US-1.4 completed (PDF generation)
- ✅ Notification table exists in database

**Definition of Ready:**
- [ ] Notification schema defined
- [ ] Frontend notification UI designed
- [ ] Email service configured (optional for MVP)

**Acceptance Criteria:**

**AC-1: Notification Creation**
- [ ] Worker creates notification on task completion:
  ```json
  {
    "user_id": "...",
    "title": "CV Ready",
    "message": "Your CV for [Company Name] is ready to download",
    "type": "cv_generation_complete",
    "data": {
      "job_id": "...",
      "cv_path": "..."
    },
    "read": false
  }
  ```
- [ ] Notification created on task failure:
  ```json
  {
    "title": "CV Generation Failed",
    "message": "Failed to generate CV: [error]",
    "type": "cv_generation_failed"
  }
  ```

**AC-2: Frontend Display**
- [ ] Notification bell icon in header
- [ ] Badge shows unread count
- [ ] Clicking opens notification dropdown
- [ ] Each notification shows:
  - Title
  - Message
  - Timestamp (relative: "2 minutes ago")
  - Action button ("Download CV" or "Retry")
- [ ] Mark as read when clicked

**AC-3: Real-time Updates**
- [ ] Frontend polls notifications every 30 seconds
- [ ] New notifications appear without page refresh
- [ ] Notifications persist across page reloads

**AC-4: Email Notification (Optional)**
- [ ] Email sent to user on completion
- [ ] Email includes download link (signed URL, 24hr expiry)
- [ ] Opt-out option in user settings

**Definition of Done:**
- [ ] Code implemented
- [ ] Unit tests
- [ ] Manual testing: create task → receive notification
- [ ] Accessibility: notification dropdown keyboard-navigable
- [ ] Email tested (if implemented)

---

### US-1.6: Download Generated CV

**Story:**
```
As a job seeker
I want to download my generated CV from the kanban card
So that I can use it for my job application
```

**Priority:** P0 (Critical) - Must have for MVP

**Size:** 3 points

**Sprint:** Sprint 3

**Dependencies:**
- ✅ US-1.4 completed (PDF stored in Storage)

**Definition of Ready:**
- [ ] Supabase Storage signed URL logic documented
- [ ] Download button UI designed

**Acceptance Criteria:**

**AC-1: Download Button**
- [ ] "Download CV" button appears on kanban card when CV ready
- [ ] Button shows:
  - Icon (download icon)
  - Text: "Download CV"
  - File size (e.g., "2.3 MB")
- [ ] Clicking opens PDF in new tab
- [ ] Right-click → Save As works

**AC-2: Signed URL Generation**
- [ ] Frontend requests signed URL from Supabase Storage
- [ ] URL expires after 1 hour
- [ ] URL works without authentication (temporary public access)

**AC-3: Multiple File Download**
- [ ] Download CV button
- [ ] Download Cover Letter button
- [ ] "Download All" button (downloads .zip with both)

**AC-4: File Naming**
- [ ] Downloaded files have meaningful names:
  ```
  {CompanyName}-{Position}-CV-{Date}.pdf
  {CompanyName}-{Position}-CoverLetter-{Date}.pdf
  ```

**Definition of Done:**
- [ ] Code implemented
- [ ] Unit tests
- [ ] Manual test: download from different browsers
- [ ] Mobile test: download on iOS Safari, Android Chrome

---

## Epic 2: Enhanced Features (Phase 2)

### US-2.1: Multi-Stage Review Process

**Story:**
```
As a job seeker
I want my CV to go through optimistic and skeptical reviews
So that I get the highest quality final output matching the CLI workflow
```

**Priority:** P2 (Medium) - Nice to have

**Size:** 13 points

**Sprint:** Sprint 4

**Dependencies:**
- ✅ US-1.2 completed (basic CV generation)
- ✅ cv-optimistic-reviewer agent accessible
- ✅ cv-skeptical-reviewer agent accessible

**Definition of Ready:**
- [ ] Review prompt engineering complete
- [ ] Task chaining architecture designed
- [ ] Cost analysis approved (3x Claude API calls)

**Acceptance Criteria:**

**AC-1: Task Chaining**
- [ ] Draft CV generated (existing flow)
- [ ] Worker creates new task: `review_cv_optimistic`
- [ ] Optimistic review completes → creates task: `review_cv_skeptical`
- [ ] Skeptical review completes → creates task: `synthesize_cv_final`
- [ ] All 4 versions stored

**AC-2: Optimistic Review**
- [ ] Uses cv-optimistic-reviewer prompt
- [ ] Amplifies achievements
- [ ] Suggests stronger framing
- [ ] Output: `optimistic-{company}-{position}-cv.md`

**AC-3: Skeptical Review**
- [ ] Uses cv-skeptical-reviewer prompt
- [ ] Tempers exaggerations
- [ ] Ensures verifiability
- [ ] Output: `skeptical-{company}-{position}-cv.md`

**AC-4: Manager Synthesis**
- [ ] Uses cv-reviewer-manager prompt
- [ ] Balances optimistic + skeptical
- [ ] Target: Credibility 4-5/10, Impact 7-8/10
- [ ] Output: `final-{company}-{position}-cv.md`

**AC-5: User Experience**
- [ ] User notified at each stage
- [ ] Can preview each version as it's created
- [ ] Final notification when all versions complete
- [ ] Total time: 6-10 minutes (4 stages × 1.5-2.5 min each)

**Definition of Done:**
- [ ] Code implemented
- [ ] Unit tests for each stage
- [ ] Integration test: full 4-stage pipeline
- [ ] Quality check: 10 sample CVs reviewed by product owner
- [ ] Cost monitoring: Claude API usage tracked

---

### US-2.2: Version Comparison UI

**Story:**
```
As a job seeker
I want to compare different CV versions side-by-side
So that I can choose the best one for each application
```

**Priority:** P2 (Medium) - Nice to have

**Size:** 8 points

**Sprint:** Sprint 5

**Dependencies:**
- ✅ US-2.1 completed (multi-stage reviews)

**Acceptance Criteria:**

**AC-1: Version List**
- [ ] Job card shows all CV versions:
  - Draft
  - Optimistic
  - Skeptical
  - Final (manager synthesis)
- [ ] Each version shows:
  - Timestamp
  - File size
  - Preview button
  - Download button
- [ ] Versions sortable by date

**AC-2: Side-by-Side Comparison**
- [ ] "Compare Versions" button
- [ ] Opens modal with 2-column layout
- [ ] Select 2 versions to compare
- [ ] Markdown rendered side-by-side
- [ ] Differences highlighted

**AC-3: Version Selection**
- [ ] Mark preferred version (star icon)
- [ ] Track which version was used for actual application
- [ ] Analytics: which versions perform best (interview callbacks)

**Definition of Done:**
- [ ] Code implemented
- [ ] Unit tests
- [ ] Accessibility tested
- [ ] Mobile responsive

---

### US-2.3: Bulk Generation

**Story:**
```
As a job seeker
I want to queue CV generation for multiple jobs at once
So that I can process applications in batch
```

**Priority:** P3 (Low) - Nice to have

**Size:** 5 points

**Sprint:** Sprint 5

**Dependencies:**
- ✅ US-1.1 completed (single CV generation)

**Acceptance Criteria:**

**AC-1: Multi-Select**
- [ ] Checkbox on each kanban card
- [ ] "Select All" option
- [ ] "Generate CVs" button (bulk action)

**AC-2: Batch Task Creation**
- [ ] Clicking creates tasks for all selected jobs
- [ ] Tasks queued sequentially (avoid Claude API rate limits)
- [ ] Progress indicator: "2 of 5 complete"

**AC-3: Batch Notification**
- [ ] Single notification when all complete:
  ```
  "5 CVs are ready to download"
  ```
- [ ] List of companies in notification

**Definition of Done:**
- [ ] Code implemented
- [ ] Unit tests
- [ ] Load test: 10 jobs queued simultaneously

---

## Testing Checklist

### Functional Testing

- [ ] **US-1.1:** Trigger CV generation from kanban card
- [ ] **US-1.2:** Worker generates CV markdown correctly
- [ ] **US-1.3:** Cover letter generated alongside CV
- [ ] **US-1.4:** PDF compilation successful
- [ ] **US-1.5:** Notification received on completion
- [ ] **US-1.6:** Download CV from kanban card

### Non-Functional Testing

- [ ] **Performance:** CV generation completes in < 3 minutes
- [ ] **Reliability:** 95%+ success rate over 100 test runs
- [ ] **Security:** Signed URLs expire correctly, no data leaks
- [ ] **Accessibility:** Keyboard navigation, screen reader tested
- [ ] **Mobile:** Works on iOS Safari, Android Chrome
- [ ] **Cost:** Claude API usage within budget ($5-10/month)

### Edge Cases

- [ ] No default profile exists → error message
- [ ] Job description empty → graceful error
- [ ] Claude API rate limit → retry with backoff
- [ ] LaTeX compilation fails → fallback to markdown
- [ ] Network timeout → task retries automatically
- [ ] Multiple CVs for same job → versions tracked correctly

---

## Definition of Ready (Global)

Before starting any story:
- [ ] Acceptance criteria defined
- [ ] Dependencies met
- [ ] Technical design reviewed
- [ ] UI mockups approved (if applicable)
- [ ] Test scenarios documented
- [ ] Assigned to developer

---

## Definition of Done (Global)

Before marking story complete:
- [ ] Code implemented
- [ ] Unit tests written (≥80% coverage)
- [ ] Integration tests (if applicable)
- [ ] Manual testing on dev environment
- [ ] Code reviewed by peer
- [ ] Accessibility tested (WCAG 2.1 AA)
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner approval

---

## Related Documents

- **PRD:** [PRD.md](./PRD.md) - Product requirements
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical design
- **Implementation Plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Sprint breakdown
