# Implementation Plan: AI-Powered Job Parser

**Version:** 1.0
**Date:** October 6, 2025
**Status:** Approved
**Sprint:** October 7-12, 2025 (6 days)
**Estimated Effort:** 24 hours

---

## Overview

This document outlines the 6-day implementation plan for the AI-Powered Job Parser feature. The plan is organized into 4 phases with clear deliverables and acceptance criteria.

**Goal:** Ship MVP with 95%+ automated job extraction rate by October 12, 2025.

---

## Timeline Summary

| Phase | Date | Duration | Deliverables |
|-------|------|----------|--------------|
| Phase 1: Backend | Oct 7 | 6 hours | Database migration + Edge Function |
| Phase 2: Frontend | Oct 8 | 4 hours | JobParserModal component |
| Phase 3: Integration | Oct 9 | 2 hours | KanbanBoard integration |
| Phase 4: Testing | Oct 10-12 | 12 hours | 20 URL tests + documentation |

**Total:** 24 hours over 6 days

---

## Phase 1: Backend Foundation (Oct 7)

### Duration: 6 hours (AM: 2h, PM: 4h)

### Task 1.1: Database Migration (2 hours - Oct 7 AM)

**Deliverable:** Migration 023 deployed to Supabase

**Steps:**
1. Create migration file: `app/supabase/migrations/023_add_job_parsing_fields.sql`
2. Add 4 new columns to `jobs` table:
   - `parsing_source TEXT`
   - `parsing_confidence INTEGER`
   - `parsing_model TEXT`
   - `raw_content TEXT`
3. Add constraints and indexes
4. Test locally: `npx supabase db reset`
5. Deploy: `npx supabase db push`

**Acceptance Criteria:**
- [ ] Migration file created with proper SQL
- [ ] Constraints enforce valid values (source, confidence 0-100)
- [ ] Indexes created on parsing_source and parsing_confidence
- [ ] Local test passes without errors
- [ ] Deployed to Supabase successfully
- [ ] Can insert test job with parsing metadata

**SQL to verify:**
```sql
-- Verify columns added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'jobs'
  AND column_name LIKE 'parsing%';

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'jobs'
  AND indexname LIKE '%parsing%';
```

---

### Task 1.2: Edge Function - Jina AI Integration (2 hours - Oct 7 PM)

**Deliverable:** Working Jina AI URL scraper

**File:** `app/supabase/functions/parse-job-post/jina-reader.ts`

**Steps:**
1. Create Edge Function directory structure
2. Implement `fetchJobContent(url)` function
3. Add error handling (403, 404, timeout)
4. Test with 3 sample URLs (LinkedIn, Indeed, company site)
5. Verify markdown output quality

**Code to implement:**
```typescript
export async function fetchJobContent(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`

  const response = await fetch(jinaUrl, {
    headers: {
      'Accept': 'text/plain',
      'X-Return-Format': 'markdown'
    }
  })

  if (!response.ok) {
    const status = response.status
    if (status === 403) throw new Error('Site blocked by CAPTCHA')
    if (status === 404) throw new Error('Job not found')
    throw new Error(`HTTP ${status}`)
  }

  return await response.text()
}
```

**Test URLs:**
- https://jobs.lever.co/shopify/example (test Lever ATS)
- https://greenhouse.io/example (test Greenhouse ATS)
- https://careers.google.com/example (test company site)

**Acceptance Criteria:**
- [ ] Function fetches markdown from Jina AI
- [ ] Error handling works (403, 404 tested)
- [ ] Markdown output is clean (no ads/navigation)
- [ ] Response time <3s (p95)

---

### Task 1.3: Edge Function - Claude Extraction (2 hours - Oct 7 PM)

**Deliverable:** Working Claude Sonnet 4.5 extractor

**File:** `app/supabase/functions/parse-job-post/claude-extractor.ts`

**Steps:**
1. Set up Anthropic SDK
2. Write system prompt (see spec in TechnicalArchitecture.md)
3. Implement `extractStructuredData(content)` function
4. Add JSON parsing and validation
5. Test with 3 sample job descriptions

**Code to implement:**
```typescript
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

