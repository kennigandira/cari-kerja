# Feature Specification: CV & Cover Letter Background Generator

**Feature Branch**: `003-cv-generator-background`
**Created**: 2025-10-08
**Status**: Draft (New Feature)
**Input**: User description: "CV Generator - Background processing system for automated CV and cover letter generation using AI with LaTeX PDF compilation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Queue CV Generation Without Waiting (Priority: P1)

A job seeker browsing job boards on their phone or laptop needs to quickly queue CV generation for a job posting so they can continue browsing other opportunities without waiting 15-30 minutes for generation to complete.

**Why this priority**: Core value proposition removing availability constraint. Enables async workflow where users can queue multiple applications and walk away. Critical for increasing application velocity from 10-15/month to 20+/month.

**Independent Test**: User clicks "Generate CV" on a kanban job card, task is queued successfully, user can immediately close browser/app, and generation completes in background delivering documents when finished.

**Acceptance Scenarios**:

1. **Given** a user views a job card with complete job description, **When** they click "Generate CV" button, **Then** a background task is queued within 2 seconds, button changes to "Generating..." state, and user can navigate away or close browser
2. **Given** a user has no default profile set, **When** they click "Generate CV", **Then** a clear error message prompts them to create or set a default profile before generation can proceed
3. **Given** a user clicks "Generate CV" while a previous generation for the same job is still processing, **When** the system detects the conflict, **Then** the button is disabled with tooltip "Generation in progress" preventing duplicate tasks

---

### User Story 2 - Monitor Generation Progress in Real-Time (Priority: P1)

A job seeker who queued CV generation needs to track progress and know when documents are ready without constantly refreshing the page or checking notifications.

**Why this priority**: Provides transparency into async process. Users need confidence that generation is progressing. Real-time updates reduce anxiety and enable timely action when complete.

**Independent Test**: User returns to kanban board after queuing generation, sees live status updates progressing through stages (Pending → Analyzing Job → Generating CV → Compiling PDF → Complete), without manual page refresh.

**Acceptance Scenarios**:

1. **Given** a user has queued CV generation, **When** they view the kanban board, **Then** the job card displays real-time status badge showing current generation stage updating automatically every 5 seconds
2. **Given** generation reaches each milestone (job analyzed, CV generated, PDF compiled), **When** status changes, **Then** UI updates immediately via real-time subscription showing new stage with appropriate icon/color
3. **Given** generation fails at any stage with error, **When** failure occurs, **Then** card shows "Failed" status with user-friendly error message and "Retry" button to requeue task

---

### User Story 3 - Download Completed Documents (Priority: P1)

A job seeker needs to access generated CV and cover letter PDFs immediately after completion to review quality and submit application while job posting is fresh.

**Why this priority**: Final step in generation workflow. Without easy download, all previous work provides no value. Must support both initial and reviewed document versions.

**Independent Test**: User clicks "Download CV" or "Download Cover Letter" buttons on completed job card, PDF files download within 1 second, opening correctly in PDF viewer with proper formatting.

**Acceptance Scenarios**:

1. **Given** CV and cover letter generation completed successfully, **When** user clicks download buttons, **Then** both initial and reviewed PDF versions download with clear filenames (CompanyName-Position-CV-Initial.pdf, CompanyName-Position-CV-Reviewed.pdf)
2. **Given** user downloads a CV PDF, **When** they open it, **Then** document renders with correct LaTeX formatting, all sections visible, no compilation errors, matching job requirements accurately
3. **Given** generation completed but PDFs failed to compile, **When** user attempts download, **Then** markdown versions are available as fallback with clear message explaining PDF compilation issue and offering markdown export

---

### User Story 4 - Receive Completion Notifications (Priority: P2)

A job seeker who queued 3-5 applications before bed or while working needs to know when documents are ready without constantly checking the kanban board.

**Why this priority**: Enables true "fire and forget" workflow. Users can queue applications and be notified hours later when complete. Critical for offline generation use case (30% target).

**Independent Test**: User queues CV generation, closes browser, walks away for 30 minutes, returns to see browser notification or in-app toast showing "CV for [CompanyName] is ready!" with click-through to view job card.

**Acceptance Scenarios**:

1. **Given** user queued CV generation and closed browser, **When** generation completes, **Then** browser sends desktop notification (if permissions granted) showing job title and completion status with click to open job card
2. **Given** user is actively using application when generation completes, **When** completion event fires, **Then** in-app toast notification appears for 5 seconds with success message and action buttons to view/download
3. **Given** multiple generations queued, **When** each completes, **Then** notifications batch together if within 1 minute showing "3 CVs ready for download" with list of job titles

---

