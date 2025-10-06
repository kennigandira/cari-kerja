# Implementation Plan - CV Upload & Extraction

**Version:** 1.0
**Date:** October 6, 2025
**Status:** Ready for Execution (when feature approved)
**Total Effort:** 30-35 hours across 4-5 weeks

---

## Overview

This document outlines the phased implementation strategy for CV Upload & Extraction feature, designed to minimize risk and validate demand at each stage before further investment.

**Philosophy:** Incremental validation - build only what's validated by user behavior.

---

## Sprint 0: Validation Spike (1 week)

### Goal
Determine if Claude API can reliably extract CV data before committing to full build.

### Tasks

#### Task 1: Setup & Preparation (2 hours)
- [ ] Create Anthropic API account
- [ ] Get API key (test environment)
- [ ] Install Claude SDK locally: `npm install @anthropic-ai/sdk`
- [ ] Setup test environment

#### Task 2: Collect Test Dataset (1 hour)
- [ ] Gather 10+ diverse CV samples:
  - 3× PDF (clean, text-based)
  - 2× PDF (complex layout, multi-column)
  - 2× DOCX (standard format)
  - 2× DOCX (with tables)
  - 1× Long CV (5+ pages, 10+ jobs)
- [ ] Manually note ground truth for each CV (for accuracy comparison)

#### Task 3: Prompt Engineering (3 hours)
- [ ] Draft initial extraction prompt
- [ ] Test with 3 sample CVs
- [ ] Iterate based on output quality
- [ ] Document final prompt template
- [ ] Test edge cases (missing sections, unusual formats)

#### Task 4: Accuracy Testing (2 hours)
- [ ] Run extraction on all 10 CVs
- [ ] Compare extracted vs actual data field-by-field
- [ ] Calculate accuracy percentage per field type:
  - Name, email (target: >95%)
  - Work experience (target: >85%)
  - Skills (target: >80%)
  - Education (target: >75%)
- [ ] Document common failure patterns

#### Task 5: Performance & Cost Analysis (1 hour)
- [ ] Measure extraction time for each CV
- [ ] Calculate 95th percentile latency
- [ ] Count tokens used per CV
- [ ] Calculate cost per extraction
- [ ] Project monthly costs for 1, 100, 1000 users

### Deliverable: Spike Report

```markdown
# Sprint 0 Spike Report: Claude API for CV Extraction

## Executive Summary
- **Recommendation:** GO / NO-GO
- **Confidence:** High / Medium / Low

## Test Results

### Accuracy (10 CVs tested)
| Field Type | Accuracy | Notes |
|------------|----------|-------|
| Name | 95% | High confidence |
| Email | 90% | Some format issues |
| Phone | 75% | International format inconsistent |
| Work Experience | 87% | Date extraction reliable |
| Skills | 82% | Categorization needs work |
| Education | 80% | Sometimes missed |

**Overall Accuracy:** X%

### Performance
- **Average extraction time:** X seconds
- **95th percentile:** X seconds
- **Longest:** X seconds (Y-page CV)

### Cost Analysis
- **Tokens per CV:** X input, Y output
- **Cost per extraction:** $X
- **Monthly projection:**
  - 1 user (2 uploads): $0.10
  - 100 users (200 uploads): $10
  - 1000 users (5000 uploads): $250

## Go/No-Go Recommendation

**GO if:**
- [x] Accuracy >80% on structured fields
- [x] Extraction time <30 seconds (95th percentile)
- [x] Cost <$0.15 per extraction
- [x] Clear plan for handling failures

**NO-GO if:**
- [ ] Accuracy <70%
- [ ] Extraction time >45 seconds consistently
- [ ] Cost >$0.20 per extraction
- [ ] Too many edge cases to handle

## Next Steps
- If GO: Proceed to Sprint 1 (File Upload UI)
- If NO-GO: Consider alternatives or defer feature
```

**Decision Point:** Only proceed if all GO criteria met.

---

