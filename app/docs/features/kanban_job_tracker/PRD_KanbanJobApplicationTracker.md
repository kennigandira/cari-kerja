# Product Requirements Document: Kanban Job Application Tracker

**Version:** 1.0
**Date:** October 5, 2025
**Owner:** Product Manager
**Status:** Draft

---

## Executive Summary

The Kanban Job Application Tracker transforms the job search experience from manual file-based tracking to a visual, real-time workflow management system. This feature addresses the core pain point of managing 20+ concurrent applications while maintaining the existing filesystem structure for CVs and application documents.

**Problem:** Frontend engineers actively job searching lose visibility into application status, miss follow-ups, and spend excessive time navigating file directories to check application progress.

**Solution:** A drag-and-drop Kanban board that provides instant status visibility, workflow automation, and real-time updates across devices while preserving the existing `04_Applications/` document storage pattern.

**Impact:** Reduce status-check time from 30 seconds to <5 seconds, eliminate missed follow-ups, and enable confident management of 20+ concurrent applications without cognitive overload.

**Target Release:** MVP in 4 weeks (40-60 development hours)

---

## Context & Background

### Current State

The job search management system relies on filesystem-based organization:
- Applications stored in `04_Applications/{Company}_{Position}_{Date}/`
- Tracking via markdown logs in `05_Tracking/`
- Manual status updates require navigating directories
- No visual workflow representation
- Limited real-time collaboration or multi-device sync

### User Profile

- **Primary User:** Senior Frontend Engineer (8+ years experience)
- **Job Search Context:** Active search in Bangkok, Thailand and remote positions
- **Technical Savvy:** Comfortable with CLI, Git, and developer tools
- **Time Constraints:** Part-time search while working (10-15 hours/week)
- **Application Volume:** Managing 20-30 concurrent applications
- **Devices:** MacBook Pro primary, mobile for on-the-go checks

### Market Context

Job seekers typically use:
- Spreadsheets (Google Sheets, Excel) - manual, no workflow visualization
- Notion/Airtable - requires setup, not optimized for job search
- Dedicated tools (Huntr, Teal) - SaaS dependency, limited customization
- Email folders - poor visualization, fragmented data

**Opportunity:** Build a lightweight, self-hosted solution optimized for developer workflows with filesystem integration.

---

## Goals & Success Metrics

### Business Goals

1. **Primary:** Reduce job search management overhead by 70%
2. **Secondary:** Enable stress-free management of 25+ concurrent applications
3. **Tertiary:** Provide foundation for future job search automation

### User Goals

1. Check application status instantly without directory navigation
2. Never miss follow-up opportunities or interview deadlines
3. Visualize entire pipeline at a glance
4. Update status across devices in real-time

### Success Metrics

#### Primary KPIs
- **Status Check Time:** <5 seconds (baseline: ~30 seconds)
- **Application Throughput:** 20+ active applications managed without overwhelm
- **Missed Follow-ups:** 0 per week (baseline: ~2-3 per week)

#### Secondary KPIs
- **Mobile Usage:** 30%+ of interactions on mobile devices
- **Real-time Sync:** <2 second latency for status updates
- **Data Integrity:** 100% sync accuracy between filesystem and database

#### Leading Indicators
- Daily active usage >5 minutes
- Average 3+ status updates per application
- <10% bounce rate on mobile
- Zero data loss incidents

---

## User Stories & Personas

### Primary Persona: Active Job Seeker (Kenni)

**Demographics:**
- Frontend Engineer, 8+ years experience
- Based in Bangkok, seeking local and remote roles
- Managing job search part-time alongside current work
- Technical background, prefers efficient tools

**Behaviors:**
- Checks application status 3-5 times daily
- Applies to 3-5 positions per week
- Receives 1-2 interview requests per week
- Uses mobile during commute and between meetings

**Pain Points:**
- Loses track of which applications need follow-up
- Wastes time navigating filesystem to check status
- Misses deadlines for interview preparation
- Feels overwhelmed managing 20+ applications
- No visibility into pipeline health

**Goals:**
- Instant status visibility across all applications
- Proactive alerts for follow-ups and deadlines
- Mobile access during commute and breaks
- Confidence that nothing falls through cracks

### User Stories

#### Epic 1: Status Visibility