### User Story 5 - Request Document Regeneration with Feedback (Priority: P3)

A job seeker reviewing generated CV notices inaccuracies or wants to emphasize different skills, needing to regenerate documents with specific instructions without starting entirely from scratch.

**Why this priority**: Iterative refinement improves document quality. AI-generated content needs human review and feedback loop. Enables continuous improvement matching user preferences.

**Independent Test**: User views generated CV, clicks "Regenerate" button, enters feedback "Emphasize React experience, remove outdated Angular skills", new generation task queues, updated CV incorporates feedback successfully.

**Acceptance Scenarios**:

1. **Given** user views completed CV, **When** they click "Regenerate with Feedback" and provide instructions, **Then** new task queues preserving original job context, feedback is passed to AI prompt, regeneration completes producing updated documents
2. **Given** user provides regeneration feedback, **When** AI processes request, **Then** feedback is stored in regeneration_requests table for audit trail, versioning tracks which iteration (v1, v2, v3), original documents remain accessible
3. **Given** regeneration fails due to unclear feedback or AI limitations, **When** error occurs, **Then** user receives specific guidance on improving feedback clarity with examples of effective prompts

---

### Edge Cases

- **What happens when Claude API rate limits are exceeded during high-volume generation?** System implements exponential backoff retry strategy (3 attempts), queues task for later retry with increased delay, user sees "Rate limited - retrying in X minutes" status, ensures eventual completion.

- **How does system handle PDF compilation failures for complex LaTeX?** Falls back to markdown export automatically, stores compilation error log for debugging, notifies user that PDF unavailable with markdown alternative, allows manual PDF retry after template fixes.

- **What if generation takes longer than expected (>10 minutes)?** UI shows elapsed time and "Still processing..." message after 5 minutes, timeout set at 15 minutes before marking failed with retry option, error logs capture bottleneck stage for optimization.

- **How does system prevent duplicate CV generations for same job?** Database unique constraint on (job_id, task_type, status='processing'), attempts to queue duplicate return existing task_id, UI polls existing task status instead of creating new one.

- **What happens when user has 100+ pending tasks queued?** System processes maximum 5 concurrent tasks per user, remaining tasks wait in queue with estimated start time displayed, prevents resource exhaustion while maintaining fairness.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to queue CV and cover letter generation from job card detail view by clicking "Generate Documents" button
- **FR-002**: System MUST create background task in processing queue with payload containing job_id, profile_id, generation preferences, and timestamp
- **FR-003**: System MUST prevent duplicate generation tasks for the same job while existing task is in pending or processing status
- **FR-004**: System MUST execute generation tasks via Cloudflare Workers cron job running at 30-second intervals
- **FR-005**: System MUST fetch job description and master profile data required for AI-powered CV tailoring
- **FR-006**: System MUST call AI service to generate tailored CV markdown matching job requirements and profile data
- **FR-007**: System MUST call AI service to generate cover letter markdown (max 350 words) with personalized content
- **FR-008**: System MUST compile markdown documents to PDF format using LaTeX processing service
- **FR-009**: System MUST store generated PDF documents in persistent storage with public access URLs
- **FR-010**: System MUST update task status through stages: Pending → Processing → Completed/Failed with timestamps
- **FR-011**: System MUST provide real-time status updates to UI via subscription mechanism without requiring page refresh
- **FR-012**: System MUST display generation status badge on job card showing current stage (Pending, Analyzing, Generating, Compiling, Complete, Failed)
- **FR-013**: System MUST provide download buttons for completed PDFs with descriptive filenames including company name and position
- **FR-014**: System MUST send completion notifications to user via in-app toast when user is active
- **FR-015**: System MUST send browser desktop notifications when user is away and generation completes (with permission)
- **FR-016**: System MUST implement retry logic with exponential backoff for transient failures (network errors, rate limits)
- **FR-017**: System MUST limit concurrent generations to 5 tasks per user to prevent resource exhaustion
- **FR-018**: System MUST store regeneration feedback in dedicated table linking to original task for version tracking
- **FR-019**: System MUST support document regeneration with user feedback appended to AI generation prompts
- **FR-020**: System MUST provide fallback to markdown export when PDF compilation fails with clear error messaging

### Key Entities

- **Generation Task**: Represents asynchronous CV/cover letter generation job including task_id, job reference, profile reference, task type (generate_cv, regenerate_cv), status (pending, processing, completed, failed), payload (generation parameters), created/started/completed timestamps, error message if failed, and retry count.

- **Document Version**: Represents generated document artifacts including version type (initial, reviewed, regenerated), document type (CV, cover letter), format (markdown, PDF), storage URL, generation timestamp, AI model used, and parent task reference. Enables version history and comparison.

