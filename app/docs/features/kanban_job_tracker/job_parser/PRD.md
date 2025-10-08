# Product Requirements Document: AI-Powered Job Parser

**Version:** 1.0
**Date:** October 6, 2025
**Feature Owner:** Product Manager & Product Owner (Collaborative)
**Status:** ✅ Approved - P0 Critical Priority
**Parent Feature:** Kanban Job Application Tracker

---

## Executive Summary

The AI-Powered Job Parser transforms job application tracking from manual data entry to automated extraction, reducing time-to-add from 5+ minutes to <30 seconds. This feature is **critical for product-market fit**, closing the competitive gap with Huntr and Teal while enabling users to scale from tracking 5 applications to 50+ without overwhelm.

### Problem
Currently, adding a job to the tracker requires:
- Manual copying of company name, position, description
- 5+ minutes per job entry
- Error-prone data entry (typos, missing fields)
- Context switching between job boards and tracker

**Pain Level: 8/10** - Blocks efficient workflow at scale (20+ applications)

### Solution
"Add Job Target" button on kanban board with two input modes:
1. **Paste job URL** → AI scrapes + extracts → Preview → Confirm
2. **Paste description** → AI extracts → Preview → Confirm

**AI Stack:**
- Jina AI Reader (handles JavaScript-heavy sites, returns clean markdown)
- Claude Sonnet 4.5 (superior accuracy for Bangkok/Thailand job posts)

**Fallback Strategy:**
- URL fails → Prompt for manual paste
- Low confidence (<50) → Require user review
- Manual paste always available as first-class option

### Impact
- ✅ **Time savings:** 5 min → <30 sec per job (90% reduction)
- ✅ **Scale enablement:** Manage 50+ applications vs 10-15 currently
- ✅ **Competitive parity:** Match Huntr/Teal automation features
- ✅ **Data quality:** AI extracts company, position, description, salary consistently

### Target Release
- **MVP:** October 7-12, 2025 (6 days, ~24 hours effort)
- **Success Criteria:** 95%+ automated extraction rate, <30s time to add job

---

## 📊 FEATURE EVALUATION SUMMARY

**Feature:** AI-Powered Job Post Parser with URL Scraping & Manual Fallback
**Submitted:** October 6, 2025
**Evaluated By:** Product Manager (PM) & Product Owner (PO)

---

## 🎯 PM STRATEGIC EVALUATION

### 1. Strategic Fit
**Rating: 9/10**

This feature aligns perfectly with the product vision of streamlining job search workflows. Currently, users must manually create job entries, which creates friction in the job hunting process. This "Add Job Target" button removes a significant pain point by automating job post extraction.

**User Need:**
Job seekers need to quickly capture opportunities from various job boards (LinkedIn, Indeed, company career pages) without manual data entry. The AI-powered extraction ensures consistent data quality and saves time.

**Business Impact:**
- **Reduces friction** in job capture workflow from ~5 minutes to <30 seconds
- **Increases adoption** by making the tool more competitive with alternatives like Huntr or Teal
- **Enables scale** - users can track 10x more opportunities with same effort

### 2. Market Context

**Competitor Analysis:**
- ✅ **Huntr** has URL import with auto-extraction
- ✅ **Teal** has browser extension for one-click save
- ✅ **Simplify** has AI job description parsing
- ❌ **We currently lack** automated job capture

**Market Demand:** **HIGH** - This is table stakes for modern ATS/job trackers. Users expect automated data extraction.

**Opportunity Size:** **Critical for user retention.** Without this, we risk churn to competitors.

### 3. User Research

**User Segments:**
- **Primary:** Active job seekers managing 20-50 applications simultaneously (Self - Frontend Engineer, Bangkok/remote)
- **Secondary:** Passive candidates exploring opportunities casually

**Users Affected:** 100% of active users (currently 1 user, but essential for growth)

**Pain Level: 8/10**
- Manual entry is tedious and error-prone
- Context switching between job boards and tracker kills productivity
- Missing job details (like salary range, requirements) leads to poor match analysis
- Cannot scale beyond 10-15 applications without burnout

