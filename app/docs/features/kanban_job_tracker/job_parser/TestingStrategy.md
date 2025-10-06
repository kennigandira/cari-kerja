# Testing Strategy: AI-Powered Job Parser

**Version:** 1.0
**Date:** October 6, 2025
**Status:** Approved
**Related:** ImplementationPlan.md, TechnicalArchitecture.md

---

## Overview

This document outlines the comprehensive testing strategy for the AI-Powered Job Parser feature. Testing is organized into 4 levels: Unit, Integration, End-to-End, and Performance.

**Goal:** Achieve 95%+ automated extraction success rate with <10s parse time (p95).

---

## Testing Pyramid

```
           /\
          /  \   E2E Tests (Manual)
         /____\  5 critical flows
        /      \
       / Integration \ 20 real URLs
      /______________ \
     /                \
    /   Unit Tests     \ 10+ test cases
   /____________________\
```

---

## Test Levels

### Level 1: Unit Tests (Backend)

**Scope:** Edge Function modules in isolation

**Files to test:**
- `jina-reader.ts` - URL fetching
- `claude-extractor.ts` - AI extraction
- `validators.ts` - Input validation

**Test Framework:** Deno built-in test runner

**Location:** `app/supabase/functions/parse-job-post/__tests__/`

---

#### Test Suite 1: Jina AI Reader

**File:** `jina-reader.test.ts`

```typescript
import { assertEquals, assertRejects } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { fetchJobContent } from '../jina-reader.ts'

Deno.test('fetchJobContent - success with valid URL', async () => {
  const content = await fetchJobContent('https://jobs.lever.co/shopify/example')
  assertEquals(typeof content, 'string')
  assertEquals(content.length > 100, true)
})

Deno.test('fetchJobContent - throws on 404', async () => {
  await assertRejects(
    async () => await fetchJobContent('https://nonexistent-site.com/job'),
    Error,
    'Job not found'
  )
})

Deno.test('fetchJobContent - throws on CAPTCHA (403)', async () => {
  await assertRejects(
    async () => await fetchJobContent('https://protected-site.com/job'),
    Error,
    'Site blocked by CAPTCHA'
  )
})

Deno.test('fetchJobContent - throws on empty content', async () => {
  // Mock response with empty body
  await assertRejects(
    async () => await fetchJobContent('https://empty-content.com/job'),
    Error,
    'Empty or invalid content'
  )
})
```

**Acceptance Criteria:**
- [ ] All 4 tests pass
- [ ] Success case returns markdown string
- [ ] Error cases throw descriptive errors
- [ ] Test coverage ≥90%

---

#### Test Suite 2: Claude Extractor

**File:** `claude-extractor.test.ts`

```typescript
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { extractStructuredData } from '../claude-extractor.ts'

Deno.test('extractStructuredData - extracts from clear job post', async () => {
  const jobPost = `
    Senior Frontend Engineer at Airbnb
    Location: Bangkok, Thailand
    Salary: 80,000 - 120,000 THB/month

    We are seeking a Senior Frontend Engineer to join our team...
  `

  const result = await extractStructuredData(jobPost)

  assertEquals(result.company_name, 'Airbnb')
  assertEquals(result.position_title, 'Senior Frontend Engineer')
  assertEquals(result.location, 'Bangkok, Thailand')
  assertEquals(result.salary_range, '80,000 - 120,000 THB/month')
  assertEquals(result.confidence >= 80, true)
})

Deno.test('extractStructuredData - low confidence on ambiguous post', async () => {
  const jobPost = 'Looking for an engineer. Email jobs@company.com'

  const result = await extractStructuredData(jobPost)

  assertEquals(result.confidence < 50, true)
  assertEquals(result.company_name, null)
})

Deno.test('extractStructuredData - handles Thai/English mixed content', async () => {
  const jobPost = `
    Senior Frontend Engineer (วิศวกรซอฟต์แวร์)
    บริษัท: Grab Thailand
    สถานที่: กรุงเทพมหานคร

    We are hiring a frontend engineer...
  `

  const result = await extractStructuredData(jobPost)

  assertEquals(result.company_name, 'Grab Thailand')
  assertEquals(result.confidence >= 70, true)
})
```