## Phase 3.1: File Upload Infrastructure (Week 1, 8 hours)

### Goal
Users can upload CV files and see them stored (NO AI extraction yet).
Validate that upload workflow provides value.

### Tasks

#### Day 1-2: Backend Setup (4 hours)

**Task 1.1: Create Supabase Storage Bucket (30 min)**
```bash
# Create via Supabase Dashboard or SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', false);

# Configure file size limit
UPDATE storage.buckets
SET file_size_limit = 10485760 -- 10MB
WHERE id = 'cv-uploads';
```

**Task 1.2: Create cv_uploads Table (1 hour)**
```sql
-- Create migration: XXX_add_cv_uploads_table.sql
CREATE TABLE cv_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  profile_id UUID REFERENCES master_profiles(id) ON DELETE SET NULL,

  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,

  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT valid_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  CONSTRAINT valid_mime_type CHECK (mime_type IN ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  CONSTRAINT has_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Deploy migration
cd supabase && npx supabase db push
```

**Task 1.3: Configure RLS Policies (1 hour)**
```sql
-- Copy policies from SecurityAnalysis.md
-- Test with SQL Editor:
-- 1. Create test user
-- 2. Insert test upload
-- 3. Query as different user (should fail)
-- 4. Query as same user (should succeed)
```

**Task 1.4: Configure Storage Bucket Policies (30 min)**
```sql
-- Apply policies from SecurityAnalysis.md
-- Test upload/download/delete permissions
```

**Task 1.5: Create Upload Edge Function Stub (1 hour)**
```typescript
// supabase/functions/cv-upload/index.ts
import { serve } from 'std/http/server.ts';

serve(async (req) => {
  const formData = await req.formData();
  const file = formData.get('cv') as File;

  // Validate, upload to storage, create db record
  // Return upload_id (no extraction yet)

  return new Response(JSON.stringify({ upload_id: '...' }));
});
```

#### Day 3-4: Frontend UI (3 hours)

**Task 2.1: Create ProfileCreationModal.vue (1 hour)**
- Component with "Upload CV" and "Manual Entry" options
- Styling and responsiveness
- Unit tests

**Task 2.2: Create CVUploadModal.vue Skeleton (1.5 hours)**
- File input with drag-and-drop
- Progress bar
- Validation and error messages
- Connected to upload Edge Function

**Task 2.3: Integrate in ProfilesListView (30 min)**
- Modify button click handler
- Add modal state management
- Test navigation flow

#### Day 5: Testing (1 hour)

- [ ] Upload valid PDF → Success
- [ ] Upload valid DOCX → Success
- [ ] Upload .txt file → Error
- [ ] Upload 15MB file → Error
- [ ] Cancel upload → File removed
- [ ] RLS test: Cannot access others' files

### Success Criteria (Phase 3.1)
- ✅ Users can upload files successfully
- ✅ Files stored securely in Supabase Storage
- ✅ RLS prevents unauthorized access
- ✅ Clear error messages for invalid files

### Decision Point
**After Phase 3.1:**
- Do users actually upload CVs? (usage metric)
- Is upload workflow valuable on its own?
- **If YES:** Proceed to Phase 3.2
- **If NO:** Stop here, focus elsewhere

---

## Phase 3.2: Manual Reference (Week 2, 4 hours)

### Goal
Users can view uploaded CV while manually filling form.
Measure if auto-extraction would provide additional value.

### Tasks

#### Task 1: Add "View CV" Link to ProfileForm (2 hours)

```typescript
// ProfileForm.vue
<template>
  <div class="profile-form">
    <!-- NEW: Uploaded CV reference -->
    <div v-if="uploadedCVPath" class="cv-reference">
      <p>Your uploaded CV:</p>
      <button @click="showCV">View CV</button>
      <p class="hint">Reference your CV while filling out the form</p>
    </div>

    <!-- Existing form fields -->
  </div>
</template>

<script setup lang="ts">
async function showCV() {
  // Get signed URL from Supabase Storage
  const { data } = await supabase.storage
    .from('cv-uploads')
    .createSignedUrl(uploadedCVPath, 3600); // 1 hour

  // Open in new tab or modal
  window.open(data.signedUrl, '_blank');
}
</script>
```

