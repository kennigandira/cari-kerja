# User Stories - Master Profile Feature
**Version:** 2.0 (Revised after Technical Review)
**Date:** October 5, 2025
**Status:** Ready for Sprint Planning

---

## Definition of Ready (DoR)

A user story is ready for sprint when:
- [ ] Acceptance criteria complete and testable
- [ ] Dependencies identified and unblocked
- [ ] Story points estimated (Fibonacci: 1,2,3,5,8,13)
- [ ] Technical approach documented
- [ ] UI mockups attached (if UI work)
- [ ] Database schema changes identified
- [ ] Security implications reviewed
- [ ] No blocking issues (P0 bugs resolved)

---

## Definition of Done (DoD)

A user story is done when:
- [ ] Code complete and self-reviewed
- [ ] RLS policies tested (no unauthorized access)
- [ ] Transaction integrity verified (no orphaned records)
- [ ] Manual testing completed with checklist
- [ ] Accessibility verified (axe DevTools scan passed)
- [ ] Error messages are user-friendly
- [ ] Documentation updated (if needed)
- [ ] Deployed to staging environment
- [ ] Product owner accepted

---

## Story Estimation Scale

**Story Points (Fibonacci Scale):**
- **1 point:** ~1-2 hours (trivial change)
- **2 points:** ~2-4 hours (small feature)
- **3 points:** ~4-6 hours (medium feature)
- **5 points:** ~6-10 hours (large feature)
- **8 points:** ~10-16 hours (very large, should be split)
- **13 points:** Too large, must be split into smaller stories

---

## MVP User Stories (Phase 1)

### Epic 1: Profile Data Entry

#### US-1.1: Create Profile Manually

**As a** job seeker
**I want to** create a master profile by filling out a web form
**So that** I can store my professional information in a structured database

**Story Points:** 8
**Priority:** P0 (Must-Have)
**Sprint:** Sprint 1
**Dependencies:** Database schema (CB-1, CB-9 fixes required)

**Acceptance Criteria:**

1. **Form Access**
   - [ ] "Create Profile" button visible on homepage
   - [ ] Click navigates to profile creation form
   - [ ] Form loads in < 1 second

2. **Form Structure**
   - [ ] Single-page form with collapsible sections
   - [ ] Sections: Basic Info, Summary, Work Experience, Skills
   - [ ] All sections visible without scrolling (collapsible)
   - [ ] Form width: max 800px for readability

3. **Required Fields**
   - [ ] Profile name (string, 1-255 chars)
   - [ ] Full name (string, 1-255 chars)
   - [ ] Email (valid email format)
   - [ ] Location (string, 1-255 chars)
   - [ ] Professional summary (text, 50-2000 chars)
   - [ ] At least 1 work experience
   - [ ] At least 5 skills

4. **Validation**
   - [ ] Client-side validation with Zod schema
   - [ ] Real-time error messages (inline, under field)
   - [ ] Required fields marked with asterisk
   - [ ] Email format validation (RFC 5322)
   - [ ] Summary length validation (50-2000 chars)
   - [ ] Error summary announced to screen readers

5. **Transaction Safety**
   - [ ] Uses `create_master_profile()` RPC function
   - [ ] All data saved atomically (profile + experiences + skills)
   - [ ] Rollback on any error (no orphaned records)
   - [ ] Success message shown on completion
   - [ ] User redirected to profile view

6. **Error Handling**
   - [ ] Network errors: User-friendly message with retry option
   - [ ] Validation errors: Specific field-level messages
   - [ ] Database errors: Translated to user-friendly text
   - [ ] Partial failures: Clear explanation of what failed

7. **Accessibility (WCAG 2.1 AA)**
   - [ ] All form fields have associated `<label>` elements
   - [ ] Error messages linked with `aria-describedby`
   - [ ] Invalid fields marked with `aria-invalid="true"`
   - [ ] Required fields marked with `aria-required="true"`
   - [ ] Keyboard navigation works for all inputs
   - [ ] Focus visible on all focusable elements
   - [ ] axe DevTools scan passes with 0 critical issues