export async function extractStructuredData(content: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT, // See TechnicalArchitecture.md
    messages: [{
      role: 'user',
      content: `Parse this job post:\n\n${content}`
    }]
  })

  return JSON.parse(message.content[0].text)
}
```

**Test Cases:**
1. Clear job post (high confidence expected)
2. Ambiguous job post (low confidence expected)
3. Non-English job post (Thai/English mixed)

**Acceptance Criteria:**
- [ ] Extracts company, position, description
- [ ] Returns confidence score 0-100
- [ ] JSON parsing never fails (error handling)
- [ ] Response time <5s (p95)
- [ ] Test cases pass (3/3)

---

### Task 1.4: Edge Function - Main Handler (1 hour - Oct 7 PM)

**Deliverable:** Complete Edge Function ready to deploy

**File:** `app/supabase/functions/parse-job-post/index.ts`

**Steps:**
1. Implement main HTTP handler
2. Integrate Jina AI + Claude modules
3. Add input validation (URL vs text)
4. Add error responses with proper status codes
5. Deploy: `npx supabase functions deploy parse-job-post`

**Acceptance Criteria:**
- [ ] Handles both URL and text inputs
- [ ] Returns 200 on success with full JSON
- [ ] Returns 400 on fetch failure with fallback hint
- [ ] Returns 422 on low confidence with extracted data
- [ ] Deployed successfully to Supabase
- [ ] Environment variables set (ANTHROPIC_API_KEY)

**Test command:**
```bash
# Test URL parsing
curl -X POST https://<project>.supabase.co/functions/v1/parse-job-post \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://jobs.airbnb.com/test"}'

# Test text parsing
curl -X POST https://<project>.supabase.co/functions/v1/parse-job-post \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Senior Frontend Engineer at Grab..."}'
```

---

## Phase 2: Frontend UI (Oct 8)

### Duration: 4 hours

### Task 2.1: JobParserModal Component (3 hours)

**Deliverable:** Complete modal component with all states

**File:** `app/frontend/src/components/JobParserModal.vue`

**Steps:**
1. Create component file with TypeScript setup
2. Implement input step (dropdown + conditional inputs)
3. Implement loading state (spinner + "Analyzing...")
4. Implement preview step (show parsed data)
5. Implement error states (fetch failed, low confidence)
6. Add Tailwind CSS styling
7. Test all flows manually

**Features to implement:**
- Dropdown: "Paste URL" vs "Copy & paste description"
- URL input with placeholder
- Textarea with 10 rows for description
- Submit button with loading state
- Preview card showing:
  - Company name + position (large)
  - Location, salary, job type (grid)
  - Confidence badge (colored)
  - Description preview (truncated)
- Error messages (red background)
- Fallback prompt (yellow background)
- Edit / Confirm buttons

**Acceptance Criteria:**
- [ ] Modal opens/closes properly
- [ ] Dropdown switches input modes
- [ ] URL validation (must be HTTPS)
- [ ] Textarea validation (min 50 chars)
- [ ] Loading spinner shows during parse
- [ ] Preview displays all extracted fields
- [ ] Confidence badge colored correctly:
  - Green: ≥90%
  - Yellow: 70-89%
  - Orange: <70%
- [ ] Edit button returns to input step
- [ ] Confirm button triggers save (placeholder)
- [ ] Error messages display correctly
- [ ] Mobile responsive (tested at 375px)

---

### Task 2.2: TypeScript Types (30 min)

**Deliverable:** Type definitions for API integration

**File:** `app/frontend/src/types/job-parser.ts`

**Steps:**
1. Create type definitions file
2. Define `ParseJobRequest` interface
3. Define `ParseJobResponse` interface
4. Define `ParseJobError` interface
5. Export all types

**Code:**
```typescript
export interface ParseJobRequest {
  url?: string
  text?: string
}

export interface ParseJobResponse {
  company_name: string
  position_title: string
  location: string | null
  salary_range: string | null
  job_type: 'full-time' | 'contract' | 'remote' | 'hybrid' | null
  job_description_text: string
  posted_date: string | null
  confidence: number
  parsing_source: 'url_jina' | 'manual_paste'
  parsing_model: string
  raw_content: string
  original_url: string | null
}

