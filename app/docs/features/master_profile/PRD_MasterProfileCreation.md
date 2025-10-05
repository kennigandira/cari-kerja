# Product Requirements Document (PRD)
# Master Profile Creation & Management

**Version:** 2.0 (Revised after Technical Review)
**Status:** Approved for Development
**Last Updated:** October 5, 2025
**Owner:** Product Team
**Contributors:** Engineering, Design, Product Owner, Product Manager
**Technical Review:** Architect, Backend Specialist, Frontend Specialist

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Context & Background](#2-context--background)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Stories & Personas](#4-user-stories--personas)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Experience & Flows](#7-user-experience--flows)
8. [Technical Specifications](#8-technical-specifications)
9. [Implementation Phases](#9-implementation-phases)
10. [Dependencies & Risks](#10-dependencies--risks)
11. [Out of Scope](#11-out-of-scope)
12. [Open Questions](#12-open-questions)
13. [Appendix](#13-appendix)

---

## 1. Executive Summary

### 1.1 Feature Name
**Master Profile Creation & Management System**

### 1.2 Problem Statement

**Current State:**
- User profile data exists only in a static markdown file (`01_Profile/master_profile.md`)
- No ability to edit profile through the web application
- Manual process to update profile information
- No version control or audit trail for profile changes
- Single profile limitation - can't create specialized profiles for different job types

**Pain Points:**
- Time-consuming to manually edit markdown files
- Risk of syntax errors when editing directly
- No validation of data integrity
- Cannot A/B test different profile versions
- Difficult to maintain consistency across applications

### 1.3 Solution Overview

Build a comprehensive Master Profile management system that allows users to:
1. **Create** profiles by uploading existing CVs (AI-assisted) or manually
2. **Edit** profiles through intuitive web forms
3. **Manage** multiple profiles with one set as default
4. **Version** profiles to track changes over time
5. **Link** specific profile versions to job applications

### 1.4 Key Goals (Revised)

**PRIMARY GOAL:**
1. **Reduce profile editing time** from 30 minutes (manual markdown) to ≤5 minutes (web form)

**SECONDARY GOALS:**
2. **Improve data accuracy** through structured input and database validation
3. **Maintain backward compatibility** via markdown export for existing CV generation scripts
4. **Provide seamless migration** from existing file-based profile

**DEFERRED GOALS (Phase 2/3):**
5. ~~Enable profile experimentation~~ → Multiple profiles moved to Phase 2
6. ~~AI-assisted CV extraction~~ → Moved to Phase 3 (optional)

### 1.5 Success Metrics (Revised)

**PRIMARY METRICS (MVP - Phase 1):**

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Profile editing time | 30 min | ≤ 5 min | Manual timing |
| CV generation errors | 2-3/month | 0 | Error logs |
| Markdown export accuracy | N/A | 100% match | Automated comparison |
| Migration success rate | N/A | 100% | Script validation |

**BUSINESS OUTCOME METRICS:**

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Applications per month | 10-15 | 20+ | Manual tracking |
| Time saved per week | 0 | ≥ 2 hours | Usage tracking |
| Tool adoption | 0% | 100% after 1 month | Web UI vs markdown usage |

**DEFERRED METRICS (Phase 3):**
- ~~CV extraction accuracy~~ → Only if AI extraction built
- ~~User satisfaction surveys~~ → Not applicable for solo user
- ~~Profile edit frequency~~ → Focus on time saved, not frequency

---

## 2. Context & Background

### 2.1 Current System Architecture

```
Current Flow (File-based):
┌─────────────────────┐
│ 01_Profile/         │
│ master_profile.md   │ ← Manual editing in text editor
└──────────┬──────────┘
           │
           ↓ (Read by AI agents)
┌──────────────────────────────┐
│ CV/Cover Letter Generation   │
│ Job Match Calculation        │
└──────────────────────────────┘
```

### 2.2 Proposed System Architecture

```
Proposed Flow (Database-driven):
┌──────────────────┐
│  Upload CV File  │
└────────┬─────────┘
         │
         ↓ AI Extraction
┌──────────────────────────┐
│  Pre-filled Web Form     │
│  (User Review/Edit)      │
└────────┬─────────────────┘
         │
         ↓ Submit
┌──────────────────────────┐
│  Supabase Database       │
│  master_profiles table   │
└────────┬─────────────────┘
         │
         ↓ (Used by)
┌──────────────────────────┐
│ Job Match Calculation    │
│ CV Generation            │
│ Cover Letter Generation  │
└──────────────────────────┘
```

### 2.3 Why Now?

1. **Web application adoption:** Users increasingly prefer web UI over CLI/file editing
2. **Profile complexity:** Managing 100+ skills, 7+ work experiences manually is error-prone
3. **Multiple profiles need:** Users want specialized profiles (e.g., "Frontend React", "Full-Stack", "Leadership")
4. **Data integrity:** Database validation prevents inconsistencies that break AI generation
5. **Feature enablement:** Unlocks analytics, A/B testing, and profile recommendations

---

## 3. Goals & Success Metrics

### 3.1 Primary Goals

#### Goal 1: Reduce Profile Creation Effort
**Metric:** Time to create/update complete profile
**Target:** ≤ 5 minutes (from 30 minutes manual)
**Measurement:** User analytics + surveys

#### Goal 2: Improve Data Quality
**Metric:** % of profiles with validation errors
**Target:** < 5% error rate
**Measurement:** Database validation logs

#### Goal 3: Enable Profile Flexibility
**Metric:** Average # of profiles per user
**Target:** 2-3 profiles (specialized versions)
**Measurement:** Database queries

### 3.2 Secondary Goals

- **Migration Success:** 100% of existing users migrate file-based profile to database
- **AI Accuracy:** ≥ 85% CV extraction accuracy (user verification needed)
- **User Satisfaction:** ≥ 4.5/5 rating for profile creation experience

### 3.3 Anti-Goals (What We're NOT Trying to Achieve)

- ❌ Replace LinkedIn (not a social network)
- ❌ Job board integration (separate feature)
- ❌ Resume builder with templates (we generate from data, not design)
- ❌ Multi-user collaboration on single profile

---

## 4. User Stories & Personas

### 4.1 Primary Persona

**Name:** Alex Chen
**Role:** Senior Frontend Engineer
**Age:** 32
**Location:** Bangkok, Thailand
**Tech Stack:** React, TypeScript, GraphQL
**Job Search Status:** Actively seeking (10-15 applications/month)

**Goals:**
- Quickly apply to relevant positions
- Tailor CV for different types of roles (IC vs Leadership)
- Track which profile version performs better

**Pain Points:**
- Manually editing markdown files is tedious
- Typos in profile break CV generation
- Can't experiment with different profile versions
- No visibility into what changed over time

### 4.2 User Stories

#### Epic 1: Profile Creation

**US-1.1: Upload CV for Extraction** (Must-Have)
```
As a job seeker
I want to upload my existing CV
So that the system can extract my information automatically

Acceptance Criteria:
- ✅ Support PDF, DOCX, TXT file formats
- ✅ File size limit: 5MB
- ✅ Show upload progress
- ✅ Display extraction status with estimated time
- ✅ Handle extraction errors gracefully
- ✅ Store original file in Supabase Storage
```

**US-1.2: Create Profile Manually** (Must-Have)
```
As a job seeker
I want to create a profile from scratch
So that I can enter information without uploading a CV

Acceptance Criteria:
- ✅ Access blank form from homepage
- ✅ All fields editable
- ✅ Save draft functionality
- ✅ Validation on required fields
```

**US-1.3: Review Extracted Information** (Must-Have)
```
As a job seeker
I want to review AI-extracted information
So that I can correct any errors before saving

Acceptance Criteria:
- ✅ Pre-filled form with extracted data
- ✅ Highlight low-confidence fields (< 70%)
- ✅ Edit any field before submitting
- ✅ Option to re-run extraction if poor quality
```

#### Epic 2: Profile Editing

**US-2.1: Edit Existing Profile** (Must-Have)
```
As a job seeker
I want to edit my saved profile
So that I can keep information up to date

Acceptance Criteria:
- ✅ Access profile from settings/dashboard
- ✅ Pre-filled form with current data
- ✅ Save changes with confirmation
- ✅ Track when profile was last updated
```

**US-2.2: Manage Work Experiences** (Must-Have)
```
As a job seeker
I want to add, edit, delete work experiences
So that I can maintain an accurate employment history

Acceptance Criteria:
- ✅ Add new experience with form
- ✅ Edit existing experiences inline
- ✅ Delete experiences with confirmation
- ✅ Reorder experiences (drag-and-drop or up/down buttons)
- ✅ Mark current position (end date = null)
```

**US-2.3: Manage Skills** (Should-Have)
```
As a job seeker
I want to categorize and manage my skills
So that they're organized and easy to maintain

Acceptance Criteria:
- ✅ Add skills with autocomplete suggestions
- ✅ Categorize skills (Frontend, Backend, Tools, etc.)
- ✅ Set proficiency levels (Expert, Advanced, Intermediate)
- ✅ Delete skills
- ✅ Reorder skills within categories
```

#### Epic 3: Multiple Profiles

**US-3.1: Create Multiple Profiles** (Should-Have)
```
As a job seeker
I want to create multiple profile versions
So that I can tailor my profile for different job types

Acceptance Criteria:
- ✅ Create new profile from scratch
- ✅ Duplicate existing profile (create variation)
- ✅ Name profiles descriptively (e.g., "Frontend React", "Full-Stack")
- ✅ View list of all profiles
```

**US-3.2: Set Default Profile** (Should-Have)
```
As a job seeker
I want to set one profile as default
So that it's automatically used for new job applications

Acceptance Criteria:
- ✅ Mark one profile as default
- ✅ Visual indicator for default profile
- ✅ Option to change default anytime
- ✅ Only one profile can be default at a time
```

**US-3.3: Choose Profile Per Application** (Nice-to-Have)
```
As a job seeker
I want to choose which profile to use for each job
So that I can use specialized profiles strategically

Acceptance Criteria:
- ✅ Profile selector when creating job application
- ✅ Default profile pre-selected
- ✅ Link application to specific profile version
```

#### Epic 4: Profile Versioning

**US-4.1: View Profile History** (Nice-to-Have)
```
As a job seeker
I want to see how my profile changed over time
So that I can understand what information I used for past applications

Acceptance Criteria:
- ✅ View profile versions with timestamps
- ✅ See what changed between versions
- ✅ Revert to previous version if needed
```

---

## 5. Functional Requirements

### 5.1 Core Features (Must-Have - Phase 1)

#### F-1: CV Upload & Extraction

**Description:** Allow users to upload CV files, extract information using AI, and pre-fill the profile form.

**Requirements:**

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| F-1.1 | Support PDF file upload | P0 | PDF files up to 5MB can be uploaded |
| F-1.2 | Support DOCX file upload | P0 | DOCX files up to 5MB can be uploaded |
| F-1.3 | Support TXT/MD file upload | P1 | Plain text files can be uploaded |
| F-1.4 | File validation | P0 | Reject unsupported formats with clear error |
| F-1.5 | Upload progress indicator | P0 | Show % progress during upload |
| F-1.6 | AI extraction processing | P0 | Use Anthropic Claude API to parse CV |
| F-1.7 | Extraction status display | P0 | Show "Analyzing CV..." with spinner |
| F-1.8 | Extraction error handling | P0 | Show error + option to try again or manual entry |
| F-1.9 | Confidence scoring | P1 | Mark low-confidence fields (< 70%) |
| F-1.10 | Store original file | P0 | Save uploaded CV to Supabase Storage |

**User Flow:**
```
1. User clicks "Upload CV" button
2. File picker opens
3. User selects CV file
4. Client validates file type and size
5. Upload begins with progress bar
6. File uploaded to Supabase Storage
7. Cloudflare Worker triggered for extraction
8. AI analyzes CV (10-30 seconds)
9. Extracted data returned to frontend
10. User redirected to form with pre-filled data
```

**Error States:**
- File too large (> 5MB)
- Unsupported file format
- Upload failed (network error)
- Extraction failed (AI error)
- Extraction timeout (> 60 seconds)

#### F-2: Profile Form

**Description:** Multi-section form for creating and editing master profiles.

**Form Sections:**

##### Section 1: Basic Information
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Profile Name | Text (255) | Yes | Non-empty, unique per user | e.g., "Senior Frontend Profile" |
| Full Name | Text (255) | Yes | Non-empty | Legal name |
| Email | Email | Yes | Valid email format | Primary contact |
| Phone (Primary) | Phone | No | Valid phone format | International format |
| Phone (Secondary) | Phone | No | Valid phone format | Optional |
| LinkedIn URL | URL | No | Valid URL format | Public profile |
| GitHub URL | URL | No | Valid URL format | Portfolio |
| Portfolio URL | URL | No | Valid URL format | Personal website |
| Location | Text (255) | Yes | Non-empty | City, Country |

##### Section 2: Professional Summary
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Summary | Textarea | Yes | 100-1000 chars | Elevator pitch |
| Years of Experience | Number | No | 0-50 | Total years |
| Current Position | Text (255) | No | - | Current role title |

##### Section 3: Work Experiences
**Repeatable Section** (Add/Edit/Delete multiple)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Company Name | Text (255) | Yes | Non-empty | Employer |
| Position Title | Text (255) | Yes | Non-empty | Job title |
| Location | Text (255) | No | - | City, Country |
| Start Date | Date | Yes | Valid date | MM/YYYY format |
| End Date | Date | No | >= Start Date | Null if current |
| Is Current | Checkbox | No | - | Auto-sets end date to null |
| Description | Textarea | No | Max 2000 chars | Responsibilities |

**Nested: Achievements** (per experience)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Description | Textarea | Yes | Non-empty | Achievement statement |
| Metric Type | Select | No | Enum | percentage, time_reduction, revenue, count |
| Metric Value | Number | No | - | Numeric value |
| Metric Unit | Text (50) | No | - | %, ms, USD, users, etc. |
| Timeframe | Text (100) | No | - | Q3, 2023, first year |

##### Section 4: Skills
**Repeatable Section** (Add/Delete multiple)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Skill Name | Text (255) | Yes | Non-empty | Technology/tool name |
| Category | Select | No | Predefined list | Frontend, Backend, Tools, etc. |
| Proficiency | Select | No | Enum | Expert, Advanced, Intermediate, Beginner |
| Years of Experience | Number | No | 0-50 | Years using skill |

**Skill Categories:**
- Frontend Frameworks & Libraries
- Programming Languages
- Styling & CSS
- Backend & APIs
- Build Tools & DevOps
- Testing & Documentation
- Version Control & Collaboration
- Search & Database
- CMS
- Performance & Optimization
- Design Tools
- Leadership & Management
- Professional Skills
- Languages (Human)

##### Section 5: Education
**Repeatable Section**

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Institution | Text (255) | Yes | Non-empty | University/school name |
| Degree | Text (255) | No | - | BA, BSc, MSc, PhD, etc. |
| Field of Study | Text (255) | No | - | Major/specialization |
| Start Year | Number | No | 1900-2100 | YYYY |
| End Year | Number | No | >= Start Year | YYYY |

##### Section 6: Certifications
**Repeatable Section**

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Certification Name | Text (255) | Yes | Non-empty | Certificate title |
| Issuing Organization | Text (255) | No | - | Company/institution |
| Issue Date | Date | No | <= Today | MM/YYYY |
| Expiry Date | Date | No | >= Issue Date | MM/YYYY, null if no expiry |
| Credential ID | Text (255) | No | - | Certificate number |
| Credential URL | URL | No | Valid URL | Verification link |

**Form Behaviors:**
- Auto-save draft every 30 seconds
- "Save Draft" button (manual save)
- "Preview Profile" button (formatted view)
- "Submit" button (final save)
- Validation on submit (highlight errors)
- Confirmation modal before leaving with unsaved changes

#### F-3: Profile Management

**Description:** View, edit, delete, and manage multiple profiles.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| F-3.1 | List all profiles | P0 |
| F-3.2 | Create new profile | P0 |
| F-3.3 | Edit existing profile | P0 |
| F-3.4 | Delete profile (with confirmation) | P0 |
| F-3.5 | Duplicate profile | P1 |
| F-3.6 | Set default profile | P1 |
| F-3.7 | Search/filter profiles | P2 |

**Profile List UI:**
```
┌────────────────────────────────────────────┐
│  My Profiles                    [+ New]    │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────┐         │
│  │ 🟢 Senior Frontend Profile   │ DEFAULT │
│  │ Updated: Oct 5, 2025         │         │
│  │ [Edit] [Duplicate] [Delete]  │         │
│  └──────────────────────────────┘         │
│                                            │
│  ┌──────────────────────────────┐         │
│  │ ⚪ Full-Stack Profile         │         │
│  │ Updated: Sep 28, 2025        │         │
│  │ [Edit] [Set Default] [Delete]│         │
│  └──────────────────────────────┘         │
│                                            │
└────────────────────────────────────────────┘
```

### 5.2 Enhanced Features (Should-Have - Phase 2)

#### F-4: Profile Preview

**Description:** Show formatted profile view before saving.

**Requirements:**
- Render profile in master_profile.md format
- Show all sections (collapsible)
- "Edit" button to return to form
- "Confirm & Save" button to submit

#### F-5: Skill Autocomplete

**Description:** Suggest skills as user types.

**Requirements:**
- Autocomplete from common skills database
- Categorize suggestions automatically
- Show related skills
- Allow custom skills

#### F-6: Validation & Error Handling

**Description:** Comprehensive validation rules.

**Validation Rules:**

| Field | Validation | Error Message |
|-------|------------|---------------|
| Email | RFC 5322 format | "Please enter a valid email address" |
| Phone | E.164 international format | "Please enter a valid phone number (e.g., +66 123456789)" |
| URL | Valid URL with protocol | "Please enter a valid URL (e.g., https://example.com)" |
| Date | Valid date, realistic range | "Please enter a valid date" |
| Date Range | End >= Start | "End date must be after start date" |
| Text Length | Min/max constraints | "Must be between X and Y characters" |
| Required | Not empty | "This field is required" |

### 5.3 Advanced Features (Nice-to-Have - Phase 3)

#### F-7: Profile Versioning

**Description:** Track changes to profiles over time.

**Requirements:**
- Save snapshot on every update
- Show version history timeline
- Diff view between versions
- Revert to previous version
- Link applications to specific version

#### F-8: Profile Analytics

**Description:** Insights into profile performance.

**Requirements:**
- Show which profile gets better match scores
- Track application success rate per profile
- Suggest profile improvements
- A/B test recommendations

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| CV Upload Speed | < 5 seconds for 2MB file | Performance monitoring |
| AI Extraction Time | < 30 seconds | Worker execution time |
| Form Load Time | < 1 second | Lighthouse |
| Form Submit Time | < 2 seconds | API response time |
| Auto-save Latency | < 500ms (debounced) | Network timing |

### 6.2 Security

| Requirement | Implementation |
|-------------|----------------|
| File Upload Security | Validate MIME type, scan for malware, size limits |
| Data Encryption | Encrypt sensitive fields (phone, email) at rest |
| Access Control | Row-Level Security (RLS) in Supabase |
| Input Sanitization | Prevent XSS, SQL injection |
| File Storage Security | Signed URLs with expiration, private bucket |

### 6.3 Scalability

| Requirement | Target |
|-------------|--------|
| Concurrent Users | Support 100 simultaneous profile edits |
| Database Scaling | Handle 10,000+ profiles |
| File Storage | Support 50GB+ of CV files |
| API Rate Limiting | 100 requests/minute per user |

### 6.4 Accessibility (WCAG 2.1 Level AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Navigation | All actions keyboard-accessible (Tab, Enter, Esc) |
| Screen Reader | Semantic HTML, ARIA labels, form labels |
| Color Contrast | 4.5:1 minimum ratio |
| Focus Indicators | Visible focus states on all interactive elements |
| Error Identification | Clear error messages, associated with fields |

### 6.5 Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |

### 6.6 Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Single column, stacked sections |
| Tablet (640-1024px) | 2-column form where appropriate |
| Desktop (> 1024px) | Multi-column layout, side navigation |

---

## 7. User Experience & Flows

### 7.1 Primary User Flow: Upload CV & Create Profile

```
┌─────────────────────┐
│   Landing Page      │
│                     │
│  [Upload CV]        │
│  [Create Manually]  │
└──────────┬──────────┘
           │
           ↓ (Upload CV selected)
┌──────────────────────┐
│  File Upload Modal   │
│                      │
│  Drag & Drop or      │
│  [Choose File]       │
│                      │
│  Supported: PDF,     │
│  DOCX, TXT (5MB max) │
└──────────┬───────────┘
           │
           ↓ File selected
┌──────────────────────┐
│  Uploading...        │
│  ████████░░  80%     │
└──────────┬───────────┘
           │
           ↓ Upload complete
┌──────────────────────┐
│  Analyzing CV...     │
│  ⏳ Est: 20 seconds  │
│                      │
│  [Cancel]            │
└──────────┬───────────┘
           │
           ↓ Extraction complete
┌──────────────────────────────────┐
│  Profile Form (Pre-filled)       │
│                                  │
│  ⚠️ Review highlighted fields    │
│     (low confidence)             │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Basic Info                 │ │
│  │ Name: [John Doe]          │ │
│  │ Email: [john@example.com] │ │
│  │ ...                       │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Work Experience           │ │
│  │ [+ Add Experience]        │ │
│  │                           │ │
│  │ Company: [Acme Corp]      │ │
│  │ Position: [Engineer]      │ │
│  │ ⚠️ Location: [Unknown]    │ │ ← Low confidence
│  │ ...                       │ │
│  └────────────────────────────┘ │
│                                  │
│  [Save Draft] [Preview] [Submit] │
└──────────────────────────────────┘
           │
           ↓ Submit clicked
┌──────────────────────┐
│  Saving...           │
└──────────┬───────────┘
           │
           ↓ Save complete
┌──────────────────────┐
│  Success!            │
│  ✅ Profile created  │
│                      │
│  [View Profile]      │
│  [Create Another]    │
│  [Go to Dashboard]   │
└──────────────────────┘
```

### 7.2 Alternative Flow: Manual Profile Creation

```
┌─────────────────────┐
│   Landing Page      │
│                     │
│  [Upload CV]        │
│  [Create Manually]  │
└──────────┬──────────┘
           │
           ↓ (Create Manually selected)
┌──────────────────────────────────┐
│  Profile Form (Blank)            │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Profile Name              │ │
│  │ [Enter name...]           │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Basic Info                │ │
│  │ Name: [________]          │ │
│  │ Email: [________]         │ │
│  │ ...                       │ │
│  └────────────────────────────┘ │
│                                  │
│  ... (all sections blank)        │
│                                  │
│  [Save Draft] [Preview] [Submit] │
└──────────────────────────────────┘
```

### 7.3 Edit Profile Flow

```
┌─────────────────────┐
│  Profile List       │
│                     │
│  ┌──────────────┐   │
│  │ Profile 1    │   │
│  │ [Edit]       │───┼─┐
│  └──────────────┘   │ │
└─────────────────────┘ │
                        │
                        ↓
┌──────────────────────────────────┐
│  Edit Profile Form               │
│  (Pre-filled with existing data) │
│                                  │
│  ... (same as create form)       │
│                                  │
│  [Cancel] [Save Changes]         │
└──────────────────────────────────┘
           │
           ↓ Save Changes clicked
┌──────────────────────┐
│  Updating...         │
└──────────┬───────────┘
           │
           ↓ Update complete
┌──────────────────────┐
│  Updated!            │
│  ✅ Changes saved    │
│                      │
│  [Back to List]      │
└──────────────────────┘
```

### 7.4 Error Handling Flows

#### Extraction Failed

```
┌──────────────────────┐
│  Error               │
│  ❌ CV extraction    │
│  failed              │
│                      │
│  The AI couldn't     │
│  parse your CV.      │
│                      │
│  [Try Again]         │
│  [Enter Manually]    │
└──────────────────────┘
```

#### Validation Errors

```
┌──────────────────────────────────┐
│  Profile Form                    │
│                                  │
│  ❌ Please fix the following     │
│  errors:                         │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Email                      │ │
│  │ [invalid-email]            │ │
│  │ ⚠️ Invalid email format    │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Start Date: 2025-01-01    │ │
│  │ End Date: 2024-01-01      │ │
│  │ ⚠️ End date must be after  │ │
│  │    start date              │ │
│  └────────────────────────────┘ │
│                                  │
│  [Fix Errors]                    │
└──────────────────────────────────┘
```

---

## 8. Technical Specifications

### 8.1 Database Schema

```sql
-- Master Profiles Table
CREATE TABLE master_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identification
  profile_name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,

  -- Contact Information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_primary VARCHAR(50),
  phone_secondary VARCHAR(50),
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  location VARCHAR(255) NOT NULL,

  -- Professional Summary
  professional_summary TEXT NOT NULL,
  years_of_experience INTEGER,
  current_position VARCHAR(255),

  -- File Reference
  original_cv_file_path TEXT,
  original_cv_filename VARCHAR(255),
  original_cv_mime_type VARCHAR(100),
  original_cv_size_bytes INTEGER,

  -- Extraction Metadata
  extraction_confidence_score FLOAT CHECK (extraction_confidence_score >= 0 AND extraction_confidence_score <= 1),
  extraction_method VARCHAR(50), -- 'ai', 'manual', 'imported'

  -- Versioning
  version INTEGER DEFAULT 1,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT unique_profile_name_per_user UNIQUE (user_id, profile_name)
);

-- Index for default profile lookup
CREATE INDEX idx_master_profiles_default ON master_profiles(user_id, is_default) WHERE is_default = true;

-- Trigger to ensure only one default profile per user
CREATE OR REPLACE FUNCTION ensure_single_default_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE master_profiles
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_default_profile
BEFORE INSERT OR UPDATE ON master_profiles
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION ensure_single_default_profile();

-- Work Experiences Table
CREATE TABLE work_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES master_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  company_name VARCHAR(255) NOT NULL,
  position_title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,

  display_order INTEGER DEFAULT 0,

  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT current_has_no_end_date CHECK (NOT (is_current = true AND end_date IS NOT NULL))
);

CREATE INDEX idx_work_experiences_profile ON work_experiences(profile_id, display_order);

-- Achievements Table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID REFERENCES work_experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  description TEXT NOT NULL,
  metric_type VARCHAR(50) CHECK (metric_type IN ('percentage', 'time_reduction', 'revenue', 'count', 'other')),
  metric_value NUMERIC(15, 2),
  metric_unit VARCHAR(50),
  timeframe VARCHAR(100),

  display_order INTEGER DEFAULT 0
);

CREATE INDEX idx_achievements_experience ON achievements(experience_id, display_order);

-- Skills Table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES master_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  skill_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  proficiency_level VARCHAR(50) CHECK (proficiency_level IN ('Expert', 'Advanced', 'Intermediate', 'Beginner')),
  years_of_experience INTEGER CHECK (years_of_experience >= 0),

  display_order INTEGER DEFAULT 0,

  CONSTRAINT unique_skill_per_profile UNIQUE (profile_id, skill_name)
);

CREATE INDEX idx_skills_profile ON skills(profile_id, category, display_order);

-- Education Table
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES master_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  institution_name VARCHAR(255) NOT NULL,
  degree VARCHAR(255),
  field_of_study VARCHAR(255),
  start_year INTEGER CHECK (start_year >= 1900 AND start_year <= 2100),
  end_year INTEGER CHECK (end_year >= 1900 AND end_year <= 2100),

  display_order INTEGER DEFAULT 0,

  CONSTRAINT valid_year_range CHECK (end_year IS NULL OR end_year >= start_year)
);

CREATE INDEX idx_education_profile ON education(profile_id, display_order);

-- Certifications Table
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES master_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  certification_name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  credential_id VARCHAR(255),
  credential_url TEXT,

  display_order INTEGER DEFAULT 0,

  CONSTRAINT valid_certification_dates CHECK (expiry_date IS NULL OR expiry_date >= issue_date)
);

CREATE INDEX idx_certifications_profile ON certifications(profile_id, display_order);

-- Languages Table
CREATE TABLE languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES master_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  language_name VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(50) NOT NULL CHECK (proficiency_level IN ('Native', 'Professional', 'Conversational', 'Basic')),

  display_order INTEGER DEFAULT 0,

  CONSTRAINT unique_language_per_profile UNIQUE (profile_id, language_name)
);

CREATE INDEX idx_languages_profile ON languages(profile_id, display_order);

-- Profile Versions Table (Audit Trail)
CREATE TABLE profile_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES master_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  snapshot_data JSONB NOT NULL,
  change_summary TEXT,
  changed_by_user_id UUID REFERENCES auth.users(id),
  version_number INTEGER NOT NULL
);

CREATE INDEX idx_profile_versions_profile ON profile_versions(profile_id, version_number DESC);

-- Link jobs to specific profile version
ALTER TABLE jobs ADD COLUMN profile_version_id UUID REFERENCES profile_versions(id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_master_profiles_updated_at
BEFORE UPDATE ON master_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_work_experiences_updated_at
BEFORE UPDATE ON work_experiences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE master_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for master_profiles
CREATE POLICY "Users can view own profiles"
  ON master_profiles FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create own profiles"
  ON master_profiles FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
  ON master_profiles FOR UPDATE
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
  ON master_profiles FOR DELETE
  USING (user_id IS NULL OR auth.uid() = user_id);

-- RLS Policies for work_experiences
CREATE POLICY "Users can view own work experiences"
  ON work_experiences FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = work_experiences.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can create work experiences"
  ON work_experiences FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = work_experiences.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can update work experiences"
  ON work_experiences FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = work_experiences.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can delete work experiences"
  ON work_experiences FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = work_experiences.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

-- RLS Policies for achievements
CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM work_experiences we
    JOIN master_profiles p ON p.id = we.profile_id
    WHERE we.id = achievements.experience_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can create achievements"
  ON achievements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM work_experiences we
    JOIN master_profiles p ON p.id = we.profile_id
    WHERE we.id = achievements.experience_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can update achievements"
  ON achievements FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM work_experiences we
    JOIN master_profiles p ON p.id = we.profile_id
    WHERE we.id = achievements.experience_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can delete achievements"
  ON achievements FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM work_experiences we
    JOIN master_profiles p ON p.id = we.profile_id
    WHERE we.id = achievements.experience_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

-- RLS Policies for skills (simplified - direct relationship to profile)
CREATE POLICY "Users can view own skills"
  ON skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = skills.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can create skills"
  ON skills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = skills.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can update skills"
  ON skills FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = skills.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

CREATE POLICY "Users can delete skills"
  ON skills FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = skills.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

-- RLS Policies for education, certifications, languages (same pattern as skills)
-- Note: Patterns are identical - all child tables check profile ownership via EXISTS subquery

CREATE POLICY "Users can view own education"
  ON education FOR SELECT
  USING (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = education.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can create education"
  ON education FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = education.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can update education"
  ON education FOR UPDATE
  USING (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = education.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can delete education"
  ON education FOR DELETE
  USING (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = education.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can view own certifications"
  ON certifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = certifications.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can create certifications"
  ON certifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = certifications.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can update certifications"
  ON certifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = certifications.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can delete certifications"
  ON certifications FOR DELETE
  USING (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = certifications.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can view own languages"
  ON languages FOR SELECT
  USING (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = languages.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can create languages"
  ON languages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = languages.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can update languages"
  ON languages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = languages.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

CREATE POLICY "Users can delete languages"
  ON languages FOR DELETE
  USING (EXISTS (SELECT 1 FROM master_profiles p WHERE p.id = languages.profile_id AND (p.user_id IS NULL OR auth.uid() = p.user_id)));

-- RLS Policies for profile_versions
CREATE POLICY "Users can view own profile versions"
  ON profile_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM master_profiles p
    WHERE p.id = profile_versions.profile_id
    AND (p.user_id IS NULL OR auth.uid() = p.user_id)
  ));

-- Note: Only system can create/update/delete profile versions (via stored procedures)
-- Users cannot directly manipulate version history
```

### 8.2 TypeScript Types

```typescript
// Add to app/shared/types.ts

export interface MasterProfile {
  id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;

  // Identification
  profile_name: string;
  is_default: boolean;

  // Contact Information
  full_name: string;
  email: string;
  phone_primary?: string;
  phone_secondary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  location: string;

  // Professional Summary
  professional_summary: string;
  years_of_experience?: number;
  current_position?: string;

  // File Reference
  original_cv_file_path?: string;
  original_cv_filename?: string;
  original_cv_mime_type?: string;
  original_cv_size_bytes?: number;

  // Extraction Metadata
  extraction_confidence_score?: number;
  extraction_method?: 'ai' | 'manual' | 'imported';

  // Versioning
  version: number;
}

export interface WorkExperience {
  id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;

  company_name: string;
  position_title: string;
  location?: string;
  start_date: string; // ISO date string
  end_date?: string; // ISO date string
  is_current: boolean;
  description?: string;

  display_order: number;
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  experience_id: string;
  created_at: string;

  description: string;
  metric_type?: 'percentage' | 'time_reduction' | 'revenue' | 'count' | 'other';
  metric_value?: number;
  metric_unit?: string;
  timeframe?: string;

  display_order: number;
}

export interface Skill {
  id: string;
  profile_id: string;
  created_at: string;

  skill_name: string;
  category?: string;
  proficiency_level?: 'Expert' | 'Advanced' | 'Intermediate' | 'Beginner';
  years_of_experience?: number;

  display_order: number;
}

export interface Education {
  id: string;
  profile_id: string;
  created_at: string;

  institution_name: string;
  degree?: string;
  field_of_study?: string;
  start_year?: number;
  end_year?: number;

  display_order: number;
}

export interface Certification {
  id: string;
  profile_id: string;
  created_at: string;

  certification_name: string;
  issuing_organization?: string;
  issue_date?: string; // ISO date string
  expiry_date?: string; // ISO date string
  credential_id?: string;
  credential_url?: string;

  display_order: number;
}

export interface Language {
  id: string;
  profile_id: string;
  created_at: string;

  language_name: string;
  proficiency_level: 'Native' | 'Professional' | 'Conversational' | 'Basic';

  display_order: number;
}

export interface ProfileVersion {
  id: string;
  profile_id: string;
  created_at: string;

  snapshot_data: MasterProfileWithDetails;
  change_summary?: string;
  changed_by_user_id?: string;
  version_number: number;
}

// Extended type with all related data
export interface MasterProfileWithDetails extends MasterProfile {
  work_experiences?: WorkExperience[];
  skills?: Skill[];
  education?: Education[];
  certifications?: Certification[];
  languages?: Language[];
}

// CV Extraction Result
export interface CVExtractionResult {
  profile_data: Partial<MasterProfile>;
  work_experiences: Partial<WorkExperience>[];
  skills: Partial<Skill>[];
  education: Partial<Education>[];
  certifications: Partial<Certification>[];
  languages: Partial<Language>[];
  confidence_scores: Record<string, number>; // field_name -> confidence (0-1)
  warnings: string[]; // Extraction warnings
}

// API Request/Response Types
export interface UploadCVRequest {
  file: File;
  profile_name?: string; // Optional profile name
}

export interface UploadCVResponse {
  file_path: string;
  extraction_task_id: string;
  estimated_completion_seconds: number;
}

export interface GetExtractionResultRequest {
  task_id: string;
}

export interface GetExtractionResultResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: CVExtractionResult;
  error_message?: string;
  progress_percentage?: number;
}

export interface CreateMasterProfileRequest {
  profile: Omit<MasterProfile, 'id' | 'created_at' | 'updated_at' | 'version'>;
  work_experiences: Omit<WorkExperience, 'id' | 'profile_id' | 'created_at' | 'updated_at'>[];
  skills: Omit<Skill, 'id' | 'profile_id' | 'created_at'>[];
  education: Omit<Education, 'id' | 'profile_id' | 'created_at'>[];
  certifications: Omit<Certification, 'id' | 'profile_id' | 'created_at'>[];
  languages: Omit<Language, 'id' | 'profile_id' | 'created_at'>[];
}

export interface CreateMasterProfileResponse {
  profile: MasterProfileWithDetails;
  version_id: string;
}

export interface UpdateMasterProfileRequest extends CreateMasterProfileRequest {
  profile_id: string;
  change_summary?: string;
}

export interface UpdateMasterProfileResponse extends CreateMasterProfileResponse {}

export interface ListProfilesResponse {
  profiles: MasterProfileWithDetails[];
  default_profile_id?: string;
}

export interface DeleteProfileRequest {
  profile_id: string;
}

export interface SetDefaultProfileRequest {
  profile_id: string;
}

// Task types for processing queue
export type ProfileTaskType =
  | 'extract_cv'
  | 'validate_profile'
  | 'create_profile_version';

// Extend existing ProcessingQueueTask
declare module './types' {
  interface ProcessingQueueTask {
    task_type: TaskType | ProfileTaskType;
  }
}
```

### 8.3 API Endpoints

#### POST /api/profiles/upload-cv

**Description:** Upload CV file and initiate extraction

**Request:**
```typescript
Content-Type: multipart/form-data

{
  file: File, // PDF, DOCX, TXT
  profile_name?: string
}
```

**Response:**
```typescript
{
  file_path: string, // Supabase Storage path
  extraction_task_id: string,
  estimated_completion_seconds: number
}
```

**Status Codes:**
- 200: Upload successful
- 400: Invalid file format or size
- 413: File too large
- 500: Server error

#### GET /api/profiles/extraction/{task_id}

**Description:** Check extraction status and get results

**Response:**
```typescript
{
  status: 'pending' | 'processing' | 'completed' | 'failed',
  result?: CVExtractionResult,
  error_message?: string,
  progress_percentage?: number
}
```

**Status Codes:**
- 200: Task found
- 404: Task not found
- 500: Server error

#### POST /api/profiles

**Description:** Create new master profile

**Request:**
```typescript
{
  profile: {...},
  work_experiences: [...],
  skills: [...],
  education: [...],
  certifications: [...],
  languages: [...]
}
```

**Response:**
```typescript
{
  profile: MasterProfileWithDetails,
  version_id: string
}
```

**Status Codes:**
- 201: Profile created
- 400: Validation error
- 409: Profile name already exists
- 500: Server error

#### GET /api/profiles

**Description:** List all user's profiles

**Response:**
```typescript
{
  profiles: MasterProfileWithDetails[],
  default_profile_id?: string
}
```

**Status Codes:**
- 200: Success
- 500: Server error

#### GET /api/profiles/{profile_id}

**Description:** Get specific profile with all details

**Response:**
```typescript
MasterProfileWithDetails
```

**Status Codes:**
- 200: Success
- 404: Profile not found
- 403: Unauthorized
- 500: Server error

#### PUT /api/profiles/{profile_id}

**Description:** Update existing profile

**Request:**
```typescript
{
  profile: {...},
  work_experiences: [...],
  skills: [...],
  education: [...],
  certifications: [...],
  languages: [...],
  change_summary?: string
}
```

**Response:**
```typescript
{
  profile: MasterProfileWithDetails,
  version_id: string
}
```

**Status Codes:**
- 200: Profile updated
- 400: Validation error
- 404: Profile not found
- 403: Unauthorized
- 500: Server error

#### DELETE /api/profiles/{profile_id}

**Description:** Delete profile (soft delete if has related jobs)

**Response:**
```typescript
{
  success: boolean,
  message: string
}
```

**Status Codes:**
- 200: Profile deleted
- 404: Profile not found
- 403: Unauthorized
- 409: Cannot delete (has related jobs)
- 500: Server error

#### POST /api/profiles/{profile_id}/set-default

**Description:** Set profile as default

**Response:**
```typescript
{
  success: boolean,
  profile_id: string
}
```

**Status Codes:**
- 200: Default set
- 404: Profile not found
- 403: Unauthorized
- 500: Server error

#### POST /api/profiles/{profile_id}/duplicate

**Description:** Duplicate profile with new name

**Request:**
```typescript
{
  new_profile_name: string
}
```

**Response:**
```typescript
{
  profile: MasterProfileWithDetails
}
```

**Status Codes:**
- 201: Profile duplicated
- 400: Invalid name
- 404: Profile not found
- 409: Name already exists
- 500: Server error

### 8.4 Worker Tasks

#### Task: extract_cv

**Description:** Extract profile information from uploaded CV using Claude API

**Input:**
```typescript
{
  file_path: string,
  file_type: 'pdf' | 'docx' | 'txt',
  user_id: string
}
```

**Process:**
1. Download file from Supabase Storage
2. Convert to text (PDF/DOCX parsing)
3. Call Claude API with extraction prompt
4. Parse AI response into structured data
5. Calculate confidence scores per field
6. Save to extraction_results table

**Output:**
```typescript
CVExtractionResult
```

**Error Handling:**
- File not found → Retry once, then fail
- Parsing error → Fallback to simpler extraction
- AI timeout → Retry with shorter context
- Max retries: 3

**Performance:**
- Target: < 30 seconds
- Timeout: 60 seconds

---

## 9. Implementation Phases (Revised)

**⚠️ MAJOR REVISION:** Original plan was 11 weeks with complex features. After technical review by architect, backend specialist, and frontend specialist, scope reduced to **2-week MVP** (Phase 1 only).

### Phase 1: MVP (Week 1-2) - 15-20 hours

**Goal:** Database-backed profile with web UI, maintain backward compatibility

**Features (Must-Have):**
- ✅ Database schema with RLS security
- ✅ Single-page profile form (NOT multi-step wizard)
- ✅ Create profile manually
- ✅ Edit profile with optimistic locking
- ✅ View profile
- ✅ Delete profile (soft delete)
- ✅ Auto-save to localStorage
- ✅ Import from markdown (migration script)
- ✅ Export to markdown (backward compatibility)
- ✅ Basic validation (Zod + database constraints)
- ✅ WCAG 2.1 AA accessibility

**Technical Implementation:**
- PostgreSQL RPC functions for atomic transactions (CB-1 fix)
- Session-based pre-auth security (CB-9 fix)
- Soft deletes with recovery (CB-3 fix)
- Optimistic locking triggers (CB-2 fix)
- Performance indexes for RLS queries

**Deliverables:**
- 3 database migrations (004, 005, 006)
- Pinia store with optimistic UI
- ProfileForm.vue (single-page)
- Migration script (Python)
- Markdown export RPC function

**Success Criteria:**
- ✅ User can create profile in ≤ 5 minutes
- ✅ User can edit profile in ≤ 2 minutes
- ✅ Zero CV generation errors (markdown export works)
- ✅ 100% migration success (no data loss)
- ✅ WCAG 2.1 AA compliance (axe DevTools passes)
- ✅ All 4 critical blockers resolved

**Decision Point:**
After Phase 1 completion, evaluate:
- Is web UI faster than markdown editing?
- Are there any critical missing features?
- Should we proceed to Phase 2 or stop here?

---

### Phase 2: Enhanced Features (Optional - Week 3-4)

**Status:** ⏳ **DEFERRED** - Only proceed if Phase 1 proves insufficient

**Potential Features:**
- Multiple profiles per user
- Profile duplication / templates
- Enhanced skill autocomplete
- Profile comparison view
- Additional tables: education, certifications, languages, achievements

**Decision Criteria to Proceed:**
- Phase 1 used for 1+ month
- User actively requests multiple profiles
- Clear pain points identified that require Phase 2 features

---

### Phase 3: AI CV Extraction (Optional - Week 5-6)

**Status:** ⏳ **DEFERRED** - Nice-to-have, not critical for MVP

**Features:**
- CV file upload (PDF, DOCX)
- Client-side AI extraction with Anthropic API
- Pre-filled form with confidence scoring
- User review and correction

**Decision Criteria to Proceed:**
- Profile creation time still >5 minutes after Phase 1
- Multiple new profiles needed frequently
- Clear ROI for 10-15 hours development effort

---

### ❌ Removed from Original Plan

**Multi-step wizard** → Single-page form is faster and better UX
**Profile versioning/history** → Git already provides this
**Analytics dashboard** → Premature for solo user
**A/B testing insights** → Requires scale we don't have

---

## 10. Dependencies & Risks (Revised)

### 10.1 External Dependencies

| Dependency | Purpose | Risk | Mitigation |
|------------|---------|------|------------|
| Supabase Database | Data persistence | Database downtime | Regular backups, markdown export as fallback |
| Supabase Storage | CV uploads (Phase 3) | Storage limits | Deferred to Phase 3, not in MVP |
| ~~Anthropic Claude API~~ | ~~CV extraction~~ | ~~Deferred to Phase 3~~ | N/A for MVP |
| ~~Cloudflare Workers~~ | ~~Background processing~~ | ~~Not needed for MVP~~ | N/A - RPC functions handle transactions |

### 10.2 Technical Risks (Revised)

| Risk | Probability | Impact | Mitigation Strategy | Status |
|------|-------------|--------|---------------------|--------|
| Transaction integrity failures | High | High | Implement RPC functions with atomic transactions | ✅ Mitigated in migration 004 |
| RLS security vulnerabilities | High | High | Session-based pre-auth, comprehensive testing | ✅ Mitigated in migration 005 |
| Optimistic locking conflicts | Medium | Medium | Version checking with conflict resolution UI | ✅ Mitigated in migration 005 |
| Accidental data deletion | Medium | High | Soft deletes with 30-day recovery window | ✅ Mitigated in migration 005 |
| Database performance issues | Low | Medium | Performance indexes, query optimization | ✅ Mitigated in migration 006 |
| Migration failures | Medium | High | Dry-run mode, validation, rollback strategy | ✅ Documented in ImplementationPlan.md |
| Backward compatibility breaks | Medium | High | Markdown export function, comprehensive testing | ✅ Mitigated in migration 006 |

### 10.3 Product Risks (Revised)

| Risk | Probability | Impact | Mitigation Strategy | Status |
|------|-------------|--------|---------------------|--------|
| User continues using markdown | Medium | High | Make web UI strictly faster + zero errors | 🟡 Monitor after Phase 1 |
| Feature abandonment (multiple profiles) | Medium | Low | Deferred to Phase 2, build only if needed | ✅ Descoped from MVP |
| MVP scope too large | Low | Medium | Reduced to 15-20 hours from 40-55 hours | ✅ Rescoped |
| Job search completes before MVP ships | Low | High | Ship MVP in 2 weeks, not 11 weeks | ✅ Accelerated timeline |
| Solo developer burnout | Medium | High | Clear sprint boundaries, 20% buffer | 🟡 Managed with realistic estimates |

### 10.4 New Risks Identified in Technical Review

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Form complexity overwhelming | Low | Medium | Single-page with collapsible sections, not wizard |
| localStorage quota exceeded | Low | Low | Graceful degradation, show warning |
| Multi-tab editing conflicts | Medium | Low | Warning message, last write wins |
| RLS policy performance | Low | Medium | Composite indexes for EXISTS subqueries |

---

## 11. Out of Scope

The following features are explicitly **NOT** included in this release:

### 11.1 Social Features
- ❌ Profile sharing with other users
- ❌ Public profile URLs
- ❌ Profile templates marketplace
- ❌ Collaborative profile editing

### 11.2 Advanced AI Features
- ❌ AI-powered profile optimization suggestions (beyond extraction)
- ❌ AI-written professional summary generation
- ❌ Skill gap analysis
- ❌ Salary recommendations

### 11.3 Integration Features
- ❌ LinkedIn import (beyond CV upload)
- ❌ Automatic sync with LinkedIn
- ❌ Import from job board profiles
- ❌ Export to LinkedIn

### 11.4 Advanced Document Features
- ❌ Resume builder with visual templates
- ❌ Cover letter builder (separate from profile)
- ❌ Portfolio page builder
- ❌ Video introduction recording

### 11.5 Other
- ❌ Mobile native apps
- ❌ Offline mode
- ❌ Multi-language support (beyond profile content)
- ❌ Team/company accounts

**Note:** These may be considered for future releases based on user feedback and demand.

---

## 12. Technical Review Outcomes (New Section)

### 12.1 Critical Decisions from Technical Review

**Technical Review Date:** October 5, 2025
**Participants:** Architect, Backend Specialist (Foreman), Frontend Specialist (Chase), Product Owner, Product Manager

**Key Consensus Decisions:**

1. **Architecture Pattern:** ✅ Direct Supabase Client (APPROVED)
   - Frontend calls Supabase RPC functions directly
   - No worker API layer needed for MVP
   - RLS policies enforce security
   - Supports up to 1,000 users without changes

2. **Transaction Safety:** ✅ PostgreSQL RPC Functions (REQUIRED)
   - All mutations use stored procedures for atomic transactions
   - Fixes CB-1 (Transaction Integrity)
   - Single network request, automatic rollback on error

3. **Form Design:** ✅ Single-Page Form (NOT Multi-Step Wizard)
   - 30-40 fields manageable with collapsible sections
   - Faster development, better editing UX
   - Simpler state management

4. **Security:** ✅ Session-Based Pre-Auth (REQUIRED)
   - Fixes CB-9 (NULL user_id security hole)
   - Session ID stored in localStorage
   - Transfer ownership on login via `claim_profile()` RPC

5. **Data Deletion:** ✅ Soft Deletes Only (REQUIRED)
   - Fixes CB-3 (CASCADE DELETE risk)
   - 30-day recovery window
   - Prevents accidental data loss

6. **Auto-Save:** ✅ localStorage (NOT Database)
   - 30-second debounced save
   - No network calls for drafts
   - Restore on page reload

### 12.2 Critical Blockers Identified

**Must Fix Before MVP Launch:**

| ID | Blocker | Impact | Status |
|----|---------|--------|--------|
| CB-1 | Transaction Integrity | Data corruption | ✅ Fixed in migration 004 |
| CB-2 | Optimistic Locking | Concurrent edit data loss | ✅ Fixed in migration 005 |
| CB-3 | CASCADE DELETE Risk | Permanent data loss | ✅ Fixed in migration 005 |
| CB-9 | RLS Security Hole (NULL user_id) | Privacy violation | ✅ Fixed in migration 005 |

**Total Effort to Fix Blockers:** 15 hours

### 12.3 Descoped Features

**Removed from MVP:**
- ❌ Multi-step wizard (single-page is better UX)
- ❌ Multiple profiles (deferred to Phase 2)
- ❌ CV upload + AI extraction (deferred to Phase 3)
- ❌ Profile versioning/history (git handles this)
- ❌ Analytics dashboard (premature for solo user)
- ❌ Advanced validation (basic validation sufficient)

**Reasoning:** Focus on core value - fast, error-free profile editing

### 12.4 Architectural Decisions

**Database:**
- ✅ Normalized schema (3NF)
- ✅ RLS for security
- ✅ RPC functions for complex operations
- ✅ Soft deletes for user data
- ✅ Performance indexes for RLS queries
- ✅ Optimistic locking with version field

**Frontend:**
- ✅ Vue 3 Composition API
- ✅ Pinia for state management
- ✅ Zod + VeeValidate for validation
- ✅ Optimistic UI with rollback pattern
- ✅ Direct Supabase client (no API layer)
- ✅ Error translation layer for UX

**Migration:**
- ✅ Python script for one-time markdown import
- ✅ RPC function for markdown export
- ✅ Dry-run mode with validation
- ✅ Rollback strategy documented

---

## 13. Success Criteria & Go/No-Go Gates (New Section)

### 13.1 MVP Launch Criteria

**Go/No-Go Decision Point: End of Sprint 2**

**GO if ALL criteria met:**
- ✅ User can create profile in ≤ 5 minutes
- ✅ User can edit profile in ≤ 2 minutes
- ✅ Zero database errors in manual testing
- ✅ RLS policies prevent unauthorized access (tested)
- ✅ Markdown export matches current format (validated)
- ✅ Migration script tested successfully (no data loss)
- ✅ WCAG 2.1 AA compliance (axe DevTools passes)
- ✅ All 4 critical blockers resolved

**NO-GO if ANY criteria failed:**
- ❌ Profile creation slower than 5 minutes
- ❌ Data integrity issues in testing
- ❌ Security vulnerabilities found
- ❌ Markdown export breaks CV generation

**No-Go Action Plan:**
1. Extend Sprint 2 by 1 week
2. Fix critical issues
3. Re-evaluate scope (descope further if needed)
4. Reassess timeline

### 13.2 Phase 2 Decision Criteria

**Evaluate after 1 month of Phase 1 usage**

**Proceed to Phase 2 if:**
- ✅ Web UI used for 10+ applications
- ✅ Faster than markdown editing (validated)
- ✅ Zero CV generation errors
- ✅ User actively wants multiple profiles
- ✅ Clear pain points requiring Phase 2 features

**Skip Phase 2 if:**
- ❌ Still using markdown for important applications
- ❌ No clear need for multiple profiles
- ❌ Phase 1 meets all needs

### 13.3 Success Measurement Post-Launch

**Weekly Check-ins (First Month):**
1. Applications submitted using web UI: ___
2. Time spent editing profile: ___ minutes
3. CV generation errors: ___
4. Bugs encountered: ___
5. Faster than markdown? Yes / No

**Monthly Review (Months 2-3):**
1. Total applications submitted: ___
2. Interview callback rate: ___%
3. Time saved vs markdown: ___ hours
4. Tool ROI: (Hours saved × $hourly_rate) - Development cost
5. Next feature priority: ___

---

## 14. Decisions Made (Previously Open Questions)

### 14.1 Product Decisions (Updated)

1. **Q:** Should we support profile import from LinkedIn HTML export?
   **Decision:** ❌ Out of Scope for all phases
   **Rationale:** LinkedIn export format is inconsistent. Markdown import is sufficient.

2. **Q:** What's the maximum number of profiles per user?
   **Decision:** ⏳ Deferred to Phase 2
   **Rationale:** MVP supports 1 profile only. Multiple profiles added later if needed.

3. **Q:** Should profiles be soft-deleted or hard-deleted?
   **Decision:** ✅ Soft delete only
   **Rationale:** Prevents accidental data loss, enables recovery, maintains audit trail.
   **Implementation:** ✅ Implemented in migration 005

4. **Q:** Single-page form vs multi-step wizard?
   **Decision:** ✅ Single-page form with collapsible sections
   **Rationale:** Technical review consensus - faster development, better UX for editing
   **Change:** Original plan had multi-step wizard → REJECTED

### 14.2 Technical Decisions (Updated)

1. **Q:** Should we use direct Supabase client or worker API?
   **Decision:** ✅ Direct Supabase client with RPC functions
   **Rationale:** Simpler, lower latency, sufficient for scale (solo → 1,000 users)

2. **Q:** How to ensure transaction integrity?
   **Decision:** ✅ PostgreSQL stored procedures (RPC functions)
   **Rationale:** Atomic transactions, automatic rollback, single network request
   **Implementation:** ✅ Implemented in migration 004

3. **Q:** How to handle pre-auth profile creation?
   **Decision:** ✅ Session-based ownership with `session_id` column
   **Rationale:** Fixes security hole, enables pre-auth workflows
   **Implementation:** ✅ Implemented in migration 005

4. **Q:** Should we implement auto-save to database or localStorage?
   **Decision:** ✅ localStorage only (NOT database)
   **Rationale:** No network calls, instant save, survives page refresh
   **Implementation:** Documented in FrontendGuide.md

5. **Q:** When to build AI CV extraction?
   **Decision:** ⏳ Deferred to Phase 3 (optional)
   **Rationale:** MVP focuses on manual entry first, validate need before building AI

---

## 13. Appendix

### 13.1 Skill Categories (Predefined List)

```typescript
export const SKILL_CATEGORIES = [
  'Frontend Frameworks & Libraries',
  'Programming Languages',
  'Styling & CSS',
  'Backend & APIs',
  'Build Tools & DevOps',
  'Testing & Documentation',
  'Version Control & Collaboration',
  'Search & Database',
  'CMS',
  'Performance & Optimization',
  'Design Tools',
  'Leadership & Management',
  'Professional Skills',
  'Languages'
] as const;
```

### 13.2 Common Skills Database (Sample)

```typescript
export const COMMON_SKILLS = {
  'Frontend Frameworks & Libraries': [
    'React.js', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js',
    'Redux', 'Pinia', 'MobX', 'React Query', 'SWR'
  ],
  'Programming Languages': [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust',
    'PHP', 'Ruby', 'Swift', 'Kotlin'
  ],
  // ... other categories
};
```

### 13.3 Sample AI Extraction Prompt

```
You are a CV extraction expert. Extract structured information from the provided CV text.

Output JSON in this exact format:
{
  "profile_data": {
    "full_name": "string",
    "email": "string",
    "phone_primary": "string",
    "location": "string",
    "professional_summary": "string (100-500 words)",
    "years_of_experience": number,
    "current_position": "string"
  },
  "work_experiences": [
    {
      "company_name": "string",
      "position_title": "string",
      "location": "string",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD or null if current",
      "is_current": boolean,
      "description": "string",
      "achievements": [
        {
          "description": "string",
          "metric_value": number or null,
          "metric_unit": "string like %, users, ms",
          "timeframe": "string like Q3 2023"
        }
      ]
    }
  ],
  "skills": [
    {
      "skill_name": "string",
      "category": "string (from predefined categories)",
      "proficiency_level": "Expert|Advanced|Intermediate|Beginner",
      "years_of_experience": number or null
    }
  ],
  "education": [...],
  "certifications": [...],
  "languages": [...],
  "confidence_scores": {
    "full_name": 0.95,
    "email": 0.98,
    // ... confidence for each extracted field (0-1)
  }
}

CV Text:
"""
{cv_text}
"""
```

### 13.4 Validation Rules Reference

| Field | Min | Max | Pattern | Required |
|-------|-----|-----|---------|----------|
| profile_name | 1 | 255 | - | Yes |
| full_name | 1 | 255 | - | Yes |
| email | 5 | 255 | RFC 5322 | Yes |
| phone | 7 | 50 | E.164 | No |
| professional_summary | 100 | 2000 | - | Yes |
| company_name | 1 | 255 | - | Yes |
| position_title | 1 | 255 | - | Yes |
| skill_name | 1 | 255 | - | Yes |

### 13.5 File Upload Limits

| Property | Limit | Reason |
|----------|-------|--------|
| Max file size | 5MB | Reasonable for CVs, prevents abuse |
| Allowed formats | PDF, DOCX, TXT | Most common formats |
| Max filename length | 255 chars | Database constraint |
| Storage retention | Until profile deleted | User convenience |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 5, 2025 | Product Team | Initial draft |
| 2.0 | Oct 5, 2025 | Technical Review Team | Major revision after architect, backend, frontend specialist reviews. MVP descoped to 15-20 hours. Added Technical Review Outcomes section. Updated success metrics. |

---

**Approval Signatures:**

- **Product Owner:** ✅ Approved (with modifications) | Date: Oct 5, 2025
- **Product Manager:** ✅ Approved (strategic modifications) | Date: Oct 5, 2025
- **Architect:** ✅ Approved (Grade B+, conditions met) | Date: Oct 5, 2025
- **Backend Specialist:** ✅ Approved (critical fixes implemented) | Date: Oct 5, 2025
- **Frontend Specialist:** ✅ Approved (single-page pattern) | Date: Oct 5, 2025

---

**Next Steps (Updated):**

1. ✅ Review PRD with stakeholders - COMPLETE
2. ✅ Technical review (Architect, Backend, Frontend) - COMPLETE
3. ✅ Critical blocker fixes documented - COMPLETE
4. ✅ Database migrations created (004, 005, 006) - READY
5. ✅ Frontend implementation guide created - READY
6. ✅ User stories rewritten with DoR/DoD - READY
7. ⏳ Sprint 1 kickoff (Start: Week 1, Monday)
8. ⏳ Database deployment (Sprint 1, Day 1-2)
9. ⏳ Frontend development (Sprint 1-2, Day 3-10)
10. ⏳ MVP launch decision (End of Sprint 2)

---

## Related Documents

- **User Stories:** [UserStories.md](./UserStories.md) - Sprint-ready stories with DoR/DoD
- **Implementation Plan:** [ImplementationPlan.md](./ImplementationPlan.md) - MVP-focused 2-week plan
- **Technical Discussion:** [TechnicalDiscussion.md](./TechnicalDiscussion.md) - Synthesis of technical reviews
- **Frontend Guide:** [FrontendGuide.md](./FrontendGuide.md) - Vue 3 implementation patterns
- **Database Migrations:**
  - [004_profile_transactions.sql](../../supabase/migrations/004_profile_transactions.sql)
  - [005_security_locking.sql](../../supabase/migrations/005_security_locking.sql)
  - [006_indexes_export.sql](../../supabase/migrations/006_indexes_export.sql)