- **Regeneration Request**: Represents user feedback for document refinement including request_id, original task reference, user feedback text, new task reference, request timestamp, and completion status. Links feedback to specific versions for audit trail.

- **Notification Event**: Represents completion notifications including event type (generation_complete, generation_failed), job reference, delivery method (in_app, desktop_push), delivery status, timestamp, and user acknowledgment flag.

- **Processing Log**: Represents detailed execution trace including log entries for each generation stage, timestamps, duration metrics, AI token usage, error details, and performance data. Enables debugging and optimization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can queue CV generation in under 3 seconds from job card click to task confirmation
- **SC-002**: Background generation completes end-to-end within 10 minutes for 95% of tasks (job analysis + CV generation + cover letter + PDF compilation)
- **SC-003**: Generation success rate exceeds 95% over 20 consecutive production runs
- **SC-004**: 30% or more of CV generations occur while user is offline or browser closed
- **SC-005**: Real-time status updates reflect on UI within 5 seconds of backend state change
- **SC-006**: Generated PDF quality matches current CLI output with zero formatting errors
- **SC-007**: Document download completes within 1 second of button click for 99% of requests
- **SC-008**: Completion notifications deliver within 10 seconds of task completion for active users
- **SC-009**: System handles 5 concurrent generations per user without performance degradation
- **SC-010**: Retry logic successfully recovers from 90% of transient failures without user intervention
- **SC-011**: Application velocity increases to 20+ applications per month from baseline 10-15/month
- **SC-012**: Time saved per week measures 2+ hours compared to manual CLI workflow

## Assumptions

1. **Infrastructure Readiness**: Cloudflare Workers environment supports scheduled cron jobs at 30-second intervals; Supabase Storage configured for PDF storage with public access policies
2. **AI Service Availability**: Anthropic Claude API maintains 99% uptime; rate limits accommodate expected generation volume (estimated 50-100 requests/month)
3. **PDF Compilation Service**: LaTeX-to-PDF service (Render.com/tectonic) operates reliably with <60 second compilation time; handles standard CV templates without errors
4. **Processing Queue**: Existing processing_queue infrastructure supports new task types; RLS policies allow worker service role to claim and update tasks
5. **User Behavior**: Users queue 1-5 applications per session; peak concurrent generations stay under 10 across all users
6. **Network Reliability**: Users have stable internet for initial queue action; background workers have reliable cloud connectivity
7. **Storage Limits**: Supabase Storage free tier accommodates PDF volume (estimated 50MB/month); documents retained for 90 days before archival
8. **Browser Support**: Modern browsers support desktop notifications API; users grant notification permissions for offline alerts
9. **Real-time Infrastructure**: Supabase Realtime channels support status update frequency without throttling; WebSocket connections remain stable
10. **Quality Threshold**: Generated documents meet minimum quality bar without extensive manual editing; <10% regeneration rate indicating acceptable first-pass quality

## Dependencies

1. **Master Profile Feature**: Must be deployed and operational; default profile selection mechanism functional; profile data API accessible to workers
2. **Job Kanban Board**: Job card detail view provides UI integration points; job description data stored and retrievable via API
3. **Processing Queue Infrastructure**: Database tables (processing_queue_tasks) exist with proper schema; worker service has permissions to read/write tasks
4. **Cloudflare Workers**: Account configured; cron triggers enabled; environment secrets set (ANTHROPIC_API_KEY, SUPABASE_SERVICE_KEY)
5. **Supabase Storage**: Bucket created for application documents; RLS policies configured; public access URLs functional
6. **LaTeX Service**: PDF compilation endpoint deployed and accessible; supports required LaTeX packages; returns compiled PDFs or error details

## Out of Scope

- **Multi-stage Review Workflows**: Optimistic → Skeptical → Manager review pipeline deferred to Phase 2
- **Bulk Generation**: Cannot queue >5 applications simultaneously; batch operations deferred to future enhancement
- **Version Comparison UI**: Side-by-side comparison of document versions not included in MVP
- **Custom Templates**: Users cannot upload custom LaTeX templates; uses standard template only
- **Scheduled Generation**: Cannot schedule CV generation for future time (e.g., "Generate at 2am"); immediate queue only
- **Priority Queuing**: All tasks processed first-come-first-served; no VIP/priority lanes
- **Generation Analytics**: Dashboard showing generation success rates, average time, cost per generation not included
- **Collaborative Feedback**: Multiple users cannot provide feedback on same CV; single-user workflow only
- **Mobile App**: Native iOS/Android apps not included; mobile workflow via responsive web only
- **Offline Mode**: Cannot queue tasks without internet; requires connectivity for task creation