export interface ParseJobError {
  error: string
  fallback?: 'manual_paste'
  code?: string
  extracted?: Partial<ParseJobResponse>
}
```

**Acceptance Criteria:**
- [ ] File created with proper exports
- [ ] Types match API specification
- [ ] No TypeScript errors in component

---

### Task 2.3: API Integration (30 min)

**Deliverable:** Working API calls to Edge Function

**Steps:**
1. Implement `handleSubmit()` function
2. Call `supabase.functions.invoke('parse-job-post', {...})`
3. Handle success → show preview
4. Handle errors → show fallback or warning
5. Test with real Edge Function

**Acceptance Criteria:**
- [ ] API call succeeds with valid URL
- [ ] API call succeeds with pasted text
- [ ] Fallback triggers on 400 error (URL failed)
- [ ] Low confidence warning triggers on 422
- [ ] Generic error message on 500
- [ ] Network errors handled gracefully

---

## Phase 3: Integration (Oct 9)

### Duration: 2 hours

### Task 3.1: KanbanBoard Integration (1 hour)

**Deliverable:** "Add Job Target" button in kanban header

**File:** `app/frontend/src/components/kanban/KanbanBoard.vue`

**Steps:**
1. Import `JobParserModal` component
2. Add state: `isParserModalOpen = ref(false)`
3. Add button in header: "Add Job Target"
4. Add modal to template with props
5. Test button opens/closes modal

**Code:**
```vue
<script setup>
import JobParserModal from '../JobParserModal.vue'

const isParserModalOpen = ref(false)

const handleJobAdded = async (jobId: string) => {
  console.log('Job added:', jobId)
  await kanbanStore.fetchJobs()
  await kanbanStore.syncJobsToCards()
}
</script>

<template>
  <!-- Header -->
  <div class="header">
    <button @click="isParserModalOpen = true">
      + Add Job Target
    </button>
  </div>

  <!-- Modal -->
  <JobParserModal
    :is-open="isParserModalOpen"
    @close="isParserModalOpen = false"
    @success="handleJobAdded"
  />
</template>
```

**Acceptance Criteria:**
- [ ] Button visible in kanban header
- [ ] Click opens JobParserModal
- [ ] Modal closes on cancel
- [ ] Modal closes on successful save

---

### Task 3.2: Database Save Implementation (1 hour)

**Deliverable:** Save parsed job to database + create kanban card

**File:** `app/frontend/src/components/JobParserModal.vue` (update)

**Steps:**
1. Implement `handleConfirm()` function
2. Insert into `jobs` table with all fields
3. Emit `success` event with job ID
4. Trigger kanban refresh in parent
5. Test end-to-end flow

**Code:**
```typescript
const handleConfirm = async () => {
  if (!previewData.value) return

  loading.value = true

  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        input_type: inputType.value === 'url' ? 'url' : 'text',
        input_content: inputType.value === 'url' ? jobUrl.value : jobText.value,
        original_url: previewData.value.original_url,
        company_name: previewData.value.company_name,
        position_title: previewData.value.position_title,
        location: previewData.value.location,
        salary_range: previewData.value.salary_range,
        job_type: previewData.value.job_type,
        job_description_text: previewData.value.job_description_text,
        posted_date: previewData.value.posted_date,
        parsing_source: previewData.value.parsing_source,
        parsing_confidence: previewData.value.confidence,
        parsing_model: previewData.value.parsing_model,
        raw_content: previewData.value.raw_content,
        status: 'processing'
      })
      .select()
      .single()

    if (error) throw error

    emit('success', job.id)
    emit('close')
  } catch (err: any) {
    error.value = err.message || 'Failed to save job'
  } finally {
    loading.value = false
  }
}
```

**Acceptance Criteria:**
- [ ] Job inserted into database successfully
- [ ] All fields populated correctly
- [ ] Kanban card auto-created via `syncJobsToCards()`
- [ ] Card appears in "Interested" column
- [ ] Success event triggers kanban refresh
- [ ] Modal closes after save
- [ ] Error handling works (duplicate job, network error)

---

## Phase 4: Testing & Documentation (Oct 10-12)

### Duration: 12 hours (4h/day)

### Task 4.1: Integration Testing (8 hours - Oct 10-11)

**Deliverable:** Test results with 20 real job URLs

**Test Matrix:**

| Source | URL Type | Count | Expected Result |
|--------|----------|-------|-----------------|
| LinkedIn | linkedin.com/jobs | 5 | Jina AI success ≥80% |
| Indeed | indeed.com | 5 | Jina AI success ≥85% |
| Company Sites | Various | 5 | Jina AI success ≥70% |
| ATS Systems | Greenhouse, Lever | 5 | Jina AI success ≥75% |

**Test Procedure:**
1. Collect 20 real job URLs (4 categories × 5 URLs)
2. For each URL:
   - Enter URL in modal
   - Click "Parse Job Post"
   - Record: Success/Fail, Confidence score, Time elapsed
   - Verify extracted data accuracy (company, position)
3. For failed URLs:
   - Test manual paste fallback
   - Record fallback success rate
4. Calculate metrics:
   - Overall success rate (target: ≥95%)
   - Average confidence score (target: ≥80)
   - Average parse time (target: <10s)

**Test Results Template:**
```markdown
## Test Results: Job Parser