**Acceptance Criteria:**
- [ ] All 3 tests pass
- [ ] High confidence (≥80) for clear posts
- [ ] Low confidence (<50) for ambiguous posts
- [ ] Handles Thai/English mixed content
- [ ] Test coverage ≥85%

---

#### Test Suite 3: Validators

**File:** `validators.test.ts`

```typescript
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { validateUrl, validateExtractedData } from '../validators.ts'

Deno.test('validateUrl - accepts valid HTTPS URL', () => {
  assertEquals(validateUrl('https://jobs.company.com/position'), true)
})

Deno.test('validateUrl - rejects HTTP', () => {
  assertEquals(validateUrl('http://jobs.company.com/position'), false)
})

Deno.test('validateUrl - rejects localhost', () => {
  assertEquals(validateUrl('https://localhost/job'), false)
  assertEquals(validateUrl('https://127.0.0.1/job'), false)
})

Deno.test('validateUrl - rejects internal IPs (SSRF protection)', () => {
  assertEquals(validateUrl('https://192.168.1.1/job'), false)
  assertEquals(validateUrl('https://10.0.0.1/job'), false)
})

Deno.test('validateExtractedData - accepts valid data', () => {
  const data = {
    company_name: 'Airbnb',
    position_title: 'Engineer',
    confidence: 95
  }

  const result = validateExtractedData(data)
  assertEquals(result.valid, true)
})

Deno.test('validateExtractedData - rejects missing company', () => {
  const data = {
    company_name: null,
    position_title: 'Engineer',
    confidence: 95
  }

  const result = validateExtractedData(data)
  assertEquals(result.valid, false)
  assertEquals(result.code, 'MISSING_REQUIRED_FIELDS')
})

Deno.test('validateExtractedData - rejects low confidence', () => {
  const data = {
    company_name: 'Airbnb',
    position_title: 'Engineer',
    confidence: 35
  }

  const result = validateExtractedData(data)
  assertEquals(result.valid, false)
  assertEquals(result.code, 'LOW_CONFIDENCE')
})
```

**Acceptance Criteria:**
- [ ] All 7 tests pass
- [ ] SSRF protection verified (blocks internal IPs)
- [ ] Validation catches missing required fields
- [ ] Validation catches low confidence
- [ ] Test coverage ≥95%

---

### Level 2: Integration Tests (20 Real URLs)

**Scope:** End-to-end Edge Function with real job URLs

**Test Date:** October 10-11, 2025

**Test Matrix:**

| Category | Job Board | Count | Target Success Rate |
|----------|-----------|-------|---------------------|
| 1 | LinkedIn Jobs | 5 | ≥80% (Jina AI) + 100% (fallback) |
| 2 | Indeed | 5 | ≥85% |
| 3 | Company Career Pages | 5 | ≥70% |
| 4 | ATS Systems (Greenhouse, Lever) | 5 | ≥75% |

**Total:** 20 URLs, Target: ≥95% overall success (including fallback)

---

#### Test Procedure

**For each URL:**

1. **Parse via URL:**
   ```bash
   curl -X POST https://<project>.supabase.co/functions/v1/parse-job-post \
     -H "Authorization: Bearer <anon-key>" \
     -H "Content-Type: application/json" \
     -d '{"url": "<test-url>"}'
   ```

2. **Record metrics:**
   - Success: Yes/No
   - Confidence score: 0-100
   - Parse time: seconds
   - Extracted data accuracy: Company, Position, Location, Salary

3. **If URL fails:**
   - Copy job description manually
   - Test manual paste fallback
   - Record fallback success: Yes/No

4. **Verify data quality:**
   - Company name correct: Yes/No
   - Position title correct: Yes/No
   - Description complete: Yes/No

---

#### Test URLs (Examples)