#### Task 2: Track Usage Metrics (1 hour)

```sql
-- Add tracking columns
ALTER TABLE cv_uploads ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE cv_uploads ADD COLUMN last_viewed_at TIMESTAMPTZ;

-- Track when users view their CV
CREATE OR REPLACE FUNCTION log_cv_view(p_upload_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE cv_uploads
  SET view_count = view_count + 1,
      last_viewed_at = NOW()
  WHERE id = p_upload_id;
END;
$$;
```

**Metrics to Track:**
- Upload rate: X% of profile creations include upload
- View rate: X% of uploads are viewed while filling form
- Completion rate: X% of uploads lead to saved profiles
- Time with CV open: Average X minutes

#### Task 3: User Feedback Survey (1 hour)

**Add to ProfileForm after save:**
```vue
<div v-if="wasUploadUsed" class="feedback-prompt">
  <p>Quick question: Was uploading your CV helpful?</p>
  <button @click="submitFeedback('yes')">Yes, very helpful</button>
  <button @click="submitFeedback('somewhat')">Somewhat helpful</button>
  <button @click="submitFeedback('no')">No, I still typed everything</button>
</div>
```

**Questions to Ask:**
1. Was uploading your CV helpful?
2. Would auto-extraction save you time?
3. What fields were hardest to fill?

### Success Criteria (Phase 3.2)
- ✅ 50%+ of users who upload CV complete profile
- ✅ Users report upload is helpful (>60% positive feedback)
- ✅ Clear demand for auto-extraction (>70% request it)

### Decision Point
**After Phase 3.2:**
- **GO to Phase 3.3 if:** >70% request auto-extraction
- **STOP if:** <30% upload CVs or find it helpful

---

## Phase 3.3: AI Extraction (Week 3-4, 18 hours)

### Prerequisites
- ✅ Phase 3.1 completed
- ✅ Phase 3.2 validated demand
- ✅ Sprint 0 spike completed with GO decision
- ✅ Budget approved for AI costs

### Tasks

#### Week 3: Backend Implementation (10 hours)

**Task 1: Create cv_extraction_tasks Table (1 hour)**
```sql
-- Migration: XXX_add_cv_extraction_tasks.sql
-- Copy schema from TechnicalSpecification.md Section 3.1
```

**Task 2: Create Extraction Worker Edge Function (4 hours)**
```typescript
// supabase/functions/cv-extract-worker/index.ts

import { serve } from 'std/http/server.ts';
import Anthropic from '@anthropic-ai/sdk';
import pdfParse from 'pdf-parse'; // Note: May need Deno-compatible version

serve(async (req) => {
  const { task_id } = await req.json();

  // 1. Get task from database
  const task = await getTask(task_id);

  // 2. Update status to 'processing'
  await updateTaskStatus(task_id, 'processing');

  try {
    // 3. Download CV from Storage
    const cvFile = await downloadFromStorage(task.file_path);

    // 4. Extract text (PDF or DOCX)
    const text = await extractText(cvFile, task.mime_type);

    // 5. Call Claude API
    const extraction = await callClaudeAPI(text);

    // 6. Validate and parse response
    const validated = validateExtraction(extraction);

    // 7. Save results
    await updateTaskResult(task_id, 'completed', validated);
  } catch (error) {
    // 8. Handle errors
    await updateTaskResult(task_id, 'failed', null, error.message);
  }
});
```

**Task 3: Implement Text Extraction (2 hours)**
- PDF parsing (pdf-parse or Deno alternative)
- DOCX parsing (mammoth.js or similar)
- Error handling for corrupted files