**Date:** 2025-10-10
**Tester:** [Your Name]

### Success Rate by Source

| Source | URLs Tested | Jina AI Success | Fallback Success | Total Success | Avg Confidence |
|--------|-------------|-----------------|------------------|---------------|----------------|
| LinkedIn | 5 | 4 (80%) | 1 (100%) | 5 (100%) | 87% |
| Indeed | 5 | 5 (100%) | 0 | 5 (100%) | 92% |
| Company Sites | 5 | 3 (60%) | 2 (100%) | 5 (100%) | 78% |
| ATS Systems | 5 | 4 (80%) | 1 (100%) | 5 (100%) | 85% |
| **TOTAL** | **20** | **16 (80%)** | **4 (100%)** | **20 (100%)** | **86%** |

### Performance Metrics

- Average parse time: 6.2s
- p95 parse time: 9.8s
- Fastest parse: 2.1s
- Slowest parse: 12.4s

### Issues Found

1. **Issue #1:** LinkedIn CAPTCHA on 1 URL → Fallback worked
2. **Issue #2:** Company site with Thai-only description → Confidence 65%
3. **Issue #3:** Greenhouse URL blocked → Fallback worked
```

**Acceptance Criteria:**
- [ ] 20 real URLs tested
- [ ] Overall success rate ≥95% (including fallback)
- [ ] Average confidence ≥80%
- [ ] Average parse time <10s (p95)
- [ ] Test results documented
- [ ] Issues logged with details

---

### Task 4.2: Documentation (4 hours - Oct 12)

**Deliverable:** Complete documentation set

**Files to create:**

1. **USER_GUIDE.md** (1 hour)
   - How to add job via URL
   - How to add job via manual paste
   - What to do if parsing fails
   - Screenshots (optional)

2. **TESTING_RESULTS.md** (1 hour)
   - Copy test results from Task 4.1
   - Success rate analysis
   - Performance metrics
   - Known limitations

3. **TROUBLESHOOTING.md** (1 hour)
   - Common errors and solutions
   - Why some sites fail (CAPTCHA, auth)
   - How to improve confidence score
   - When to use manual paste

4. **API_USAGE.md** (1 hour)
   - Edge Function deployment guide
   - Environment variables setup
   - Cost monitoring
   - Rate limits

**Acceptance Criteria:**
- [ ] All 4 docs created
- [ ] Clear instructions with examples
- [ ] Test results included
- [ ] Troubleshooting covers common issues
- [ ] API guide covers deployment

---

## Risk Management

### High-Risk Items

**Risk 1: Jina AI Downtime**
- **Likelihood:** Low
- **Impact:** High (blocks URL parsing)
- **Mitigation:** Manual paste always available, monitor Jina AI status
- **Fallback:** Display clear error message, guide user to paste mode

**Risk 2: Low Confidence Scores**
- **Likelihood:** Medium (10-20% of jobs)
- **Impact:** Medium (user must review)
- **Mitigation:** Preview step catches low confidence, user can edit
- **Action:** Track confidence scores, improve prompt if avg <80%

**Risk 3: Claude API Rate Limits**
- **Likelihood:** Low (100 jobs/month well within limits)
- **Impact:** High (blocks all parsing)
- **Mitigation:** Monitor usage, add retry logic
- **Fallback:** Queue requests, show "Please try again in 1 minute"

**Risk 4: Database Migration Issues**
- **Likelihood:** Low
- **Impact:** High (blocks deployment)
- **Mitigation:** Test locally first, have rollback script ready
- **Action:** Test migration on 3 scenarios:
  1. Empty database
  2. Database with existing jobs
  3. Rollback and re-apply

---

## Daily Standups (Async)

### Oct 7 (End of Day)
**Completed:**
- [ ] Database migration deployed
- [ ] Edge Function deployed
- [ ] Tested with 3 sample URLs

**Blockers:**
- None

**Tomorrow:**
- Frontend modal implementation

---

### Oct 8 (End of Day)
**Completed:**
- [ ] JobParserModal component
- [ ] API integration working
- [ ] Manual testing passed

**Blockers:**
- None

**Tomorrow:**
- Integrate with KanbanBoard

---

### Oct 9 (End of Day)
**Completed:**
- [ ] Button added to kanban header
- [ ] End-to-end flow working
- [ ] Database save tested

**Blockers:**
- None

**Tomorrow:**
- Start integration testing (20 URLs)

---

### Oct 10-11 (End of Day)
**Completed:**
- [ ] 20 URLs tested
- [ ] Success rate: __%
- [ ] Issues logged

**Blockers:**
- [List any blockers]

**Tomorrow:**
- Documentation

---

### Oct 12 (End of Day)
**Completed:**
- [ ] All documentation written
- [ ] Feature demo ready
- [ ] MVP shipped

**Next Steps:**
- Monitor usage
- Gather feedback
- Plan Phase 2 enhancements

---

## Success Criteria

### MVP Launch Checklist

**Technical:**
- [ ] Database migration deployed
- [ ] Edge Function deployed and tested
- [ ] Frontend modal working
- [ ] KanbanBoard integration complete
- [ ] End-to-end flow tested

**Quality:**
- [ ] 20 real URLs tested
- [ ] Overall success rate ≥95%
- [ ] Average confidence ≥80%
- [ ] Parse time <10s (p95)
- [ ] No critical bugs

**Documentation:**
- [ ] User guide written
- [ ] Testing results documented
- [ ] Troubleshooting guide complete
- [ ] API deployment guide complete

**Demo:**
- [ ] Can demo URL parsing (success)
- [ ] Can demo manual paste (success)
- [ ] Can demo fallback (URL fails → paste works)
- [ ] Can show test results (20 URLs)

---

## Post-MVP Iteration Plan

### Week 2 (Oct 14-20): Monitoring & Feedback

**Goals:**
- Monitor actual usage (10+ jobs added)
- Track success rate in production
- Gather user feedback
- Fix any critical bugs

**Metrics to track:**
- Daily job adds (target: 3-5/day)
- Success rate by source (Jina AI vs fallback)
- Average confidence score
- Parse time distribution
- Cost per job (track Claude API usage)

---

### Week 3-4 (Oct 21-Nov 3): Phase 2 Enhancements

**Potential features (prioritize based on feedback):**
1. Match percentage calculation (vs master profile)
2. Job description summarization (TL;DR)
3. Skills gap analysis (requirements vs your skills)
4. Salary normalization (USD/THB/EUR conversion)
5. Company research auto-fetch (Glassdoor, LinkedIn)

**Decision criteria:**
- Must have >80% user request rate
- Must improve job search efficiency >20%
- Must be feasible within 8 hours implementation

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Tech Lead | Initial implementation plan |

---

**Status:** ✅ Approved - Ready to Start Oct 7
**Sprint Duration:** 6 days (Oct 7-12)
**Estimated Effort:** 24 hours
**Success Criteria:** 95%+ success rate, <10s parse time, all docs complete