**LinkedIn (5 URLs):**
1. https://www.linkedin.com/jobs/view/senior-frontend-engineer-at-airbnb-12345
2. https://www.linkedin.com/jobs/view/frontend-developer-at-grab-67890
3. https://www.linkedin.com/jobs/view/react-engineer-at-agoda-11111
4. https://www.linkedin.com/jobs/view/vue-developer-at-lazada-22222
5. https://www.linkedin.com/jobs/view/software-engineer-at-line-33333

**Indeed (5 URLs):**
1. https://th.indeed.com/viewjob?jk=abc123
2. https://th.indeed.com/viewjob?jk=def456
3. https://th.indeed.com/viewjob?jk=ghi789
4. https://th.indeed.com/viewjob?jk=jkl012
5. https://th.indeed.com/viewjob?jk=mno345

**Company Sites (5 URLs):**
1. https://careers.google.com/jobs/results/12345
2. https://www.apple.com/careers/us/12345
3. https://careers.microsoft.com/us/en/job/12345
4. https://www.shopify.com/careers/12345
5. https://www.gitlab.com/jobs/12345

**ATS Systems (5 URLs):**
1. https://jobs.lever.co/shopify/12345 (Lever)
2. https://boards.greenhouse.io/airbnb/jobs/12345 (Greenhouse)
3. https://jobs.workable.com/view/12345 (Workable)
4. https://apply.workable.com/company/j/12345 (Workable)
5. https://company.bamboohr.com/jobs/view.php?id=12345 (BambooHR)

---

#### Test Results Template

**File:** `TESTING_RESULTS.md`

```markdown
# Job Parser Testing Results

**Test Date:** October 10-11, 2025
**Tester:** [Your Name]
**Environment:** Production (Supabase + Claude Sonnet 4.5)

## Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Overall Success Rate | ≥95% | __%  | ✅/❌ |
| Avg Confidence Score | ≥80 | __ | ✅/❌ |
| Avg Parse Time (p95) | <10s | __s | ✅/❌ |
| Jina AI Success Rate | ≥75% | __% | ✅/❌ |
| Fallback Success Rate | 100% | __% | ✅/❌ |

## Detailed Results

### LinkedIn Jobs (5 URLs)

| # | URL | Jina AI | Confidence | Time | Company | Position | Notes |
|---|-----|---------|------------|------|---------|----------|-------|
| 1 | linkedin.com/jobs/12345 | ✅ | 92% | 5.2s | Airbnb | Senior Frontend Engineer | Perfect |
| 2 | linkedin.com/jobs/67890 | ❌ CAPTCHA | - | - | - | - | Fallback: ✅ 88% |
| 3 | ... | | | | | | |

### Indeed (5 URLs)

| # | URL | Jina AI | Confidence | Time | Company | Position | Notes |
|---|-----|---------|------------|------|---------|----------|-------|
| 1 | indeed.com/viewjob?jk=abc123 | ✅ | 95% | 4.1s | Grab | Frontend Developer | Perfect |
| 2 | ... | | | | | | |

### Company Sites (5 URLs)

[Same format]

### ATS Systems (5 URLs)

[Same format]

## Performance Analysis

### Parse Time Distribution

- Fastest: __s
- Slowest: __s
- p50: __s
- p95: __s
- p99: __s

### Confidence Score Distribution

- 90-100: __ jobs (__%)
- 80-89: __ jobs (__%)
- 70-79: __ jobs (__%)
- <70: __ jobs (__%)

## Issues & Learnings

### Issue 1: LinkedIn CAPTCHA
- **Frequency:** 1/5 URLs (20%)
- **Cause:** Anti-bot protection on certain job pages
- **Mitigation:** Manual paste fallback worked 100%
- **Action:** Document in user guide

### Issue 2: Thai-Only Job Posts
- **Frequency:** 2/20 URLs (10%)
- **Impact:** Confidence 60-75% (lower but acceptable)
- **Mitigation:** Sonnet 4.5 handled Thai well
- **Action:** Monitor Thai job performance

### Issue 3: [Add more issues]

## Recommendations

1. **Accept for MVP:** Yes/No
2. **Critical Issues:** [List any blockers]
3. **Nice-to-Have Improvements:** [List enhancements]

## Sign-off

- [ ] Overall success rate ≥95%
- [ ] No critical bugs found
- [ ] Performance targets met
- [ ] Ready for production launch

**Approved By:** [Your Name]
**Date:** [Date]
```