**Task 4: Claude API Integration (2 hours)**
- Use prompt template from spike
- Parse JSON response
- Handle API errors, timeouts
- Implement retry logic

**Task 5: Background Worker Trigger (1 hour)**
```sql
-- Option A: pg_cron (if available)
SELECT cron.schedule(
  'process-cv-extractions',
  '*/10 * * * * *', -- Every 10 seconds
  $$
  SELECT http_post(
    'https://[project].supabase.co/functions/v1/cv-extract-worker',
    jsonb_build_object('task_id', id)
  )
  FROM cv_extraction_tasks
  WHERE status = 'pending'
  ORDER BY created_at
  LIMIT 1;
  $$
);

-- Option B: Supabase Realtime trigger (webhook)
-- Configure in Supabase Dashboard
```

#### Week 4: Frontend Implementation (8 hours)

**Task 6: Extraction Status Polling (2 hours)**
```typescript
// composables/useCVExtraction.ts
export function useCVExtraction() {
  const pollExtractionStatus = async (taskId: string) => {
    const maxAttempts = 30; // 60 seconds
    for (let i = 0; i < maxAttempts; i++) {
      const { data } = await supabase
        .from('cv_extraction_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (data.status === 'completed' || data.status === 'failed') {
        return data;
      }

      await sleep(2000); // Poll every 2 seconds
    }
    throw new Error('Extraction timeout');
  };

  return { pollExtractionStatus };
}
```

**Task 7: Extraction Status UI (2 hours)**
```vue
<!-- ExtractionStatusModal.vue -->
<template>
  <div class="modal">
    <div v-if="status === 'processing'">
      <Spinner />
      <p>Analyzing your CV...</p>
      <p class="elapsed">{{ elapsedSeconds }}s elapsed</p>
      <ProgressBar :value="progress" />
    </div>
  </div>
</template>
```

**Task 8: Form Pre-population Logic (2 hours)**
```typescript
// Modify ProfileCreateView.vue
async function handleExtractionComplete(data: ExtractedCVData) {
  // Pre-fill form
  formData.value = {
    ...formData.value,
    ...data.extracted_data
  };

  // Store confidence scores for display
  confidenceScores.value = data.confidence_scores;

  // Navigate to form
  router.push({ name: 'profile-create', query: { from: 'extraction' } });
}
```

**Task 9: Confidence Score Display (1 hour)**
```vue
<!-- In ProfileForm.vue -->
<div v-for="field in fieldsWithLowConfidence" class="field-warning">
  <label>{{ field.label }}</label>
  <input v-model="formData[field.name]" />
  <span class="confidence-warning">
    ⚠️ Low confidence ({{ (field.confidence * 100).toFixed(0) }}%) - Please verify
  </span>
</div>
```

**Task 10: Integration Testing (1 hour)**
- [ ] Full flow: Upload → Extract → Review → Save
- [ ] Test with all 10 CVs from spike
- [ ] Verify accuracy in real UI
- [ ] Test error scenarios

### Success Criteria (Phase 3.3)
- ✅ 90%+ extraction success rate
- ✅ <20 second extraction time (95th percentile)
- ✅ Confidence scores displayed correctly
- ✅ Users can edit extracted data
- ✅ Validation errors shown clearly

### Decision Point
**After Phase 3.3:**
- **LAUNCH:** If all criteria met, enable feature
- **ITERATE:** If issues found, fix and retest
- **ABANDON:** If fundamentally broken, document lessons learned

---

## Testing Strategy

### Unit Tests (Per Sprint)

**Sprint 1 Tests:**
```typescript
describe('File Upload', () => {
  it('validates file type');
  it('validates file size');
  it('uploads to Supabase Storage');
  it('creates cv_uploads record');
});
```

**Sprint 2 Tests:**
```typescript
describe('AI Extraction', () => {
  it('extracts text from PDF');
  it('calls Claude API correctly');
  it('parses JSON response');
  it('validates extracted data');
  it('handles API errors');
});
```

### Integration Tests