**US-1.1:** As a job seeker, I want to see all my applications on a Kanban board so that I can understand my pipeline at a glance.
- **Acceptance Criteria:**
  - Board displays 7 columns: Interested, Applied, Interviewing, Offer, Rejected, Accepted, Withdrawn
  - Each card shows company name, position, and application date
  - Cards sorted by most recent activity within columns
  - Board loads in <2 seconds with 50+ applications

**US-1.2:** As a job seeker, I want to filter applications by date range so that I can focus on recent activity.
- **Acceptance Criteria:**
  - Date range picker above board
  - Common presets: Last 7 days, Last 30 days, Last 90 days, All time
  - Filter applied without page reload
  - Card count displayed per column

**US-1.3:** As a job seeker, I want to search applications by company or position so that I can quickly locate specific opportunities.
- **Acceptance Criteria:**
  - Search bar with debounced input (300ms)
  - Matches company name, position title, or keywords
  - Highlight matching cards
  - Clear search button

#### Epic 2: Status Management

**US-2.1:** As a job seeker, I want to drag cards between columns so that I can update application status effortlessly.
- **Acceptance Criteria:**
  - Smooth drag-and-drop animation
  - Visual feedback during drag (shadow, outline)
  - Drop zones highlight on hover
  - Status updates persist to database
  - Optimistic UI updates (no loading state)

**US-2.2:** As a job seeker, I want status changes to sync across devices so that I can update from mobile and see changes on desktop.
- **Acceptance Criteria:**
  - Real-time updates via Supabase Realtime
  - <2 second sync latency
  - Visual indicator when other device updates status
  - Conflict resolution (last-write-wins)

**US-2.3:** As a job seeker, I want to add notes when changing status so that I can capture context about the transition.
- **Acceptance Criteria:**
  - Optional note field on status change
  - Notes displayed in application detail view
  - Timestamp and previous status captured
  - 500 character limit

#### Epic 3: Application Details

**US-3.1:** As a job seeker, I want to click a card to see application details so that I can review documents and timeline.
- **Acceptance Criteria:**
  - Modal/drawer displays full application data
  - Links to CV PDF, cover letter, job spec
  - Timeline of status changes with dates
  - Edit mode for updating metadata

**US-3.2:** As a job seeker, I want to see interview dates and deadlines on cards so that I can prepare proactively.
- **Acceptance Criteria:**
  - Badge showing upcoming interview date
  - Color coding: green (>7 days), yellow (3-7 days), red (<3 days)
  - Calendar icon with date
  - Click to add/edit interview details

**US-3.3:** As a job seeker, I want to add tags to applications so that I can categorize by technology, location, or priority.
- **Acceptance Criteria:**
  - Multi-select tag picker
  - Predefined tags: Remote, On-site, Hybrid, High Priority, TypeScript, React, Vue
  - Custom tag creation
  - Filter board by tags

#### Epic 4: Mobile Experience

**US-4.1:** As a job seeker, I want to use the Kanban board on mobile so that I can check status during commute.
- **Acceptance Criteria:**
  - Responsive layout for screens <768px
  - Touch-friendly drag-and-drop
  - Swipe gestures for column navigation
  - Readable card content without zoom

**US-4.2:** As a job seeker, I want quick actions on mobile so that I can update status efficiently.
- **Acceptance Criteria:**
  - Long-press card for context menu
  - Quick status change menu (no drag required)
  - Swipe-to-archive for rejected applications
  - Touch targets >44px minimum

#### Epic 5: Data Integrity

**US-5.1:** As a job seeker, I want the board to reflect my filesystem structure so that CVs and documents stay organized.
- **Acceptance Criteria:**
  - Database stores metadata only (status, dates, notes)
  - Filesystem stores documents (CVs, PDFs, job specs)
  - Sync script validates directory structure
  - Board displays document existence indicators

**US-5.2:** As a job seeker, I want to create new applications from the board so that I can maintain the filesystem pattern.
- **Acceptance Criteria:**
  - "Add Application" button creates directory
  - Directory naming: `{Company}_{Position}_{YYYY-MM-DD}/`
  - Placeholder files created (job-spec.md template)
  - Database record linked to directory

---

## Functional Requirements

### F-1: Kanban Board Display

**F-1.1 Column Structure**
- 7 status columns in workflow order:
  1. Interested (purple) - Saved but not applied
  2. Applied (blue) - Application submitted
  3. Interviewing (yellow) - In interview process
  4. Offer (green) - Received offer
  5. Rejected (red) - Application rejected
  6. Accepted (dark green) - Offer accepted
  7. Withdrawn (gray) - Withdrawn by candidate

