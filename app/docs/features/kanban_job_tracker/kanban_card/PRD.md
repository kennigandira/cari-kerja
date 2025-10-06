# Product Requirements Document: Enhanced Kanban Card Detail View

**Version:** 1.0
**Date:** October 6, 2025
**Feature Owner:** Product Manager & Product Owner
**Status:** Approved
**Parent Feature:** Kanban Job Application Tracker
**Priority:** P1 (High)

---

## Executive Summary

The Enhanced Kanban Card Detail View transforms job application cards from simple status indicators to comprehensive, contextual workspaces that guide users through each stage of the application process. This feature addresses the gap between "what status am I in" and "what should I do next" by providing status-specific fields, AI-powered insights, and structured learning through retrospectives.

### Problem
Current kanban cards show minimal information (company, position, match %), requiring users to:
- Navigate away to see full job descriptions
- Remember which interview phase they're in
- Research salary competitiveness manually
- Lose learnings from rejected applications

### Solution
Clickable cards that open detailed modals with:
- **Full job information** (description, match analysis, application method)
- **Status-specific fields** that appear based on current stage
- **AI-powered insights** (interview prep suggestions, salary analysis)
- **Learning system** (retrospectives on rejections to improve future applications)

### Impact
- **Reduce decision time** from 2-3 minutes to <30 seconds per application check
- **Increase interview success** through AI-generated prep suggestions
- **Improve offer decisions** via automated salary competitiveness analysis
- **Accelerate learning** by capturing retrospectives on all "Not Now" applications

### Target Release
- **MVP (Phase 1):** Week of Oct 7-13 (Detail modal + status fields)
- **Phase 2:** Week of Oct 14-20 (AI insights)
- **Phase 3:** Week of Oct 21-27 (Comments system)

---

## PM Strategic Evaluation

### Strategic Fit: **9/10**
This feature elevates the product from a "tracking tool" to a "job search operating system." It directly addresses user pain points identified during active job search.

### User Need
**Current State Issues:**
- Cards show only surface-level info
- No guidance on "what to do next" for each status
- Interview prep is manual and inconsistent
- Salary negotiations lack market data
- No learning loop from rejections

**Target Users:**
- Primary: Self (active job seeker, frontend engineer, Bangkok/remote)
- Potential: Other job seekers if productized

**Pain Level:** 8/10 - Blocking effective workflow management

### Business Value: **HIGH**
- **Personal Value:** Transforms tracking tool into complete job search platform
- **Product-Market Fit:** Foundation for potential SaaS if this works well
- **Competitive Edge:** AI-powered insights + retrospective learning system is unique

### Market Context
**Competitors:**
- Trello/Notion: Generic, no job-specific features
- Huntr.co: Has tracking but limited AI insights
- Teal.so: Strong tracking, missing retrospective learning

**Opportunity:** AI-powered interview prep + offer analysis + learning from rejections

### Success Metrics
- **Primary:** 80% of cards have status-specific fields filled within 1 month
- **Secondary:** Time per card interaction decreases by 60%
- **Tertiary:** At least 5 retrospectives captured for continuous improvement

### PM Decision: ✅ **BUILD IT - P1 Priority**
**Rationale:** Core to product vision, high personal value, differentiating features

---

## PO Technical Assessment

### Feasibility: **MODERATE**
**Existing Infrastructure:**
- ✅ Job detail view exists (JobDetailView.vue)
- ✅ Database supports JSONB for flexibility
- ✅ Match analysis data available
- ❌ No comment system (defer to Phase 3)
- ❌ No AI prompt infrastructure for insights

**Stack Compatibility:**
- Frontend: Vue 3 + TypeScript ✅
- Backend: Supabase (Postgres) ✅
- AI: Claude API (already integrated) ✅
- Rich Text: Tiptap for comments (Phase 3) ⏳

### Technical Blockers & Solutions
1. **AI Integration:** Use existing Claude API pattern from calculate-match.ts
2. **Salary Data:** Use AI web search agent with citations (no external API needed)
3. **Database Changes:** Migration 014 with 10 new fields