```typescript
// tests/integration/cvExtractionFlow.test.ts
describe('CV Extraction Flow', () => {
  it('uploads file to storage', async () => {
    const result = await uploadCV(testFile);
    expect(result.upload_id).toBeDefined();
  });

  it('creates extraction task after upload', async () => {
    const { task_id } = await uploadCV(testFile);
    const task = await getTask(task_id);
    expect(task.status).toBe('pending');
  });

  it('extraction completes successfully', async () => {
    const { task_id } = await uploadCV(testFile);
    const result = await waitForExtraction(task_id);
    expect(result.status).toBe('completed');
    expect(result.extracted_data.full_name).toBeTruthy();
  });
});
```

### E2E Tests (Playwright)

```typescript
test('complete CV upload flow', async ({ page }) => {
  await page.goto('/profiles');
  await page.click('text=Create New Profile');
  await page.click('text=Upload CV');
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample-cv.pdf');
  await page.click('text=Upload & Continue');

  // Wait for extraction
  await expect(page.locator('text=Extraction Complete')).toBeVisible({ timeout: 30000 });

  // Verify form populated
  await expect(page.locator('#full-name')).toHaveValue('John Doe');

  // Save profile
  await page.click('text=Save Profile');
  await expect(page).toHaveURL('/profiles');
});
```

### AI Quality Tests (Manual)

**Critical:** AI is non-deterministic. Must test with real CVs.

**Test Dataset:**
- Simple CV (1-2 pages, clean layout)
- Complex CV (multi-column, tables)
- Long CV (5+ pages, 10+ jobs)
- International CV (non-US phone/date formats)
- Creative CV (unusual design)

**For Each CV:**
1. Run extraction
2. Manually compare extracted vs actual
3. Note errors (false positives, missing data)
4. Calculate accuracy per field
5. Document failure patterns

**Quality Gates:**
- Name extraction: >95% accuracy
- Email extraction: >95% accuracy
- Work experience: >85% accuracy
- Skills: >80% accuracy
- Overall: >85% accuracy

**If quality gates NOT met:** Iterate on prompt engineering or abandon feature.

---

## Rollback Plan

### Feature Flags

```typescript
// frontend/src/utils/featureFlags.ts
export const FEATURE_FLAGS = {
  CV_UPLOAD_ENABLED: import.meta.env.VITE_ENABLE_CV_UPLOAD === 'true',
  CV_EXTRACTION_ENABLED: import.meta.env.VITE_ENABLE_CV_EXTRACTION === 'true'
} as const;

export function isCVUploadEnabled(): boolean {
  return FEATURE_FLAGS.CV_UPLOAD_ENABLED;
}

export function isCVExtractionEnabled(): boolean {
  return FEATURE_FLAGS.CV_EXTRACTION_ENABLED && FEATURE_FLAGS.CV_UPLOAD_ENABLED;
}
```

**Usage:**
```vue
<!-- ProfilesListView.vue -->
<button
  v-if="isCVUploadEnabled()"
  @click="showCreationModal = true"
>
  Create New Profile
</button>
<button
  v-else
  @click="router.push('/profiles/new')"
>
  Create New Profile
</button>
```

### Rollback Scenarios

**Scenario 1: Extraction Accuracy Too Low**
- Disable: `VITE_ENABLE_CV_EXTRACTION=false`
- Keep: File upload UI (users can still upload for manual reference)
- Action: Iterate on prompt engineering offline

**Scenario 2: API Cost Spike**
- Immediate: Set Anthropic budget hard limit to $60
- Monitor: Check cost dashboard hourly
- If continues: Disable extraction, investigate abuse
- Fix: Add stricter rate limiting (3 uploads/hour instead of 5)

**Scenario 3: User Confusion/Complaints**
- Gather: Detailed feedback from users
- Analyze: What's confusing? (extraction errors? bad UX?)
- Quick fix: Improve error messages and help text
- If unfixable: Disable and revert to manual-only