---

### Level 3: End-to-End Tests (Manual)

**Scope:** Complete user flows through UI

**Test Date:** October 9-11, 2025

**Test Scenarios:**

---

#### Scenario 1: Happy Path - URL Parsing

**Steps:**
1. Open kanban board
2. Click "Add Job Target" button
3. Select "Paste job post URL"
4. Enter: https://jobs.airbnb.com/positions/5678
5. Click "Parse Job Post"
6. Wait for preview (should show within 10s)
7. Verify preview data:
   - Company: Airbnb
   - Position: Senior Frontend Engineer
   - Location: Bangkok, Thailand
   - Confidence: ≥80%
8. Click "Confirm & Add to Board"
9. Verify card appears in "Interested" column

**Expected Result:**
- ✅ Modal opens
- ✅ Parse completes successfully
- ✅ Preview shows correct data
- ✅ Card created in kanban
- ✅ Modal closes

**Acceptance Criteria:**
- [ ] All steps complete without errors
- [ ] Parse time <10s
- [ ] Data accuracy 100%

---

#### Scenario 2: Happy Path - Manual Paste

**Steps:**
1. Open kanban board
2. Click "Add Job Target" button
3. Select "Copy & paste job description"
4. Paste full job description (company, position, requirements)
5. Click "Parse Job Post"
6. Wait for preview
7. Verify extracted data
8. Click "Confirm & Add to Board"
9. Verify card appears

**Expected Result:**
- ✅ Textarea appears (10 rows)
- ✅ Parse completes
- ✅ Preview accurate
- ✅ Card created

**Acceptance Criteria:**
- [ ] Manual paste works
- [ ] Extracts company + position
- [ ] Confidence ≥80%

---

#### Scenario 3: Fallback - URL Fails → Manual Paste

**Steps:**
1. Open kanban board
2. Click "Add Job Target"
3. Enter URL that will fail (e.g., CAPTCHA-protected)
4. Click "Parse Job Post"
5. See error: "Unable to access URL"
6. Verify fallback prompt appears
7. Verify input switches to textarea automatically
8. Paste job description manually
9. Click "Parse Job Post" again
10. Verify preview appears
11. Confirm and verify card created

**Expected Result:**
- ✅ Error message clear
- ✅ Fallback prompt helpful
- ✅ Auto-switch to paste mode
- ✅ Manual parse works
- ✅ Card created

**Acceptance Criteria:**
- [ ] Fallback UX smooth
- [ ] No data loss
- [ ] User understands what to do

---

#### Scenario 4: Low Confidence Warning

**Steps:**
1. Paste ambiguous job description (e.g., "Looking for engineer")
2. Parse
3. Verify warning appears: "Extraction confidence is low"
4. Verify preview shows extracted data with warning badge
5. Edit company name manually
6. Confirm
7. Verify card created with corrected data

**Expected Result:**
- ✅ Warning displayed
- ✅ Can edit fields
- ✅ Save works with edits

**Acceptance Criteria:**
- [ ] Warning visible
- [ ] Fields editable
- [ ] Validation prevents save without company/position

---

#### Scenario 5: Error Handling - Network Failure

**Steps:**
1. Disconnect network
2. Try to parse job URL
3. Verify error: "Network error. Please check connection."
4. Reconnect network
5. Retry
6. Verify success

**Expected Result:**
- ✅ Network error caught
- ✅ Retry works after reconnect

**Acceptance Criteria:**
- [ ] Error message clear
- [ ] No crash or stuck state
- [ ] Retry succeeds

---

### Level 4: Performance Tests

**Scope:** Measure parse times and costs

**Test Date:** October 11, 2025

---

#### Performance Test 1: Parse Time Distribution

**Test:** Parse 20 URLs and measure time