**Technical Notes:**
- Form component: `ProfileForm.vue`
- Store action: `profilesStore.createProfile()`
- RPC function: `create_master_profile(p_profile, p_experiences, p_skills)`
- Validation: Zod schema matching database constraints

**Out of Scope:**
- Multi-step wizard (deferred to future)
- CV upload (Phase 3)
- Profile duplication (Phase 2)
- Auto-save (added in US-1.3)

---

#### US-1.2: View Profile Details

**As a** job seeker
**I want to** view my saved master profile
**So that** I can review my professional information

**Story Points:** 2
**Priority:** P0 (Must-Have)
**Sprint:** Sprint 1
**Dependencies:** US-1.1 completed

**Acceptance Criteria:**

1. **Profile Access**
   - [ ] "View Profile" link in navigation
   - [ ] Click shows profile details page
   - [ ] Page loads in < 1 second

2. **Display Format**
   - [ ] All profile sections visible (Basic Info, Summary, Experience, Skills)
   - [ ] Read-only view (no edit mode yet)
   - [ ] Work experiences sorted by start date (descending)
   - [ ] Skills grouped by category
   - [ ] Proficiency level displayed for each skill

3. **Data Integrity**
   - [ ] All saved data displayed correctly
   - [ ] No missing fields
   - [ ] Dates formatted as "MMM YYYY" (e.g., "Jan 2020")
   - [ ] Current position marked as "Present"

4. **Actions**
   - [ ] "Edit Profile" button navigates to edit form
   - [ ] "Back" button returns to previous page

5. **Empty States**
   - [ ] If no profile exists, show "Create Profile" CTA
   - [ ] If section empty (e.g., no skills), show "No skills added"

6. **Accessibility**
   - [ ] Semantic HTML structure (`<section>`, `<article>`)
   - [ ] Heading hierarchy (H1 → H2 → H3)
   - [ ] Screen reader announces page content
   - [ ] Skip link to main content

**Technical Notes:**
- View component: `ProfileView.vue`
- Store action: `profilesStore.fetchProfile(id)`
- Query: `SELECT * FROM master_profiles WHERE id = ? AND user_id = auth.uid()`

**Out of Scope:**
- Edit inline (separate story US-2.1)
- Export to markdown (separate story US-4.1)
- Print view (future)

---

#### US-1.3: Auto-Save Draft

**As a** job seeker
**I want to** have my form data auto-saved as I type
**So that** I don't lose my work if I accidentally close the browser

**Story Points:** 3
**Priority:** P1 (Should-Have)
**Sprint:** Sprint 1
**Dependencies:** US-1.1 completed

**Acceptance Criteria:**

1. **Auto-Save Behavior**
   - [ ] Form data saved to localStorage every 30 seconds
   - [ ] Debounced (waits for typing to stop before saving)
   - [ ] Status message: "Draft saved at HH:MM:SS"
   - [ ] No network calls (localStorage only)

2. **Draft Restoration**
   - [ ] On form load, check for draft in localStorage
   - [ ] If draft exists, show "Restore draft?" prompt
   - [ ] User can choose "Restore" or "Discard"
   - [ ] Draft older than 7 days automatically discarded

3. **Draft Cleanup**
   - [ ] Draft cleared on successful profile creation
   - [ ] Draft cleared on manual "Discard" action
   - [ ] Storage key format: `profile-draft-{profileId||'new'}`

4. **Error Handling**
   - [ ] localStorage quota exceeded: Show warning message
   - [ ] JSON parse error: Discard invalid draft
   - [ ] No localStorage support: Gracefully degrade (no auto-save)

5. **Multi-Tab Handling**
   - [ ] Warn if same profile open in multiple tabs
   - [ ] Message: "This profile is being edited in another tab"
   - [ ] User can choose to continue or close

6. **Accessibility**
   - [ ] Auto-save status announced to screen readers (aria-live="polite")
   - [ ] Restore prompt keyboard accessible

**Technical Notes:**
- Composable: `useAutoSave(formData, { storageKey, delay: 30000 })`
- Storage: `localStorage.setItem(key, JSON.stringify(data))`
- Debounce: Use VueUse `useDebounceFn()`