**Scenario 4: Critical Bug**
- Immediate: Disable feature via flag
- No database changes needed (soft launch)
- Fix offline and redeploy
- Re-enable after validation

### Rollback Procedure

```bash
# 1. Disable feature
export VITE_ENABLE_CV_EXTRACTION=false

# 2. Rebuild frontend
npm run build

# 3. Redeploy
# (deployment command for your setup)

# 4. Verify feature hidden
# Test: "Create New Profile" should navigate directly to form
```

**Recovery Time:** <15 minutes

---

## Production Deployment Checklist

### Before Deploying to Production

**Infrastructure:**
- [ ] Supabase Storage bucket `cv-uploads` created
- [ ] RLS policies applied and tested
- [ ] Edge Functions deployed (`cv-upload`, `cv-extract-worker`)
- [ ] pg_cron job scheduled (if using cron)
- [ ] Anthropic API key configured in secrets

**Database:**
- [ ] Migration XXX_cv_uploads table applied
- [ ] Migration XXX_cv_extraction_tasks table applied
- [ ] Migration XXX_rate_limits table applied
- [ ] All RLS policies verified

**Frontend:**
- [ ] Feature flag configured
- [ ] All components tested
- [ ] Build passes without errors
- [ ] Bundle size acceptable (<500KB increase)

**Security:**
- [ ] RLS policies tested (cannot access others' data)
- [ ] API key not exposed in client code
- [ ] Rate limiting tested (blocks after 5 uploads)
- [ ] File validation tested (rejects malicious files)

**Monitoring:**
- [ ] Anthropic budget alert configured ($50/month)
- [ ] Error tracking enabled (Sentry or similar)
- [ ] Usage analytics configured
- [ ] Cost monitoring dashboard setup

**Documentation:**
- [ ] User guide created (how to upload CV)
- [ ] Support docs (troubleshooting extraction errors)
- [ ] Developer docs (how to modify extraction prompt)

---

## Monitoring & Observability

### Metrics to Track

**Upload Metrics:**
```sql
-- Daily upload volume
SELECT DATE(uploaded_at), COUNT(*)
FROM cv_uploads
WHERE uploaded_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(uploaded_at);
```

**Extraction Metrics:**
```sql
-- Success rate
SELECT
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM cv_extraction_tasks
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;

-- Average extraction time
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))
FROM cv_extraction_tasks
WHERE status = 'completed'
  AND completed_at > NOW() - INTERVAL '7 days';
```

**Cost Metrics:**
```sql
-- Daily AI API costs (estimated)
SELECT
  DATE(created_at),
  COUNT(*) as extractions,
  COUNT(*) * 0.05 as estimated_cost_usd
FROM cv_extraction_tasks
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);
```

### Alerts

**Setup in monitoring tool:**
- 🚨 **Critical:** API costs >$60/month
- ⚠️ **Warning:** Extraction failure rate >20%
- ⚠️ **Warning:** Average extraction time >40 seconds
- ℹ️ **Info:** Extraction success rate >95%

---

## Post-Launch Activities

### Week 1 Post-Launch
- [ ] Monitor error rates daily
- [ ] Review extraction quality (sample 10 random extractions)
- [ ] Check cost dashboard (should be <$10 for first week)
- [ ] Gather user feedback
- [ ] Fix any critical bugs

### Week 2-4 Post-Launch
- [ ] Analyze usage patterns (how many use upload vs manual?)
- [ ] Review extraction accuracy trends
- [ ] Optimize prompt based on common errors
- [ ] Consider adding more supported formats (if requested)

### Month 2-3 Post-Launch
- [ ] Decide: Keep, enhance, or deprecate feature
- [ ] If keeping: Plan enhancements (better AI model, more formats)
- [ ] If deprecating: Sunset plan and user migration

---

**Last Updated:** October 6, 2025
**Status:** Implementation plan ready, pending go decision
**Next Steps:** Complete Sprint 0 spike to validate feasibility