### Effort Estimate: **21 Story Points (~3 sprints)**

**Breakdown:**
- Database schema + migration: 3 SP
- Modal/detail view refactor: 3 SP
- Status-specific fields (6 statuses): 5 SP
- AI integration (interview prep + salary): 3 SP
- Backend RPC + workers: 2 SP
- Comment system (Phase 3): 5 SP

### Risk Assessment: **MEDIUM**
- AI quality depends on prompt engineering
- Comment system complexity (deferred)
- Mobile UX for modal interactions

### PO Decision: ✅ **APPROVED - Phased Approach**
**Recommended:** Ship MVP (modal + fields) → Add AI → Add comments

---

## Joint PM-PO Decision

### ✅ APPROVED - Phased Implementation

**Scope:**
- **Phase 1 (MVP):** Detail modal + status-specific fields (no AI, no comments)
- **Phase 2:** AI insights (interview prep + offer analysis)
- **Phase 3:** Comment system with rich text

**Timeline:**
- Sprint 1 (Oct 7-13): MVP delivery
- Sprint 2 (Oct 14-20): AI integration
- Sprint 3 (Oct 21-27): Comments

**Trade-offs Agreed:**
1. Comments start as plain text + markdown (not WYSIWYG initially)
2. AI insights use Claude Haiku for cost efficiency
3. Salary comparison is AI-based (no external API dependency)

---

## User Stories & Acceptance Criteria

### Epic 1: Clickable Card Detail View

#### US-1.1: View Complete Job Information
**As a** job seeker
**I want to** click a kanban card to see full job details
**So that** I can make informed decisions without leaving the kanban board

**Acceptance Criteria:**
- ✅ Card is clickable (visual affordance: cursor pointer, hover effect)
- ✅ Opens modal/drawer with job details
- ✅ Modal displays:
  - Job post URL (clickable)
  - Posted date
  - Company name + position title
  - Location (specific or "Remote")
  - Current status with status switcher dropdown
  - Full job description (formatted text)
  - Match percentage + detailed analysis (strengths/gaps/partials as bullets)
- ✅ Modal is keyboard accessible (ESC to close)
- ✅ Mobile responsive (full-screen on mobile)

#### US-1.2: Edit Job Information
**As a** job seeker
**I want to** edit job details directly from the card modal
**So that** I can keep information up-to-date without switching views

**Acceptance Criteria:**
- ✅ Edit button toggles edit mode
- ✅ Editable fields: company name, position, location, job description, status
- ✅ Save button commits changes to database
- ✅ Cancel button reverts unsaved changes
- ✅ Optimistic UI updates (instant feedback)

#### US-1.3: Delete Job Application
**As a** job seeker
**I want to** delete job applications from the detail view
**So that** I can remove duplicates or irrelevant applications

**Acceptance Criteria:**
- ✅ Delete button with confirmation dialog
- ✅ Confirmation shows company + position for safety
- ✅ Deletes job + all related documents from database
- ✅ Closes modal and removes card from board
- ✅ Shows success toast notification

### Epic 2: Enhanced Match Analysis Display