**Out of Scope:**
- Database auto-save (use localStorage only)
- Conflict resolution (last write wins)
- Version control (future)

---

### Epic 2: Profile Editing

#### US-2.1: Edit Profile Information

**As a** job seeker
**I want to** edit my existing master profile
**So that** I can keep my information up to date

**Story Points:** 5
**Priority:** P0 (Must-Have)
**Sprint:** Sprint 2
**Dependencies:** US-1.1, US-1.2 completed, CB-2 (optimistic locking) fixed

**Acceptance Criteria:**

1. **Edit Access**
   - [ ] "Edit Profile" button on profile view page
   - [ ] Click navigates to edit form (same as create form)
   - [ ] Form pre-filled with current profile data

2. **Editable Fields**
   - [ ] All fields editable except `id`, `created_at`
   - [ ] Work experiences: add, edit, delete, reorder
   - [ ] Skills: add, edit, delete, reorder
   - [ ] Changes highlighted visually (dirty state)

3. **Validation**
   - [ ] Same validation rules as create form
   - [ ] Changes validated before save
   - [ ] Error messages for invalid changes

4. **Transaction Safety + Optimistic Locking**
   - [ ] Uses `update_master_profile()` RPC function
   - [ ] Version conflict detection (concurrent edits)
   - [ ] If version mismatch, show conflict resolution UI
   - [ ] User can choose: "Overwrite", "Merge", or "Cancel"
   - [ ] All updates atomic (no partial saves)

5. **Optimistic UI**
   - [ ] Changes reflected immediately in UI
   - [ ] Rollback if server update fails
   - [ ] Loading state while saving
   - [ ] Success message on save completion

6. **Auto-Save Integration**
   - [ ] Draft saved every 30 seconds (same as create)
   - [ ] Draft restored if user refreshes page
   - [ ] Draft cleared on successful save

7. **Error Handling**
   - [ ] Concurrent edit conflict: Show "Profile was modified by another session"
   - [ ] Network error: Retry option with exponential backoff
   - [ ] Validation error: Field-level messages

8. **Accessibility**
   - [ ] Form remains keyboard accessible during edits
   - [ ] Changes announced to screen readers
   - [ ] Save confirmation announced

**Technical Notes:**
- Form component: `ProfileForm.vue` (reused from create)
- Store action: `profilesStore.updateProfile(id, updates, currentVersion)`
- RPC function: `update_master_profile(p_profile_id, p_expected_version, p_updates)`
- Conflict resolution: Compare `expected_version` vs `current_version`

**Out of Scope:**
- Real-time collaborative editing (future)
- Change history / diff view (future)
- Undo/redo (future)

---

#### US-2.2: Delete Profile

**As a** job seeker
**I want to** delete my master profile
**So that** I can remove outdated or incorrect information

**Story Points:** 2
**Priority:** P1 (Should-Have)
**Sprint:** Sprint 2
**Dependencies:** US-2.1 completed, CB-3 (soft deletes) implemented

**Acceptance Criteria:**

1. **Delete Access**
   - [ ] "Delete Profile" button on profile view page
   - [ ] Button styled as danger action (red color)
   - [ ] Confirmation modal shown on click

2. **Confirmation Modal**
   - [ ] Title: "Delete Profile?"
   - [ ] Message: "This will mark your profile as deleted. You can recover it within 30 days by contacting support."
   - [ ] Actions: "Cancel" (default), "Delete" (danger)
   - [ ] Keyboard: ESC closes modal, Enter confirms

3. **Soft Delete Behavior**
   - [ ] Uses `soft_delete_profile()` RPC function
   - [ ] Sets `deleted_at = NOW()` (not hard delete)
   - [ ] Profile hidden from list views
   - [ ] Work experiences + skills also soft-deleted
   - [ ] Data retained for 30 days (recovery window)

4. **Post-Delete Actions**
   - [ ] User redirected to home page
   - [ ] Success message: "Profile deleted. You can recover it within 30 days."
   - [ ] Deleted profile no longer appears in lists