### 4. Success Metrics

**Primary KPIs:**
- **Time to create job entry:** Target <30s (vs current ~5min manual) - **90% improvement**
- **Job capture rate:** >95% successful AI extractions (Jina AI + manual fallback)
- **User adoption:** >90% of new jobs added via parser (vs manual) within 1 month

**Secondary Metrics:**
- **Data quality:** >95% accurate extraction of required fields (company, position, description)
- **Fallback usage:** <20% of submissions require manual paste fallback
- **Confidence score:** Average ≥80% across all parsed jobs

**Business Impact:**
- **User satisfaction:** Expected NPS improvement (faster workflow)
- **Feature stickiness:** Daily active usage metric increases
- **Competitive positioning:** Can now claim "AI-powered job tracking" in marketing

### 5. PM Decision

**✅ BUILD IT - P0 (Critical Priority)**

**Priority:** **P0 (Blocking for product-market fit)** - This is a critical missing feature

**Recommended Timeline:** **This sprint (Oct 7-12)** - MVP with URL scraping + manual fallback

**Rationale:**
- **Closes competitive gap** with Huntr/Teal (essential for market positioning)
- **Enables 10x improvement** in user productivity (5min → 30s)
- **Low technical risk** with clear fallback strategy (Jina AI + manual paste)
- **High user value** with measurable impact (95%+ automation rate)
- **Foundation for growth** - Required before productization/scaling

---

## ⚙️ PO TECHNICAL ASSESSMENT

### 1. Technical Feasibility

**Stack Assessment:**
- ✅ **Frontend:** Vue 3 + TypeScript (existing modal patterns reusable)
- ✅ **Backend:** Supabase Edge Functions (can call AI APIs, Deno runtime)
- ✅ **Database:** `jobs` table already has all required fields (company_name, position_title, job_description_text)
- ✅ **AI Integration:** Claude API already integrated, Anthropic SDK available

**Technical Approach:**
1. **Frontend:** Reuse `JobInputModal.vue` pattern, add dropdown for input type (URL vs Paste)
2. **URL Scraping:** Supabase Edge Function → Jina AI Reader → Claude Sonnet 4.5 extraction
3. **Fallback:** If scraping fails (403, 404, timeout), prompt manual paste
4. **AI Extraction:** Use Claude Sonnet 4.5 to parse job post HTML/text → structured JSON

**Blockers:**
- ⚠️ **Rate limiting** on job board sites (mitigated: Jina AI handles this, manual paste fallback)
- ⚠️ **CORS issues** (solved: server-side fetch in Edge Function)
- ⚠️ **AI hallucination** (mitigated: confidence score, require user preview, validate company+position)

**Dependencies:**
- Jina AI Reader API (free tier, 1M tokens/month)
- Claude API credits ($3/1M input, $15/1M output - ~$1.40/month for 100 jobs)
- Supabase Edge Functions (existing infrastructure)
- No new infrastructure required

### 2. Effort Estimation

**Story Points:** **13 points** (Fibonacci: 1, 2, 3, 5, 8, 13, 21)

**Breakdown:**
- **Database Migration (1pt):** Add 4 new columns to jobs table (parsing_source, parsing_confidence, parsing_model, raw_content)
- **Edge Function (5pts):** Jina AI fetch, Claude extraction, JSON parsing, error handling
- **Frontend Modal (3pts):** Dropdown, input/textarea toggle, loading/error states, preview UI
- **Integration (2pts):** Wire modal to Edge Function, handle responses, create kanban card
- **Testing (2pts):** Test 20 URLs, measure success rate, document results

**Sprints Needed:** **1 sprint (6 days)** assuming solo developer

**Team Capacity:** Solo developer (you) - feasible with focused time blocks

### 3. Epic Breakdown

**Epic:** AI-Powered Job Parser with URL Scraping & Fallback

#### **MVP Scope (Oct 7-12):**