**Metrics:**
- p50 (median): Target <5s
- p95: Target <10s
- p99: Target <15s

**Measurement:**
```typescript
const startTime = Date.now()
await supabase.functions.invoke('parse-job-post', {...})
const endTime = Date.now()
const duration = endTime - startTime
console.log(`Parse time: ${duration}ms`)
```

**Acceptance Criteria:**
- [ ] p50 <5s
- [ ] p95 <10s
- [ ] No timeouts (>30s)

---

#### Performance Test 2: Cost Tracking

**Test:** Track Claude API usage for 20 parses

**Metrics:**
- Input tokens per job: Target ~2k
- Output tokens per job: Target ~500
- Cost per job: Target <$0.02

**Measurement:**
```typescript
// Claude API returns token usage
const message = await anthropic.messages.create({...})
console.log('Tokens:', message.usage)
// {input_tokens: 2048, output_tokens: 512}

// Calculate cost
const inputCost = (message.usage.input_tokens / 1_000_000) * 3
const outputCost = (message.usage.output_tokens / 1_000_000) * 15
const totalCost = inputCost + outputCost
```

**Expected Cost (20 jobs):**
- Input: 40k tokens × $3/1M = $0.12
- Output: 10k tokens × $15/1M = $0.15
- Total: ~$0.27 ($0.014/job)

**Acceptance Criteria:**
- [ ] Cost per job <$0.02
- [ ] 20 jobs cost <$0.50
- [ ] No cost overruns

---

## Test Automation

### Unit Tests: Automated

```bash
# Run unit tests
cd app/supabase/functions/parse-job-post
deno test --allow-net --allow-env

# With coverage
deno test --allow-net --allow-env --coverage=coverage
deno coverage coverage
```

**Coverage Targets:**
- jina-reader.ts: ≥90%
- claude-extractor.ts: ≥85%
- validators.ts: ≥95%
- Overall: ≥85%

---

### Integration Tests: Semi-Automated

**Script:** `test-integration.sh`

```bash
#!/bin/bash

# Test 20 URLs from test-urls.txt
while IFS= read -r url; do
  echo "Testing: $url"

  start=$(date +%s%N)
  result=$(curl -s -X POST \
    "https://<project>.supabase.co/functions/v1/parse-job-post" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\"}")
  end=$(date +%s%N)

  duration=$(( (end - start) / 1000000 )) # Convert to ms

  echo "Duration: ${duration}ms"
  echo "Result: $result"
  echo "---"
done < test-urls.txt
```

---

### E2E Tests: Manual

**Checklist:** See Scenario 1-5 above

**Test Frequency:**
- Before each deployment
- After any parser changes
- Weekly in production

---

## Acceptance Criteria Summary

### Unit Tests
- [ ] All 14+ unit tests pass
- [ ] Code coverage ≥85%
- [ ] No regressions

### Integration Tests
- [ ] 20 real URLs tested
- [ ] Success rate ≥95% (Jina AI + fallback)
- [ ] Avg confidence ≥80%
- [ ] Avg parse time <10s (p95)

### E2E Tests
- [ ] All 5 scenarios pass
- [ ] Fallback UX smooth
- [ ] Error handling works
- [ ] No critical bugs

### Performance Tests
- [ ] Parse time p95 <10s
- [ ] Cost per job <$0.02
- [ ] No timeouts

---

## Bug Reporting Template

```markdown
## Bug Report

**Title:** [Short description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Environment:**
- Browser: [Chrome 118, Safari 17, etc.]
- Device: [Desktop, iPhone 15, etc.]
- URL tested: [If applicable]

**Screenshots:**
[Attach if relevant]

**Logs:**
```
[Edge Function logs or console errors]
```

**Impact:**
[How does this affect users?]

**Suggested Fix:**
[If you have ideas]
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | QA Team | Initial testing strategy |

---

**Status:** ✅ Approved - Ready for Testing Oct 10-12
**Test Duration:** 3 days (8h unit + 8h integration + 4h E2E)
**Success Criteria:** All acceptance criteria met, 95%+ success rate