5. **Security**
   - [ ] RLS policy prevents deleting other users' profiles
   - [ ] Only profile owner can delete
   - [ ] Version check (optimistic locking) before delete

6. **Accessibility**
   - [ ] Confirmation modal keyboard accessible
   - [ ] Focus trapped in modal
   - [ ] Delete action announced to screen readers

**Technical Notes:**
- RPC function: `soft_delete_profile(p_profile_id)`
- Modal component: `ConfirmModal.vue`
- Store action: `profilesStore.deleteProfile(id)`

**Out of Scope:**
- Hard delete (only soft delete in MVP)
- Restore deleted profile UI (support only)
- Permanent delete after 30 days (manual cleanup)

---

### Epic 3: Data Migration & Export

#### US-3.1: Import Existing Profile from Markdown

**As a** job seeker
**I want to** import my existing master_profile.md file
**So that** I can migrate to the database system without manual re-entry

**Story Points:** 5
**Priority:** P0 (Must-Have)
**Sprint:** Sprint 2
**Dependencies:** US-1.1 completed

**Acceptance Criteria:**

1. **Import Script**
   - [ ] Python script: `.claude/agents/cv_tailor_agent/migrate_to_db.py`
   - [ ] Parses `01_Profile/master_profile.md`
   - [ ] Extracts: basic info, summary, experiences, skills, education
   - [ ] Maps to database schema

2. **Dry-Run Mode**
   - [ ] `--dry-run` flag shows preview without saving
   - [ ] Displays extracted data in JSON format
   - [ ] Validates all required fields present
   - [ ] User confirms before actual migration

3. **Migration Execution**
   - [ ] Uses `create_master_profile()` RPC function
   - [ ] All data saved atomically
   - [ ] Backup of markdown file created (`.md.backup.YYYYMMDD`)
   - [ ] Success message with profile ID

4. **Validation**
   - [ ] All required fields extracted
   - [ ] Email format validated
   - [ ] Dates parsed correctly
   - [ ] Skills categorized (or marked as uncategorized)
   - [ ] Compare imported data vs source (data integrity check)

5. **Error Handling**
   - [ ] Markdown parse error: Clear message with line number
   - [ ] Missing required field: List all missing fields
   - [ ] Database error: Rollback (no partial import)
   - [ ] Validation error: Show which fields failed

6. **Rollback Plan**
   - [ ] If migration fails, no database changes
   - [ ] Markdown file unchanged (backup preserved)
   - [ ] Clear instructions to revert if needed

**Technical Notes:**
- Script: `migrate_to_db.py --dry-run`
- Parser: Regex-based markdown parsing
- Validation: Match Zod schema from frontend
- RPC call: `create_master_profile(user_id, profile_data, experiences, skills)`

**Out of Scope:**
- UI for import (CLI script only)
- Multiple markdown files
- Automatic sync (one-time migration)

---

#### US-3.2: Export Profile to Markdown

**As a** job seeker
**I want to** export my database profile to markdown format
**So that** my existing CV generation scripts continue to work

**Story Points:** 3
**Priority:** P0 (Must-Have)
**Sprint:** Sprint 2
**Dependencies:** US-1.1 completed

**Acceptance Criteria:**

1. **Export Access**
   - [ ] "Export to Markdown" button on profile view page
   - [ ] Click downloads `master_profile.md` file
   - [ ] Filename format: `master_profile_YYYYMMDD.md`

2. **Export Format**
   - [ ] Matches existing markdown structure exactly
   - [ ] Sections: Basic Info, Summary, Experience, Skills, Education
   - [ ] Work experiences sorted by date (descending)
   - [ ] Skills grouped by category
   - [ ] No data loss (all fields exported)

3. **Backward Compatibility**
   - [ ] Exported file works with existing CV generation scripts
   - [ ] Format validated against current `master_profile.md`
   - [ ] No breaking changes to structure

4. **Export Function**
   - [ ] Uses `export_profile_markdown()` RPC function
   - [ ] Returns formatted markdown text
   - [ ] Client-side file download (blob + anchor click)