**Story 1: Database Migration** (1pt)
- Add parsing metadata fields to jobs table
- Fields: parsing_source, parsing_confidence, parsing_model, raw_content
- Create migration: 023_add_job_parsing_fields.sql
- Deploy to Supabase

**Story 2: Edge Function - URL Scraping** (3pts)
- Create parse-job-post Edge Function
- Integrate Jina AI Reader (https://r.jina.ai/{url})
- Error handling: 404, timeout, CAPTCHA
- Return clean markdown or error

**Story 3: Edge Function - AI Extraction** (2pts)
- Send markdown/text to Claude Sonnet 4.5
- System prompt: Extract company, position, description, salary, location
- Parse JSON response
- Return structured data with confidence score
- Validate: company + position required, confidence ≥50

**Story 4: Frontend Modal** (3pts)
- Create JobParserModal.vue component
- Dropdown: "Paste job URL" vs "Copy & paste description"
- Conditional input: <input type="url"> or <textarea>
- Submit → Loading state → Preview parsed data
- Error handling: Show fallback prompt if URL fails

**Story 5: Integration & Card Creation** (2pts)
- Add "Add Job Target" button to KanbanBoard header
- Wire modal → Edge Function → jobs table
- Validate response (company + position + confidence ≥50)
- Show preview: "Found: [Company] - [Position]" with Edit/Confirm buttons
- Insert into jobs table + auto-create kanban card

**Story 6: Testing & Documentation** (2pts)
- Test 20 real job URLs (LinkedIn, Indeed, company sites)
- Measure: Jina AI success rate, parsing confidence, time to add
- Document results in TESTING_RESULTS.md
- Write user guide: How to use parser

#### **Out of Scope (Future):**
- ❌ Browser extension for one-click save
- ❌ Bulk import from CSV/LinkedIn
- ❌ Automatic job board monitoring
- ❌ Email parsing from job alerts

### 4. Acceptance Criteria Preview

**Story 3 (Core AI Extraction):**

**Scenario 1: Successful URL Parsing**

**Given** user pastes job posting URL (e.g., https://jobs.company.com/senior-frontend)
**When** AI successfully scrapes and parses the page
**Then** system should:
- ✅ Extract company name, position title, job description
- ✅ Extract optional fields: location, salary_range, job_type, posted_date
- ✅ Calculate confidence score (0-100)
- ✅ Show preview: "✅ Found: 'Senior Frontend Engineer' at 'Airbnb'"
- ✅ Display parsed data (company, position, location, salary) for user review
- ✅ Provide Edit and Confirm buttons

**Scenario 2: URL Inaccessible (Fallback)**

**Given** URL is inaccessible (403, 404, timeout, CAPTCHA)
**When** scraping fails
**Then** system should:
- ⚠️ Show fallback prompt: "Unable to access URL. Please paste job description instead."
- ✅ Switch input to textarea mode automatically
- ✅ Allow manual paste with same AI parsing
- ✅ Continue to preview step (no data loss)

**Scenario 3: Low Confidence Extraction**

**Given** AI extracts data but confidence <50 (e.g., ambiguous job post)
**When** parsing completes
**Then** system should:
- ⚠️ Show warning: "Extraction confidence is low. Please review carefully."
- ✅ Display parsed data with editable fields
- ✅ Highlight missing fields (company/position required)
- ✅ Require user confirmation before save
- ❌ Do NOT auto-save (prevent bad data)

**Non-Functional Requirements:**
- ⏱️ **Performance:** Scraping + AI parse completes in <10s (p95)
- 🔒 **Security:** Edge Function validates URLs (prevent SSRF attacks, check domain whitelist)
- 📊 **Observability:** Log scraping failures with URL + error type for monitoring
- 💰 **Cost:** <$0.02 per job parse (Jina AI free + Sonnet 4.5 ~$0.014/job)

### 5. PO Assessment

**Feasibility:** **Moderate** - Requires new Edge Function, but tech stack is ready

**Risk Level:** **Medium**
- ⚠️ **AI Accuracy Risk:** Parsing might miss fields (mitigate: confidence score + user preview)
- ⚠️ **Scraping Reliability:** Job boards may block requests (mitigate: Jina AI + manual fallback)
- ⚠️ **Cost Risk:** AI API costs could scale (mitigate: Sonnet 4.5 ~$1.40/month for 100 jobs, cap at 200 jobs)

**Recommended Approach:** **Build MVP with robust fallback**
- Start with Jina AI + Claude Sonnet 4.5
- Build manual paste as first-class citizen (not afterthought)
- Iterate based on success rate analytics (target 95%+)

---

## ✅ JOINT DECISION (PM-PO Collaboration)

### **Collaborative Discussion:**

**PM raises:**
- 🚨 **Urgency:** This is blocking competitive parity. Users expect this feature in modern job trackers.
- 💼 **Business Case:** Without this, we can't compete with Huntr/Teal for serious job seekers.
- 🎯 **Strategic Importance:** Core to product value proposition (automated job tracking).
- 📈 **Growth Dependency:** Cannot scale user base without this (manual entry doesn't scale).

**PO raises:**
- ⚙️ **Technical Complexity:** Scraping is brittle - job boards change HTML frequently.
- 💰 **Cost Consideration:** AI API calls add ongoing costs (~$0.014 per parse with Sonnet 4.5).
- 🛡️ **Fallback Strategy:** Manual paste MUST be reliable (can't fail on edge cases).
- 🔧 **Maintenance:** Jina AI is external dependency (monitor uptime, have backup plan).

**Trade-Off Discussion:**
- **PM:** "Can we do URL-only in Sprint 1, add paste later?"
- **PO:** "No - fallback is critical. Too many sites block scrapers. Manual paste is MVP."
- **Agreement:** Build both in parallel. Fallback isn't optional, it's essential for 95%+ success rate.

**Cost Discussion:**
- **PM:** "Haiku is cheaper ($0.001/job). Why Sonnet 4.5 ($0.014/job)?"
- **PO:** "Bangkok/Thailand job posts need better accuracy. $1.40/month is negligible vs bad data."
- **Agreement:** Use Sonnet 4.5 for superior extraction quality. Cost difference ($1.30/month) is insignificant.

### **Final Decision:**

**✅ APPROVED FOR IMMEDIATE BUILD**

**Scope:** **MVP with URL scraping (Jina AI + Sonnet 4.5) + Manual paste fallback**

**Timeline:** **Sprint 41 (Week of Oct 7-12, 2025)** - Target completion by Oct 12

**Estimated Delivery:** **October 12, 2025** (6 days from today)

**Phased Approach:**
- **Phase 1 (Oct 7):** Database migration + Edge Function (Jina AI + Sonnet 4.5)
- **Phase 2 (Oct 8):** Frontend modal (dropdown + conditional inputs)
- **Phase 3 (Oct 9):** Integration (button + card creation)
- **Phase 4 (Oct 10-12):** Testing (20 URLs) + documentation

---

## 📋 NEXT STEPS

1. **Create Database Migration** - Dev (You) - Oct 7 AM (1 hour)
   - File: `app/supabase/migrations/023_add_job_parsing_fields.sql`
   - Add: parsing_source, parsing_confidence, parsing_model, raw_content
   - Deploy: `npx supabase db push`

2. **Build Edge Function** - Dev (You) - Oct 7 PM (4 hours)
   - File: `app/supabase/functions/parse-job-post/index.ts`
   - Integrate: Jina AI Reader + Claude Sonnet 4.5
   - Deploy: `npx supabase functions deploy parse-job-post`

3. **Create Frontend Modal** - Dev (You) - Oct 8 (4 hours)
   - File: `app/frontend/src/components/JobParserModal.vue`
   - UI: Dropdown + conditional input + preview
   - Test: Manual flows (URL + paste)

4. **Add Button to Kanban** - Dev (You) - Oct 9 (2 hours)
   - Update: `app/frontend/src/components/kanban/KanbanBoard.vue`
   - Add: "Add Job Target" button in header
   - Wire: Open modal → Submit → Create card

5. **Integration Testing** - Dev (You) - Oct 10-11 (8 hours)
   - Test: 20 real job URLs (LinkedIn, Indeed, company sites)
   - Measure: Success rate, confidence scores, time to add
   - Document: `app/docs/features/kanban_job_tracker/job_parser/TESTING_RESULTS.md`

6. **Documentation** - Dev (You) - Oct 12 (2 hours)
   - User guide: How to add job via URL/paste
   - Troubleshooting: What to do if parsing fails
   - API docs: Edge Function schema

7. **Demo & Feedback** - PM - Oct 13 (1 hour)
   - Live demo of URL parsing + fallback
   - Share success rate metrics (target 95%+)
   - Gather feedback for iteration

---

## 💡 KEY INSIGHTS

### 1. **Fallback is MVP, not optional**
Job board scraping is inherently unreliable (anti-bot measures, rate limits, CAPTCHA). Manual paste must be a first-class feature, not an afterthought. Users will rely on it 10-20% of the time.

### 2. **AI accuracy > AI speed**
Better to take 5 seconds for accurate parsing than 2 seconds for hallucinated data. Jobs are created once but referenced dozens of times (CV tailoring, match analysis). Bad data = bad decisions.

**Decision:** Use Sonnet 4.5 ($0.014/job) over Haiku ($0.001/job) for superior accuracy.

### 3. **Success metric = Data quality, not speed**
Track `% of jobs with complete data (company + position + description)` as primary KPI. Fast but incomplete parsing creates technical debt.

### 4. **Preview is mandatory, not optional**
Never auto-save AI-extracted data without user confirmation. Show preview with Edit/Confirm buttons. Trust but verify.

### 5. **Cache raw content for future improvements**
Store `raw_content` in database. If you improve the AI prompt later, you can re-parse all jobs without re-fetching URLs. This enables continuous improvement.

### 6. **Jina AI Reader is the secret weapon**
- Free tier: 1M tokens/month (~20k job posts)
- Handles JavaScript-heavy sites (LinkedIn, Greenhouse)
- Returns clean markdown (easier for AI to parse)
- No need for headless browsers or Puppeteer

**Decision:** Use Jina AI as primary method, not fallback.

---

## User Stories & Acceptance Criteria

### Epic: AI-Powered Job Parser

**User Story 1: Add Job via URL**

**As a** job seeker
**I want to** paste a job URL and have it automatically extracted
**So that** I can add jobs to my tracker in <30 seconds instead of 5+ minutes

**Acceptance Criteria:**
- User clicks "Add Job Target" button on kanban board
- Modal opens with dropdown: "Paste job URL" (default selected)
- User pastes URL (e.g., https://jobs.company.com/senior-frontend)
- Click "Parse Job Post" → Loading state ("Analyzing job post...")
- Success: Preview shows company, position, location, salary
- User clicks "Confirm & Add to Board" → Job inserted + card created
- Time to complete: <30 seconds

**User Story 2: Add Job via Manual Paste**

**As a** job seeker
**I want to** paste a job description directly
**So that** I can add jobs even when the URL is inaccessible

**Acceptance Criteria:**
- User clicks "Add Job Target" button
- Select "Copy & paste job description" from dropdown
- Textarea appears (10 rows, placeholder text)
- User pastes full job description
- Click "Parse Job Post" → Same preview flow as URL
- AI extracts company, position, description
- User confirms → Job inserted + card created

**User Story 3: Handle Failed URL Scraping**

**As a** job seeker
**I want** the system to gracefully handle inaccessible URLs
**So that** I'm not blocked when scraping fails

**Acceptance Criteria:**
- User pastes URL that returns 403/404/timeout
- System shows error: "Unable to access URL. Please paste job description instead."
- Dropdown automatically switches to "Copy & paste description"
- Textarea appears pre-filled with URL (user can edit)
- User pastes description → Continue to preview
- No data loss, smooth fallback UX

**User Story 4: Review Low Confidence Extractions**

**As a** job seeker
**I want** to review AI-extracted data before saving
**So that** I catch errors and maintain data quality

**Acceptance Criteria:**
- AI extracts data with confidence <80%
- Preview shows warning: "⚠️ Extraction confidence is low. Please review."
- All fields editable (company, position, location, salary)
- Required fields highlighted: company*, position*
- Cannot save with missing required fields
- User can edit → Confidence updates → Save

---

## Non-Functional Requirements

### Performance
- **NFR-1:** URL scraping + AI extraction completes in <10s (p95)
- **NFR-2:** Preview rendering <200ms after data received
- **NFR-3:** Edge Function cold start <3s

### Reliability
- **NFR-4:** 95%+ automated extraction success rate (Jina AI + manual fallback)
- **NFR-5:** Zero data loss on network failures (show retry button)
- **NFR-6:** Graceful degradation if Jina AI down (immediate fallback to manual paste)

### Security
- **NFR-7:** Validate URLs (prevent SSRF attacks, check domain patterns)
- **NFR-8:** Sanitize AI-extracted text (prevent XSS from job descriptions)
- **NFR-9:** Rate limit Edge Function (max 10 requests/minute per user)

### Cost
- **NFR-10:** Average cost per job <$0.02 (Jina AI free + Sonnet 4.5 ~$0.014)
- **NFR-11:** Monthly cost cap: $5 (safety limit, ~350 jobs)

### Usability
- **NFR-12:** Preview UI shows all extracted fields clearly
- **NFR-13:** Error messages actionable (e.g., "Paste description instead")
- **NFR-14:** Keyboard navigation supported (Tab, Enter, Escape)

---

## Out of Scope

The following features are explicitly **NOT** included in the MVP:

**OS-1: Browser Extension**
- One-click save from LinkedIn/Indeed
- Auto-fill tracker from job board

**OS-2: Bulk Import**
- CSV upload of multiple jobs
- LinkedIn connection scraping

**OS-3: Email Integration**
- Parse job alerts from email
- Auto-import from Gmail

**OS-4: Advanced AI Features**
- Job description summarization
- Skills gap analysis vs master profile
- Salary normalization (USD/THB conversion)

**OS-5: Company Research**
- Auto-fetch Glassdoor reviews
- LinkedIn company info integration

---

## Open Questions

**Q1: Should we cache Jina AI responses to save costs?**
- **Recommendation:** Yes, cache in `raw_content` field. Many users apply to same popular jobs (e.g., "Senior Frontend at Airbnb"). Can share parsing across users (privacy-safe, URL as cache key).

**Q2: Should we support multi-language job posts (Thai)?**
- **Recommendation:** Start with English-only prompts. Bangkok jobs are usually English or English/Thai mixed. Sonnet 4.5 handles Thai well enough. Revisit if >20% of jobs fail due to Thai-only content.

**Q3: Should we show match percentage in preview?**
- **Recommendation:** Not in MVP. Match analysis requires master profile comparison (separate step). Focus preview on data extraction accuracy first.

**Q4: Should we auto-create application folder like /cv_letsgo does?**
- **Recommendation:** Not in MVP. This is "quick add" to kanban. Full application workflow (CV generation) remains separate via /cv_letsgo command.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | PM & PO | Initial PRD from feature request evaluation |

**Next Steps:**
1. ✅ PRD approved by stakeholders (self - solo developer)
2. ⏭️ Begin implementation Phase 1 (Database migration - Oct 7)
3. ⏭️ Daily standups to track progress (async via todo list)
4. ⏭️ Demo on Oct 13 with success rate metrics

---

**Status:** ✅ Approved - Ready for Implementation
**Priority:** P0 (Critical - Blocking for product-market fit)
**Timeline:** October 7-12, 2025 (6 days)
**Success Criteria:** 95%+ automated extraction, <30s time to add job