**F-1.2 Card Display**
- Company name (bold, 16px)
- Position title (14px, gray)
- Application date (12px, light gray)
- Status badges (interview date, priority)
- Document indicators (CV, cover letter, job spec)
- Tag chips (max 3 visible, "+2" overflow)

**F-1.3 Board Layout**
- Horizontal scroll on desktop for 7 columns
- Fixed column headers with card count
- Infinite scroll within columns (load 20 cards initially)
- Empty state per column with "Add Application" CTA

### F-2: Drag-and-Drop Interaction

**F-2.1 Desktop Drag-and-Drop**
- Mouse down on card initiates drag
- Card follows cursor with 0.9 opacity
- Drop zones highlight with dashed border
- Drop triggers status update API call
- Optimistic UI: card moves immediately, rollback on error

**F-2.2 Mobile Touch Drag**
- Long-press (500ms) initiates drag
- Visual feedback: card scales 1.05x, shadow increases
- Haptic feedback on drag start (if supported)
- Auto-scroll columns when dragging near edge
- Drop zones enlarge for easier targeting (50px height)

**F-2.3 Alternative Mobile Interaction**
- Tap card for quick actions menu
- Menu options: Move to [Status], View Details, Edit, Archive
- Swipe right on card: Move to next status
- Swipe left on card: Move to previous status

### F-3: Real-time Synchronization

**F-3.1 Supabase Realtime Integration**
- Subscribe to `kanban_cards` table changes
- Listen for INSERT, UPDATE, DELETE events
- Update local state on remote changes
- Show toast notification: "Application updated on another device"

**F-3.2 Conflict Resolution**
- Last-write-wins strategy (Supabase default)
- Timestamp-based versioning (`updated_at` column)
- Optimistic updates with rollback on conflict
- No manual merge required (status changes are atomic)

**F-3.3 Offline Handling**
- Queue status changes while offline
- Visual indicator: "Offline - changes will sync"
- Sync queue on reconnection
- Conflict detection on sync (warn user if data changed)

---

## Non-Functional Requirements

### Performance

**NFR-1: Page Load Time**
- Initial board load <2 seconds (50 applications)
- Time to Interactive <3 seconds
- Lighthouse Performance score >90

**NFR-2: Drag-and-Drop Responsiveness**
- Drag start latency <50ms
- Frame rate 60fps during drag
- Drop animation completes in <300ms
- API call completes in <500ms

**NFR-3: Real-time Sync Latency**
- Supabase Realtime update <2 seconds
- Optimistic UI update <100ms
- Conflict resolution <1 second

### Scalability

**NFR-4: Data Volume**
- Support 500+ applications without performance degradation
- Pagination: Load 20 cards per column initially
- Infinite scroll loads 20 more on scroll
- Search and filter operations <200ms

**NFR-5: Concurrent Users**
- Support 1 user (solo developer) with 5+ devices
- Supabase Realtime handles 50+ concurrent connections
- Database connection pooling for Cloudflare Workers

### Reliability

**NFR-6: Data Integrity**
- Zero data loss on status updates
- 100% sync accuracy between filesystem and database
- Automatic rollback on failed API calls
- Database backups daily (Supabase automatic)

**NFR-7: Uptime**
- 99.9% uptime target (Supabase and Cloudflare SLA)
- Graceful degradation if Supabase unreachable
- Offline mode queues changes for sync

### Security

**NFR-8: Authentication**
- Supabase Auth with email/password
- Row-level security (RLS) policies
- User can only access own applications
- Session timeout after 7 days

**NFR-9: Data Privacy**
- No third-party analytics (privacy-first)
- Data stored in Supabase (EU or US region)
- No PII in error logs
- Filesystem documents remain local-only

### Usability

**NFR-10: Mobile Experience**
- Touch targets minimum 44x44px
- Readable text without zoom (16px minimum)
- Works on iOS Safari and Chrome
- Tested on iPhone 12 Mini and iPhone 15 Pro Max

**NFR-11: Accessibility**
- WCAG 2.1 AA compliance
- Keyboard navigation for all actions
- Screen reader support (ARIA labels)
- Color contrast ratio >4.5:1

---

## Implementation Phases