5. **Error Handling**
   - [ ] Empty profile: Show "No profile to export"
   - [ ] RPC error: User-friendly message with retry
   - [ ] Browser download blocked: Instructions to allow

6. **Accessibility**
   - [ ] Export button keyboard accessible
   - [ ] Download action announced to screen readers

**Technical Notes:**
- RPC function: `export_profile_markdown(p_profile_id) RETURNS TEXT`
- Frontend: `const blob = new Blob([markdown], { type: 'text/markdown' })`
- Download: Programmatic anchor click

**Out of Scope:**
- Auto-sync to markdown file (one-time export)
- Other export formats (PDF, JSON)
- Export history

---

## Phase 2 User Stories (Deferred)

### Epic 4: Multiple Profiles (Future)

#### US-4.1: Create Multiple Profiles
**Story Points:** 5
**Status:** Deferred to Phase 2

---

#### US-4.2: Set Default Profile
**Story Points:** 2
**Status:** Deferred to Phase 2

---

### Epic 5: AI CV Extraction (Phase 3, Optional)

#### US-5.1: Upload CV File
**Story Points:** 3
**Status:** Deferred to Phase 3

---

#### US-5.2: AI Extract Profile Data
**Story Points:** 8
**Status:** Deferred to Phase 3

---

#### US-5.3: Review Extracted Data
**Story Points:** 3
**Status:** Deferred to Phase 3

---

#### US-5.4: Save Extracted Profile
**Story Points:** 2
**Status:** Deferred to Phase 3

---

## Sprint Planning

### Sprint 1 (Week 1) - 20 hours capacity

**Goal:** Database foundation + basic profile creation

**Stories:**
1. Technical Debt: Fix CB-1, CB-2, CB-9, CB-3 (8 hours)
2. US-1.1: Create Profile Manually (8 hours)
3. US-1.2: View Profile Details (2 hours)
4. US-1.3: Auto-Save Draft (3 hours)

**Total:** 21 hours (slightly over capacity, buffer in story estimates)

**Risks:**
- Database migration complexity
- RPC function debugging
- RLS policy testing

---

### Sprint 2 (Week 2) - 20 hours capacity

**Goal:** Profile editing + migration

**Stories:**
1. US-2.1: Edit Profile Information (5 hours)
2. US-2.2: Delete Profile (2 hours)
3. US-3.1: Import from Markdown (5 hours)
4. US-3.2: Export to Markdown (3 hours)
5. Testing + Bug Fixes (5 hours)

**Total:** 20 hours

**Risks:**
- Markdown parsing complexity
- Optimistic locking conflicts
- Export format compatibility

---

## Story Dependencies Graph

```
Sprint 1:
CB-1, CB-2, CB-9, CB-3 (Database Fixes)
    ↓
US-1.1 (Create Profile)
    ↓
US-1.2 (View Profile)
    ↓
US-1.3 (Auto-Save)

Sprint 2:
US-1.1 + CB-2 (Optimistic Locking)
    ↓
US-2.1 (Edit Profile)
    ↓
US-2.2 (Delete Profile)

US-1.1
    ↓
US-3.1 (Import Markdown)
US-3.2 (Export Markdown)
```

---

## Acceptance Testing Checklist

### Manual Testing (Every Story)

**Before marking story as done:**
- [ ] Happy path tested (expected behavior works)
- [ ] Error paths tested (validation errors, network errors)
- [ ] Boundary conditions (min/max values, empty states)
- [ ] RLS policies verified (can't access other users' data)
- [ ] Transaction integrity checked (no orphaned records)
- [ ] Accessibility verified (axe DevTools scan)
- [ ] Cross-browser tested (Chrome, Firefox, Safari)

### Regression Testing (Every Sprint)

**Before sprint demo:**
- [ ] All previous stories still work
- [ ] Create → View → Edit → Delete flow working
- [ ] Auto-save + draft restoration working
- [ ] Import → Export → CV generation working
- [ ] No console errors
- [ ] No RLS policy violations

---

**Document Version:** 2.0
**Last Updated:** October 5, 2025
**Next Review:** After Sprint 1 completion
