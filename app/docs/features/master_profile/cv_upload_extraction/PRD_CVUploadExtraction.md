# Product Requirements Document (PRD)
# CV Upload & Extraction Feature

**Version:** 1.0
**Status:** 📋 Documented - **DEFERRED TO PHASE 3**
**Last Updated:** October 6, 2025
**Owner:** Product Team
**Contributors:** Product Owner, Product Manager, Software Architect

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Context & Background](#2-context--background)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Stories & Personas](#4-user-stories--personas)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Go/No-Go Decision Framework](#7-gono-go-decision-framework)
8. [Implementation Phasing](#8-implementation-phasing)
9. [Risk Assessment](#9-risk-assessment)
10. [Out of Scope](#10-out-of-scope)

---

## 1. Executive Summary

### 1.1 Problem Statement

**Current Pain Point:**
Creating a master profile requires manually entering all professional information, which takes ~30 minutes. Users already have this data in their CV but must retype everything into web forms.

**User Mental Model:**
*"I already have a CV → Why am I retyping this?"*
This creates friction at the worst moment: when users are evaluating whether to invest in the system.

### 1.2 Proposed Solution

**Feature:** CV Upload with AI-Powered Extraction

Allow users to upload their existing CV (PDF/DOCX), automatically extract profile data using AI (Claude 3.5 Sonnet), and pre-populate the profile form for review and submission.

**User Flow:**
```
Current: Click "Create Profile" → 30 min manual entry → Submit
Proposed: Click "Create Profile" → Upload CV → 5 min review/edit → Submit
```

### 1.3 Strategic Positioning

**This is NOT a time-saver feature.**
**This is an activation barrier reducer.**

- Solo user saves 20 minutes **one time** (minimal ROI)
- Real value: Lowers "getting started" friction
- Strategic value: Foundation for future AI features (job matching, profile analysis)
- Psychological value: Transforms from "data entry tool" to "data enhancement platform"

### 1.4 Key Recommendation

**DEFER TO PHASE 3** - Build ONLY after:
1. ✅ Master profile MVP launched and validated
2. ✅ Users actively creating profiles
3. ✅ Clear demand demonstrated through user feedback
4. ✅ P0 blockers resolved (transaction integrity, optimistic locking, etc.) ← **COMPLETE**

**Why Defer:**
- 30-35 hours complexity vs 15-20 hours for entire master profile MVP
- Uncertain ROI for solo user (20 min savings vs weeks of dev)
- Should validate core workflow before adding AI complexity

---

## 2. Context & Background

### 2.1 Current System

**File-Based Workflow:**
```
01_Profile/master_profile.md (manually edited)
        ↓
AI agents read for CV generation
```

**Problems:**
- 30-minute manual entry time
- Risk of typos breaking AI generation
- Single profile limitation
- No version control or audit trail

### 2.2 Target System (After Master Profile MVP)

**Database-Driven Workflow:**
```
User → Web Form → Supabase Database → AI Agents
```

**This Feature Adds:**
```
User → Upload CV → AI Extraction → Pre-filled Web Form → Database
```

### 2.3 User Context

**Primary User:** Frontend Engineer, 8+ years experience, actively job searching

**Current Behavior:**
- Has existing CV in PDF/DOCX format
- Applying to 10-15 jobs per month
- Wants to customize profile for different job types (Frontend vs Full-Stack vs Leadership)

**Pain Points:**
- "I already have this information in my CV"
- "Why do I need to type everything again?"
- "What if I make a typo and break the CV generation?"

---

## 3. Goals & Success Metrics

### 3.1 Primary Goal

**Reduce activation barrier** for profile creation (not time savings!)

**Success Metric:** 60%+ of users choose "Upload CV" over "Manual Entry" within 2 weeks of feature launch

### 3.2 Secondary Goals

1. **Validate AI extraction feasibility** for future features
2. **Enable rapid profile variation creation** (specialized profiles per job type)
3. **Improve data accuracy** through AI parsing vs manual typing

### 3.3 Success Metrics (If Built)

**Leading Indicators (Week 1-2):**

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Upload adoption rate | 0% | >60% | % choosing upload vs manual |
| Upload success rate | N/A | >95% | % uploads without errors |
| Extraction accuracy | N/A | >85% | % fields correctly extracted |
| Time to completion | 30 min | <10 min | Time from upload to save |

**Lagging Indicators (Month 1-3):**

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| User satisfaction | N/A | >4/5 | "How helpful was CV upload?" |
| Profile quality | N/A | 100% | Uploaded = manual completeness |
| Feature stickiness | N/A | >60% | % repeat usage for new profiles |
| Cost efficiency | N/A | <$0.15 | Cost per successful extraction |

**Abandon Signals (Kill Feature If):**
- Upload → extraction → delete → manual entry >50% of time
- Average time via upload >15 minutes (worse than manual)
- Bug/support volume > value delivered
- AI costs >$200/month without user growth

### 3.4 Anti-Goals (What We're NOT Solving)

- ❌ Making profile creation "instant" (review still required)
- ❌ Replacing LinkedIn (not building social network)
- ❌ Perfect AI accuracy (85% is acceptable)
- ❌ Supporting all file formats (PDF/DOCX only for MVP)

---

## 4. User Stories & Personas

### 4.1 Primary Persona

**Name:** Alex Chen
**Role:** Senior Frontend Engineer
**Age:** 32
**Location:** Bangkok, Thailand
**Experience:** 8+ years
**Tech Stack:** React, TypeScript, GraphQL, Vue.js
**Job Search Status:** Actively seeking (10-15 applications/month)

**Current CV:**
- Format: PDF (Canva-designed, 2 pages)
- Last updated: 2 months ago
- Contains: 7 work experiences, 40+ skills, 2 degrees

**Goals:**
- Apply to jobs faster (currently takes 2 hours per customized application)
- Create profile variations (IC track vs management track)
- Ensure CV data is accurate and consistent

**Pain Points:**
- "I spent hours perfecting my CV, now I have to retype it?"
- "What if I miss a skill or achievement during manual entry?"
- "I want to experiment with different profile versions"

**How CV Upload Helps:**
- Kickstarts profile creation in 5 minutes vs 30 minutes
- Ensures all CV data is captured
- Makes creating profile variations trivial

### 4.2 Core User Stories

**Story 1:** Quick Profile Creation
*As Alex, I want to upload my CV and have the form pre-filled, so I can start applying to jobs within 10 minutes.*

**Story 2:** Data Accuracy
*As Alex, I want the AI to capture all my work experience and skills, so I don't miss anything important during manual entry.*

**Story 3:** Edit Before Commit
*As Alex, I want to review and edit extracted data before saving, so I can correct any AI errors or customize for this profile version.*

**Story 4:** Profile Variations
*As Alex, I want to upload my CV once and create multiple profile variants (Frontend, Full-Stack, Leadership), so I can target different job types.*

**Story 5:** Fallback to Manual
*As Alex, if CV upload fails or extraction is poor quality, I want to easily switch to manual entry, so I'm not blocked from creating a profile.*

---

## 5. Functional Requirements

### 5.1 Core Features (Must-Have - Phase 3)

#### F-1: File Upload Interface

**Description:** Modal-based file upload with validation

**Requirements:**

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| F-1.1 | Modal selection on "Create Profile" | P0 | Modal shows "Upload CV" and "Manual Entry" options |
| F-1.2 | PDF file support | P0 | PDF files up to 10MB accepted |
| F-1.3 | DOCX file support | P0 | DOCX files up to 10MB accepted |
| F-1.4 | Drag-and-drop upload | P1 | Users can drag files to upload area |
| F-1.5 | Upload progress bar | P0 | Show % progress during file upload |
| F-1.6 | File validation | P0 | Reject unsupported formats with clear error |
| F-1.7 | Error handling | P0 | Network errors show retry option |

**User Flow:**
```
1. User clicks "Create New Profile"
2. Modal appears: "How would you like to create your profile?"
3. Option A: "Upload CV" → Shows file picker
4. Option B: "Manual Entry" → Navigate to blank form
5. If Upload chosen:
   - File picker opens
   - User selects CV file
   - Client validates file type/size
   - Upload begins with progress bar
   - File uploaded to Supabase Storage
```

#### F-2: AI Data Extraction

**Description:** Extract structured data from CV using Claude API

**Requirements:**

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| F-2.1 | Extract personal info | P0 | Name, email, phone, location extracted |
| F-2.2 | Extract work experience | P0 | Company, title, dates, description extracted |
| F-2.3 | Extract skills | P0 | Technical skills identified and categorized |
| F-2.4 | Extract education | P1 | Degree, institution, dates extracted |
| F-2.5 | Confidence scoring | P1 | Each field has confidence score (0-1) |
| F-2.6 | Extraction timeout handling | P0 | Timeout after 60 seconds with error message |
| F-2.7 | Retry on failure | P0 | Auto-retry failed extractions (max 3 attempts) |

**Extraction Time:** <30 seconds (95th percentile)
**Accuracy Target:** >85% for structured fields (name, email, dates)

#### F-3: Form Pre-population

**Description:** Display extracted data in ProfileForm for review

**Requirements:**

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| F-3.1 | Pre-fill all form fields | P0 | All extracted data visible in form |
| F-3.2 | "Extracted from CV" indicator | P1 | Badge shows data source |
| F-3.3 | Confidence score display | P1 | Low confidence fields highlighted (yellow) |
| F-3.4 | All fields editable | P0 | User can modify any field before save |
| F-3.5 | Discard extracted data option | P1 | "Start Over" button clears and goes to manual |
| F-3.6 | Validation same as manual | P0 | Same validation rules apply |

**User Flow:**
```
1. After extraction completes:
2. ProfileForm loads with extracted data
3. Low confidence fields highlighted in yellow
4. "Extracted from CV" badge shown at top
5. User reviews and edits as needed
6. Clicks "Save Profile" (normal flow)
```

#### F-4: Error Handling & Fallback

**Description:** Graceful degradation when extraction fails

**Requirements:**

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| F-4.1 | Extraction failure message | P0 | Clear error: "Couldn't parse CV automatically" |
| F-4.2 | Manual entry fallback | P0 | "Enter Manually" button shown on failure |
| F-4.3 | Partial extraction handling | P1 | Show what was extracted + manual for rest |
| F-4.4 | Retry option | P0 | User can retry extraction once |

**Error States:**
- File upload failed (network error)
- File format unsupported
- AI extraction failed (timeout, API error)
- Extraction confidence too low (<50%)

---

### 5.2 Phase 3 Implementation Breakdown

**Phase 3.1: File Upload Only** (8 hours)
- Upload UI + validation
- Storage integration
- NO AI extraction yet
- **Decision Point:** Is upload workflow valuable?

**Phase 3.2: Manual Reference** (4 hours)
- "View CV" link while filling form
- User manually copies data
- Track usage metrics
- **Decision Point:** Do users want auto-extraction?

**Phase 3.3: AI Extraction** (18 hours)
- Claude API integration
- Extraction logic
- Form pre-population
- **Decision Point:** Launch or iterate?

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| File upload (10MB) | <5 seconds | 99th percentile |
| AI extraction | <30 seconds | 95th percentile |
| Form load (pre-filled) | <1 second | Lighthouse |
| Total (upload → form) | <40 seconds | End-to-end timing |

### 6.2 Security

| Requirement | Implementation |
|-------------|----------------|
| File upload validation | MIME type + magic number check |
| API key protection | Supabase Edge Function secrets |
| RLS policies | Users can only access own uploads |
| Data retention | Delete CVs after 30 days |
| Rate limiting | 5 uploads per user per hour |

### 6.3 Scalability

| Requirement | Target |
|-------------|--------|
| Concurrent uploads | Support 10 simultaneous |
| Database records | Handle 10,000+ CV uploads |
| Storage capacity | Support 50GB+ of files |
| API rate limit | Claude API: 50 req/min (Build tier) |

### 6.4 Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All upload actions keyboard-accessible |
| Screen reader | ARIA labels for file input and status |
| Color contrast | 4.5:1 minimum for all text |
| Error messages | Clear, associated with form fields |
| Focus indicators | Visible focus states |

### 6.5 Cost Constraints

| Component | Cost | Mitigation |
|-----------|------|------------|
| AI API (Claude) | ~$0.02-0.05 per CV | Rate limiting + caching |
| Supabase Storage | ~$0.021/GB/month | 30-day deletion policy |
| **Total at scale** | **~$150/month** (1,000 users) | Budget alerts at $50/month |

**Solo User Cost:** ~$0.10/year (negligible)

---

## 7. Go/No-Go Decision Framework

### 7.1 Build This Feature If:

✅ **User Value Test:**
- You actively think "I wish I could upload my CV" when testing
- Time-to-profile-creation feels like real friction
- You plan to create multiple profile variations

✅ **Technical Feasibility Test:**
- Sprint 0 spike: >80% extraction accuracy achieved
- Sprint 0 spike: <30 second extraction time verified
- Implementation time: <2 weeks (not worth more for solo use)

✅ **Strategic Fit Test:**
- This enables future features (job matching, profile comparison)
- Makes product more "shareable" (if others will use it)
- You're excited about AI integration as learning opportunity

✅ **Resource Test:**
- You have 4-5 weeks available for full implementation
- Comfortable spending $50-200/month on AI costs if scaling

### 7.2 Don't Build This Feature If:

❌ **Opportunity Cost Test:**
- Higher-priority features exist (job tracking, application management)
- Current manual flow is "good enough" and not painful
- Solo user with infrequent profile updates

❌ **Complexity Test:**
- AI extraction requires >2 weeks to get right
- Team lacks AI/ML experience
- Would need to support many file formats

❌ **ROI Test:**
- Only create profiles once every 6+ months
- 20-minute savings doesn't justify 30+ hours development
- Budget concerns about ongoing AI costs

### 7.3 Kill Signals (Abandon If:)

**During Development:**
- Sprint 0 spike: <70% extraction accuracy
- Extraction time consistently >45 seconds
- Implementation taking >2x estimated time

**After Launch:**
- Upload → extract → delete → manual >50% of users
- Average time via upload >15 minutes (worse than manual)
- Support volume for extraction errors exceeds capacity
- AI costs exceed $200/month without user growth

---

## 8. Implementation Phasing

### 8.1 Sprint 0: Spike & Validation (1 week)

**Goal:** Test Claude API feasibility before committing

**Tasks:**
- Collect 10+ diverse CV samples (PDF, DOCX, varied formats)
- Write extraction prompt for Claude API
- Test accuracy, time, cost for each sample
- Document findings in spike report

**Success Criteria:**
- >80% accuracy on structured fields (name, email, work history)
- <30 seconds extraction time (95th percentile)
- <$0.15 cost per extraction
- Clear plan for handling edge cases

**Go/No-Go Decision:** If all criteria met, proceed to Sprint 1

### 8.2 Sprint 1: Upload UI (1 week, 8 hours)

**Goal:** Users can upload CV files (no AI yet)

**Deliverables:**
- ProfileCreationModal.vue component
- CVUploadModal.vue component
- Supabase Storage bucket configured
- RLS policies implemented
- cv_uploads table created

**Success Metrics:**
- Users can upload files successfully
- File validation working (type, size)
- Upload progress visible
- Error handling functional

### 8.3 Sprint 2: AI Extraction (2 weeks, 13 hours)

**Goal:** Working end-to-end extraction

**Deliverables:**
- cv_extraction_tasks table
- Edge Function for Claude API
- Extraction prompt implementation
- Status polling UI
- Form pre-population logic

**Success Metrics:**
- >90% extraction success rate
- <20 second extraction time
- Confidence scores displayed
- Users can edit before saving

### 8.4 Sprint 3: Polish & Launch (3-5 days, 3 hours)

**Goal:** Production-ready feature

**Deliverables:**
- Quality feedback mechanism
- Analytics dashboard
- Bug fixes from Sprint 2
- Documentation

**Launch Criteria:**
- All acceptance criteria met
- Security review passed
- Cost monitoring configured
- Rollback plan documented

---

## 9. Risk Assessment

### 9.1 High-Priority Risks

#### Risk 1: AI Extraction Accuracy

**Risk:** Claude API extracts wrong data (swaps job titles, hallucinates companies)

**Probability:** Medium
**Impact:** High (users lose trust, revert to manual)

**Mitigation:**
- Comprehensive spike testing (Sprint 0)
- Show confidence scores for each field
- Always allow manual editing
- Quality feedback loop (Story 5)
- Start with DOCX only (easier to parse than PDF)

#### Risk 2: Cost Overruns

**Risk:** AI API costs exceed budget

**Probability:** Medium
**Impact:** Medium (feature becomes unsustainable)

**Mitigation:**
- Rate limiting: 5 uploads per user per hour
- Budget alerts at $50/month in Anthropic dashboard
- Cache extraction results (same CV uploaded twice)
- Consider Claude Haiku (80% cheaper) if costs spike

#### Risk 3: PDF Parsing Failures

**Risk:** PDF extraction fails for image-based or complex layouts

**Probability:** Medium
**Impact:** High (poor UX for affected users)

**Mitigation:**
- Detect image-only PDFs, show clear error
- Start with DOCX support (more reliable)
- Provide "Upload Text Version" fallback
- Future: integrate OCR (Google Cloud Vision)

### 9.2 Medium-Priority Risks

#### Risk 4: Extraction Timeout

**Risk:** Large CVs (10+ pages) exceed timeout limits

**Probability:** Low
**Impact:** Medium (user waits, then fails)

**Mitigation:**
- Set expectation: "Large CV may take up to 1 minute"
- Implement async job queue (not synchronous)
- Show progress updates during extraction

#### Risk 5: User Adoption Below Target

**Risk:** Users prefer manual entry over upload

**Probability:** Low
**Impact:** Low (feature underutilized but not harmful)

**Mitigation:**
- Phased approach validates demand before full build
- Easy to disable via feature flag if unused
- Minimal maintenance burden

---

## 10. Out of Scope

### 10.1 Explicitly NOT Building

**File Formats:**
- ❌ DOC (Word 97-2003) support → Phase 4 if requested
- ❌ TXT/RTF support → Low priority
- ❌ Image files (PNG/JPG of CV) → Requires OCR

**AI Features:**
- ❌ Auto-enhancement suggestions ("Add quantified achievements")
- ❌ Profile quality scoring
- ❌ Skill gap analysis vs job requirements
- ❌ Automatic profile updates from LinkedIn

**Integration:**
- ❌ LinkedIn profile import
- ❌ Indeed resume import
- ❌ Automatic sync with CV file changes

**Advanced Features:**
- ❌ Real-time extraction preview
- ❌ Multiple CV comparison
- ❌ CV template detection
- ❌ Historical version tracking

### 10.2 Future Considerations (Post-MVP)

**If Feature Successful:**
- LinkedIn profile import integration
- GitHub profile enrichment (pull OSS contributions)
- Multi-language CV support
- Cover letter extraction
- Job description → profile match scoring

---

## Appendix: Business Case Analysis

### A. ROI Calculation (Solo User)

**Costs:**
- Development: 30-35 hours × $100/hour (opportunity cost) = **$3,000-3,500**
- AI API (year 1): $0.10 (negligible)
- **Total:** $3,000-3,500

**Benefits:**
- Time saved: 20 minutes one-time = **$33** (at $100/hour)
- Strategic learning: AI integration experience = **$500-1,000** (estimated)
- **Total:** $533-1,033

**ROI:** -65% to -70% (NEGATIVE)

**Conclusion:** Don't build for time savings. Build for strategic learning or future scalability.

### B. ROI Calculation (100 Users)

**Costs:**
- Development: $3,000-3,500 (one-time)
- AI API (year 1): 100 users × 2 uploads × $0.05 = **$10**
- **Total Year 1:** $3,010-3,510

**Benefits:**
- Time saved: 100 users × 20 min × $50/hour = **$1,667**
- User acquisition: Easier onboarding = 10% more signups = **$2,000** (estimated)
- **Total:** $3,667

**ROI Year 1:** +4.5% to +18.7%
**ROI Year 2+:** +150%+ (no dev costs)

**Conclusion:** Positive ROI at 100+ users. Build if planning to scale.

---

**Last Updated:** October 6, 2025
**Status:** 📋 Documented - Deferred to Phase 3
**Next Review:** After master profile MVP launch + 1 month
**Decision:** Proceed only if user demand validated