### Phase 1: MVP - Core Kanban (Week 1-2, 20-30 hours)

**Deliverables:**
- Kanban board with 7 columns
- Application cards with basic info (company, position, date)
- Drag-and-drop status updates (desktop only)
- Supabase schema and RLS policies
- Fetch applications from database
- Optimistic UI updates
- Basic styling with Tailwind

**Success Criteria:**
- User can view 20+ applications on board
- User can drag cards between columns
- Status updates persist to database
- Page loads in <3 seconds

### Phase 2: Real-time & Detail View (Week 3, 10-15 hours)

**Deliverables:**
- Supabase Realtime integration
- Multi-device sync (<2 second latency)
- Application detail modal/drawer
- Timeline view of status changes
- Interview date picker
- Tag management

### Phase 3: Mobile & Filters (Week 4, 10-15 hours)

**Deliverables:**
- Mobile-responsive layout
- Touch-friendly drag-and-drop
- Search functionality
- Date range filter
- Tag filter
- Swipe gestures (mobile)

### Phase 4: Polish & Filesystem Sync (Post-MVP, 10-15 hours)

**Deliverables:**
- "Add Application" flow with directory creation
- Filesystem sync script
- Import existing applications
- Empty states and loading skeletons
- Error handling and rollback
- Documentation (README, user guide)

---

## Dependencies & Risks

### External Dependencies

**DEP-1: Supabase**
- **Risk:** Supabase downtime or API changes
- **Mitigation:** Supabase has 99.9% SLA; monitor status page; implement fallback offline mode
- **Impact:** High (critical for data persistence)

**DEP-2: Browser APIs (Drag and Drop, Touch Events)**
- **Risk:** Browser compatibility, mobile performance
- **Mitigation:** Test on target browsers (Chrome, Safari, Firefox); use polyfills if needed
- **Impact:** Medium (UX degradation on unsupported browsers)

### Technical Risks

**RISK-1: Drag-and-Drop Performance on Mobile**
- **Description:** Touch drag may feel laggy on older devices
- **Likelihood:** Medium
- **Impact:** High (poor mobile UX)
- **Mitigation:** Use CSS transforms for 60fps animation; debounce touch events; fall back to quick actions menu

**RISK-2: Filesystem Sync Complexity**
- **Description:** Bidirectional sync (DB ↔ filesystem) may introduce data conflicts
- **Likelihood:** Medium
- **Impact:** High (data integrity issues)
- **Mitigation:** Use unidirectional sync (filesystem is source of truth for documents); database stores metadata only

**RISK-3: Real-time Sync Latency**
- **Description:** Supabase Realtime may exceed 2-second target
- **Likelihood:** Low
- **Impact:** Medium (degraded multi-device UX)
- **Mitigation:** Optimize queries; use indexed columns; implement optimistic UI

---

## Out of Scope

The following features are explicitly **NOT** included in the MVP:

**OS-1: Advanced Analytics**
- Application success rate tracking
- Interview conversion funnels
- Time-to-hire metrics

**OS-2: Email Integration**
- Auto-import applications from email
- Send follow-up reminders

**OS-3: Calendar Integration**
- Sync interview dates to Google Calendar
- Calendar view of upcoming interviews

**OS-4: Collaboration Features**
- Share board with career coach/mentor
- Commenting on applications

**OS-5: AI-Powered Features**
- Auto-tagging based on job description
- Application success prediction

---

## Open Questions

**Q1: Directory Creation Mechanism**
- **Question:** Should directory creation happen client-side or server-side?
- **Recommendation:** Start with manual (Option C) for MVP; explore server-side post-MVP

**Q2: Offline Mode Strategy**
- **Question:** How should the app behave when offline?
- **Recommendation:** Queue updates locally, sync on reconnect (Option B)

**Q3: Mobile vs Desktop Priority**
- **Question:** Should mobile or desktop be the primary experience?
- **Recommendation:** Optimize for desktop first, ensure mobile is functional

**Q4: Notification System**
- **Question:** Should the app send notifications for upcoming interviews?
- **Recommendation:** In-app badges (Option C) for MVP; explore push notifications post-MVP

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-05 | Product Manager | Initial draft |

**Next Steps:**
1. Review PRD with stakeholders (user feedback)
2. Validate technical feasibility with engineering
3. Finalize MVP scope and timeline
4. Begin Phase 1 implementation