#### US-2.1: Visual Match Breakdown
**As a** job seeker
**I want to** see why I match (or don't match) a job
**So that** I can understand my fit and prepare accordingly

**Acceptance Criteria:**
- ✅ Match analysis section in modal
- ✅ Three categorized lists:
  - **Strengths** (✓ green checkmark icon): Skills/experience that exceed requirements
  - **Partial Matches** (⚠ yellow warning icon): Skills that partially meet requirements
  - **Gaps** (✗ red cross icon): Missing skills/requirements
- ✅ Each item is a concise bullet point
- ✅ Visual hierarchy: Strengths → Partials → Gaps
- ✅ Collapsible sections on mobile

### Epic 3: Status-Specific Fields

#### US-3.1: To Submit Status Fields
**As a** job seeker in "To Submit" status
**I want to** see application readiness and have a quick apply button
**So that** I can submit when CV/CL are ready

**Acceptance Criteria:**
- ✅ Status field shows "To Submit"
- ✅ "Apply!" CTA button (primary color, prominent)
  - Opens job post URL in new tab
  - Logs click timestamp
- ✅ CV Readiness indicator:
  - ✅ Green badge if CV completed
  - ⏳ Yellow badge if CV processing
  - ❌ Red badge if no CV
- ✅ Cover Letter Readiness indicator (same logic as CV)

#### US-3.2: Waiting for Call Status Fields
**As a** job seeker in "Waiting for Call" status
**I want to** see submission timestamp and interview prep suggestions
**So that** I can prepare while waiting for response

**Acceptance Criteria:**
- ✅ "Submitted X days ago" timestamp display
- ✅ "Get Interview Prep ✨" button triggers AI generation
- ✅ AI suggestions displayed as checklist:
  - Topic/area to prepare (e.g., "React Server Components deep dive")
  - Checkbox to track completion
  - Collapsible details (optional)
- ✅ Suggestions stored in database (interview_prep_suggestions JSONB)

#### US-3.3: Interviewing Status Fields
**As a** job seeker in "Interviewing" status
**I want to** track interview phases and current progress
**So that** I know where I am in the process

**Acceptance Criteria:**
- ✅ Total interview phases input (number, 1-10)
- ✅ Current phase tracker (visual progress: "2/3" with progress bar)
- ✅ Phase labels (optional): "Phone Screen" → "Technical" → "Final"
- ✅ Next interview date picker (optional)

#### US-3.4: Offer Status Fields
**As a** job seeker in "Offer" status
**I want to** record offer details and get competitiveness analysis
**So that** I can make informed decisions

**Acceptance Criteria:**
- ✅ Salary offer input (number + currency dropdown: THB, USD, EUR, GBP, SGD, AUD)
- ✅ Benefits textarea (free-form: "Health insurance, stock options, remote")
- ✅ "Analyze Offer ✨" button triggers AI analysis
- ✅ AI analysis displays:
  - Competitiveness rating (Above/Average/Below market)
  - Market comparison (e.g., "+15% above average for Bangkok")
  - Cited sources (clickable links)
  - Recommendation text
- ✅ Two CTA buttons:
  - "Accept Offer" (green) → moves to "Accepted" status
  - "Decline" (gray) → moves to "Not Now" status

#### US-3.5: Not Now Status Fields (Retrospective)
**As a** job seeker in "Not Now" status
**I want to** document why I declined and what to improve
**So that** I learn from each application cycle

**Acceptance Criteria:**
- ✅ "Why Not Now?" dropdown:
  - Salary too low
  - Culture misfit
  - Better offer received
  - Role not aligned
  - Other (specify)
- ✅ "What to Improve" textarea:
  - Skills to develop
  - Interview areas to strengthen
  - Application strategy adjustments
- ✅ Retrospective data stored in database (retrospective_reason, retrospective_learnings)
- ✅ Future feature: Retrospective analytics dashboard (not in MVP)

#### US-3.6: Accepted Status UI
**As a** job seeker in "Accepted" status
**I want to** see a congratulations message
**So that** I feel accomplished and can close the loop

**Acceptance Criteria:**
- ✅ Celebratory UI (confetti animation optional)
- ✅ Message: "Congratulations on your new role at {Company}! 🎉"
- ✅ Sub-message: "See you next job search! Your retrospectives are saved for future reference."
- ✅ "Archive Application" button (soft delete, keeps data)

### Epic 4: AI-Powered Insights

#### US-4.1: Interview Preparation Suggestions
**As a** job seeker
**I want** AI-generated interview prep topics
**So that** I focus my preparation on relevant areas

**Acceptance Criteria:**
- ✅ Triggered manually via "Get Prep Suggestions" button
- ✅ AI analyzes job description + candidate profile
- ✅ Generates 5-7 specific topics (not generic advice)
- ✅ Topics stored as checklist (JSONB array)
- ✅ User can check off completed topics
- ✅ Loading state during generation (~10-15 seconds)

#### US-4.2: Salary Offer Analysis
**As a** job seeker with an offer
**I want** AI-powered salary competitiveness check
**So that** I negotiate from an informed position

**Acceptance Criteria:**
- ✅ Triggered via "Analyze Offer" button
- ✅ AI searches web for market data (2025 salary trends)
- ✅ Returns:
  - Competitiveness rating (above/average/below)
  - Percentage comparison to market average
  - 2-3 cited sources with URLs
  - Brief recommendation (1-2 sentences)
- ✅ Analysis stored as JSONB
- ✅ Sources are clickable links

### Epic 5: Comment System (Phase 3 - Deferred)

#### US-5.1: Add Comments to Applications
**As a** job seeker
**I want to** add formatted comments to applications
**So that** I track thoughts, questions, and updates

**Acceptance Criteria:**
- ⏳ Rich text editor (bold, italic, color)
- ⏳ Comment thread (chronological, newest first)
- ⏳ Edit/delete own comments
- ⏳ Comments stored in separate table (job_comments)
- ⏳ Timestamps + user attribution
- ⏳ **Coming Soon badge shown in MVP**

---

## Success Metrics & KPIs

### Primary KPIs
- **Field Completion Rate:** 80% of cards have status-specific fields filled
- **Time Savings:** Average time per card interaction reduced by 60%
- **AI Utilization:** 50%+ of "Waiting for Call" cards use interview prep
- **Offer Analysis:** 100% of "Offer" status cards use salary analysis

### Secondary KPIs
- **Retrospective Capture:** At least 5 retrospectives documented in first month
- **Mobile Usage:** 40%+ of detail modal opens on mobile
- **Edit Actions:** Average 2+ edits per card (shows active usage)

### Leading Indicators
- Daily modal opens >10 times
- AI insight generation success rate >95%
- Zero data loss incidents
- <500ms modal load time

---

## Out of Scope (Future Considerations)

### Explicitly Not Included in v1.0
1. **Multi-user collaboration** - Single user only
2. **Real-time comments** - No WebSocket, just CRUD
3. **Document attachments** - CV/CL handled separately
4. **Salary negotiation templates** - Just analysis, no templates
5. **Interview scheduling integration** - Manual date entry only
6. **Custom status fields** - Fixed 6 status types for now
7. **Bulk operations on cards** - One at a time only
8. **Export to PDF** - View only, no export

### Future Enhancements (Backlog)
- Retrospective analytics dashboard
- Interview performance tracking over time
- Offer comparison across multiple jobs
- Custom status workflows
- Email integration for auto-updates

---

## Dependencies & Constraints

### Technical Dependencies
- Existing job detail view (JobDetailView.vue)
- Claude API integration (already available)
- Supabase database with JSONB support
- Vue Router for modal routing

### Constraints
- **Single user system** - No need for real-time sync
- **AI cost** - Use Claude Haiku for cost efficiency
- **Mobile UX** - Modal must work on small screens
- **Data migration** - Must handle existing jobs gracefully

### Assumptions
- User has active Claude API key in workers
- Browser supports modern JS (ES2020+)
- User primarily uses Chrome/Safari
- Internet connection available for AI features

---

## Appendix

### A. Related Documents
- Parent: `/app/docs/features/kanban_job_tracker/PRD_KanbanJobApplicationTracker.md`
- Database: `./DatabaseSchema.md`
- API: `./APISpecification.md`
- Components: `./FrontendComponents.md`
- Implementation: `./ImplementationPlan.md`

### B. Glossary
- **Status-specific fields:** UI fields that only appear in certain kanban statuses
- **Retrospective:** Structured reflection on why an application was declined
- **Match analysis:** AI breakdown of candidate fit (strengths/gaps/partials)
- **Offer analysis:** AI-powered salary competitiveness check

### C. Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | PM & PO | Initial PRD with PM/PO evaluation |
