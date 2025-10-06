# Testing Strategy - Enhanced Kanban Card Detail View

**Version:** 1.0
**Date:** October 6, 2025
**Parent Feature:** Kanban Job Application Tracker
**Test Coverage Target:** 80% (critical paths 100%)

---

## Testing Overview

### Testing Pyramid

```
        E2E Tests
       (5 scenarios)
      ─────────────
    Integration Tests
   (10 test suites)
  ─────────────────────
   Unit Tests
(25+ test cases)
```

### Test Types

1. **Unit Tests:** Component logic, utilities, API clients
2. **Integration Tests:** Component interaction, API calls, state management
3. **E2E Tests:** Full user flows from card click to save
4. **Manual Tests:** Cross-browser, mobile devices, AI quality

---

## Unit Tests

### Components to Test

#### 1. JobDetailModal.vue

**Test File:** `/app/frontend/src/components/__tests__/JobDetailModal.spec.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import JobDetailModal from '@/components/JobDetailModal.vue';

describe('JobDetailModal', () => {
  it('renders when isOpen is true', () => {
    const wrapper = mount(JobDetailModal, {
      props: { jobId: '123', isOpen: true }
    });
    expect(wrapper.find('.modal').exists()).toBe(true);
  });

  it('does not render when isOpen is false', () => {
    const wrapper = mount(JobDetailModal, {
      props: { jobId: '123', isOpen: false }
    });
    expect(wrapper.find('.modal').exists()).toBe(false);
  });

  it('emits close event when ESC key is pressed', async () => {
    const wrapper = mount(JobDetailModal, {
      props: { jobId: '123', isOpen: true }
    });

    await wrapper.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when backdrop is clicked', async () => {
    const wrapper = mount(JobDetailModal, {
      props: { jobId: '123', isOpen: true }
    });

    await wrapper.find('.backdrop').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('fetches job data on mount', async () => {
    const mockJob = { id: '123', company_name: 'Test Co' };
    const fetchSpy = vi.spyOn(KanbanCardAPI, 'getJobDetail').mockResolvedValue(mockJob);

    mount(JobDetailModal, {
      props: { jobId: '123', isOpen: true }
    });

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('123');
    });
  });
});
```

#### 2. Status-Specific Components

**Test File:** `/app/frontend/src/components/__tests__/ToSubmitFields.spec.ts`

```typescript
describe('ToSubmitFields', () => {
  it('shows "Apply!" button when CV and CL are ready', () => {
    const job = {
      id: '123',
      application_url: 'https://example.com/apply',
      documents: [
        { document_type: 'cv', processing_status: 'completed' },
        { document_type: 'cover_letter', processing_status: 'completed' }
      ]
    };

    const wrapper = mount(ToSubmitFields, { props: { job } });
    const button = wrapper.find('button');

    expect(button.text()).toContain('Apply Now');
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('disables button when documents are processing', () => {
    const job = {
      id: '123',
      documents: [
        { document_type: 'cv', processing_status: 'processing' }
      ]
    };

    const wrapper = mount(ToSubmitFields, { props: { job } });
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('emits applyClicked with URL when button clicked', async () => {
    const job = {
      id: '123',
      application_url: 'https://example.com/apply',
      documents: [
        { document_type: 'cv', processing_status: 'completed' },
        { document_type: 'cover_letter', processing_status: 'completed' }
      ]
    };

    const wrapper = mount(ToSubmitFields, { props: { job } });
    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('applyClicked')).toEqual([['https://example.com/apply']]);
  });
});
```

#### 3. InterviewingFields.vue

```typescript
describe('InterviewingFields', () => {
  it('calculates progress percentage correctly', () => {
    const job = {
      interview_phase_total: 4,
      interview_phase_current: 2
    };

    const wrapper = mount(InterviewingFields, { props: { job } });
    expect(wrapper.text()).toContain('50% complete');
  });

  it('emits updatePhase when values change', async () => {
    const job = { interview_phase_total: 3, interview_phase_current: 1 };
    const wrapper = mount(InterviewingFields, { props: { job } });

    await wrapper.find('input[type="number"]').first().setValue(4);
    expect(wrapper.emitted('updatePhase')).toEqual([[4, 1]]);
  });
});
```

### API Client Tests

**Test File:** `/app/frontend/src/services/__tests__/kanban-api.spec.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { KanbanCardAPI } from '@/services/kanban-api';
import { supabase } from '@/services/supabase';

vi.mock('@/services/supabase');

describe('KanbanCardAPI', () => {
  it('getJobDetail fetches job by ID', async () => {
    const mockJob = { id: '123', company_name: 'Test' };
    supabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockJob, error: null })
        })
      })
    });

    const result = await KanbanCardAPI.getJobDetail('123');
    expect(result).toEqual(mockJob);
  });

  it('updateInterviewPhase calls RPC function', async () => {
    supabase.rpc = vi.fn().mockResolvedValue({ error: null });

    await KanbanCardAPI.updateInterviewPhase('123', 3, 1);

    expect(supabase.rpc).toHaveBeenCalledWith('update_interview_phase', {
      p_job_id: '123',
      p_phase_total: 3,
      p_phase_current: 1
    });
  });

  it('generateInterviewPrep creates processing task', async () => {
    const mockTask = { id: 'task-123' };
    supabase.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTask, error: null })
        })
      })
    });

    const taskId = await KanbanCardAPI.generateInterviewPrep('job-123');
    expect(taskId).toBe('task-123');
  });
});
```

---

## Integration Tests

### Component Integration

#### Modal + Status Fields Integration

**Test File:** `/app/frontend/src/components/__tests__/integration/JobDetailFlow.spec.ts`

```typescript
describe('Job Detail Modal Flow', () => {
  it('shows correct status fields based on job status', async () => {
    const wrapper = mount(JobDetailModal, {
      props: { jobId: '123', isOpen: true },
      global: {
        stubs: {
          ToSubmitFields: true,
          WaitingForCallFields: true,
          InterviewingFields: true
        }
      }
    });

    // Wait for job to load
    await vi.waitFor(() => {
      expect(wrapper.vm.job).toBeDefined();
    });

    // Check that only ToSubmitFields is rendered for 'to_submit' status
    if (wrapper.vm.job.status === 'to_submit') {
      expect(wrapper.findComponent({ name: 'ToSubmitFields' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'InterviewingFields' }).exists()).toBe(false);
    }
  });

  it('saves edits and updates UI', async () => {
    const wrapper = mount(JobDetailModal, {
      props: { jobId: '123', isOpen: true }
    });

    await vi.waitFor(() => wrapper.vm.job);

    // Enter edit mode
    await wrapper.find('[data-test="edit-button"]').trigger('click');

    // Update company name
    await wrapper.find('[data-test="company-input"]').setValue('New Company');

    // Save
    await wrapper.find('[data-test="save-button"]').trigger('click');

    // Verify API call
    expect(KanbanCardAPI.updateJob).toHaveBeenCalledWith('123', {
      company_name: 'New Company'
    });

    // Verify UI updated
    expect(wrapper.text()).toContain('New Company');
  });
});
```

### API + Database Integration

**Test File:** `/app/frontend/src/__tests__/integration/api-db.spec.ts`

```typescript
describe('API to Database Integration', () => {
  it('saves interview phase to database', async () => {
    await KanbanCardAPI.updateInterviewPhase('job-123', 3, 1);

    // Verify in database
    const { data: job } = await supabase
      .from('jobs')
      .select('interview_phase_total, interview_phase_current')
      .eq('id', 'job-123')
      .single();

    expect(job.interview_phase_total).toBe(3);
    expect(job.interview_phase_current).toBe(1);
  });

  it('stores retrospective in correct columns', async () => {
    await supabase.rpc('save_retrospective', {
      p_job_id: 'job-123',
      p_reason: 'Salary too low',
      p_learnings: 'Ask about salary upfront'
    });

    const { data: job } = await supabase
      .from('jobs')
      .select('retrospective_reason, retrospective_learnings, status')
      .eq('id', 'job-123')
      .single();

    expect(job.retrospective_reason).toBe('Salary too low');
    expect(job.retrospective_learnings).toBe('Ask about salary upfront');
    expect(job.status).toBe('not_now');
  });
});
```

---

## E2E Tests (Playwright)

### Setup

**File:** `/app/frontend/e2e/job-detail-modal.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Enhanced Kanban Card Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login if needed
    await page.fill('[data-test="email"]', 'test@example.com');
    await page.fill('[data-test="password"]', 'password');
    await page.click('[data-test="login"]');
  });

  test('opens modal when card is clicked', async ({ page }) => {
    // Wait for kanban board to load
    await page.waitForSelector('[data-test="kanban-board"]');

    // Click first card
    await page.click('[data-test="job-card"]');

    // Modal should be visible
    await expect(page.locator('[data-test="job-detail-modal"]')).toBeVisible();

    // Should show job details
    await expect(page.locator('[data-test="company-name"]')).toBeVisible();
  });

  test('complete flow: to_submit → apply → waiting_for_call → generate prep', async ({ page }) => {
    // Step 1: Open card in "to_submit" status
    await page.click('[data-test="job-card"][data-status="to_submit"]');

    // Step 2: Verify "Apply!" button visible
    await expect(page.locator('[data-test="apply-button"]')).toBeVisible();

    // Step 3: Click Apply (opens new tab)
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('[data-test="apply-button"]')
    ]);
    await newPage.close();

    // Step 4: Change status to "waiting_for_call"
    await page.selectOption('[data-test="status-switcher"]', 'waiting_for_call');
    await page.click('[data-test="save-status"]');

    // Step 5: Verify timestamp shows
    await expect(page.locator('[data-test="submitted-timestamp"]')).toContainText('days ago');

    // Step 6: Generate interview prep
    await page.click('[data-test="generate-prep-button"]');

    // Step 7: Wait for AI to complete (poll for results)
    await expect(page.locator('[data-test="prep-topics"]')).toBeVisible({ timeout: 30000 });

    // Step 8: Verify topics displayed
    const topics = await page.locator('[data-test="prep-topic"]').count();
    expect(topics).toBeGreaterThanOrEqual(5);
  });

  test('offer analysis flow with salary input', async ({ page }) => {
    // Open card in "success" (offer) status
    await page.click('[data-test="job-card"][data-status="success"]');

    // Input salary
    await page.fill('[data-test="salary-amount"]', '1200000');
    await page.selectOption('[data-test="salary-currency"]', 'THB');
    await page.fill('[data-test="benefits"]', 'Health, stock options');

    // Trigger analysis
    await page.click('[data-test="analyze-offer-button"]');

    // Wait for AI analysis
    await expect(page.locator('[data-test="offer-analysis"]')).toBeVisible({ timeout: 30000 });

    // Verify competitiveness badge
    await expect(page.locator('[data-test="competitive-badge"]')).toHaveText(/Average|Above|Below/);

    // Verify sources cited
    const sources = await page.locator('[data-test="analysis-source"]').count();
    expect(sources).toBeGreaterThanOrEqual(2);
  });

  test('retrospective saves on "not_now" status', async ({ page }) => {
    await page.click('[data-test="job-card"][data-status="not_now"]');

    // Fill retrospective
    await page.selectOption('[data-test="retrospective-reason"]', 'salary_low');
    await page.fill('[data-test="retrospective-learnings"]', 'Negotiate better next time');

    // Save
    await page.click('[data-test="save-retrospective"]');

    // Verify saved (close and reopen to check persistence)
    await page.click('[data-test="close-modal"]');
    await page.click('[data-test="job-card"][data-status="not_now"]');

    await expect(page.locator('[data-test="retrospective-reason"]')).toHaveValue('salary_low');
  });

  test('mobile: modal is full-screen', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('[data-test="job-card"]');

    // Modal should be full-screen
    const modal = page.locator('[data-test="job-detail-modal"]');
    const box = await modal.boundingBox();

    expect(box?.width).toBe(375);
    expect(box?.height).toBe(667);
  });
});
```

---

## AI Quality Testing

### Interview Prep Quality

**Test Matrix:**

| Job Type | Expected Topics | Pass Criteria |
|----------|----------------|---------------|
| Frontend Engineer | React, performance, system design | 5+ relevant topics |
| Full-stack | Frontend + backend + DB design | Balanced coverage |
| Senior Role | Architecture, leadership, scale | Senior-level topics |
| Startup | MVP, scrappy, wear multiple hats | Startup context |

**Manual Test Cases:**

1. **Test: Frontend Engineer at Booking.com**
   - Input: Real job description
   - Expected: React, performance, travel domain topics
   - Verify: Topics are specific (not generic "prepare algorithms")

2. **Test: Senior Full-stack at Startup**
   - Input: Real job description
   - Expected: System design, MVP building, leadership
   - Verify: No junior topics (e.g., "learn Git basics")

### Salary Analysis Quality

**Test Matrix:**

| Location | Role | Salary | Expected Result |
|----------|------|--------|-----------------|
| Bangkok | Senior FE | ฿1.2M THB | Above average (cite sources) |
| Bangkok | Mid FE | ฿600K THB | Below average |
| Remote | Senior FE | $120K USD | Average |

**Verification:**
- At least 2 sources cited
- Sources from 2024-2025 (not outdated)
- Recommendation actionable (not vague "it depends")

---

## Manual Testing Checklist

### Cross-Browser Testing

**Desktop:**
- [ ] Chrome 120+ (primary)
- [ ] Safari 17+ (macOS)
- [ ] Firefox 120+
- [ ] Edge 120+

**Mobile:**
- [ ] iOS Safari 17+
- [ ] Android Chrome
- [ ] Samsung Internet

### Device Testing

**Phones:**
- [ ] iPhone SE (375x667 - small screen)
- [ ] iPhone 14 Pro (393x852)
- [ ] Pixel 7 (412x915)

**Tablets:**
- [ ] iPad Air (820x1180)
- [ ] iPad Mini (744x1133)

### Accessibility Testing

- [ ] Keyboard navigation (Tab, Shift+Tab, Enter, ESC)
- [ ] Screen reader (VoiceOver/NVDA)
- [ ] Color contrast (WCAG AA)
- [ ] Focus indicators visible
- [ ] ARIA labels present

### Performance Testing

- [ ] Modal opens in <500ms
- [ ] AI task completes in <20s
- [ ] No memory leaks (DevTools Memory profiler)
- [ ] Smooth animations (60fps)

---

## Regression Testing

### After Each Deployment

1. **Smoke Test (5 min):**
   - Open modal
   - Edit job
   - Change status
   - Trigger AI task

2. **Critical Path (15 min):**
   - Complete "to_submit" → "accepted" flow
   - Test all 6 status-specific fields
   - Verify data persistence

3. **AI Validation (10 min):**
   - Generate interview prep for 2 jobs
   - Analyze salary for 1 offer
   - Verify quality of results

---

## Test Data

### Seed Data for Testing

```sql
-- Test jobs for each status
INSERT INTO jobs (id, company_name, position_title, status, job_description_text) VALUES
  ('test-to-submit', 'TestCo', 'Frontend Engineer', 'to_submit', 'Build React apps...'),
  ('test-waiting', 'WaitCo', 'Senior FE', 'waiting_for_call', 'Next.js experience...'),
  ('test-interviewing', 'InterviewCo', 'Full-stack', 'ongoing', 'MERN stack...'),
  ('test-offer', 'OfferCo', 'Lead FE', 'success', 'Leadership role...'),
  ('test-not-now', 'RejectCo', 'FE Developer', 'not_now', 'Vue.js focus...'),
  ('test-accepted', 'AcceptCo', 'Principal FE', 'accepted', 'Senior role...');

-- Test documents
INSERT INTO job_documents (job_id, document_type, processing_status) VALUES
  ('test-to-submit', 'cv', 'completed'),
  ('test-to-submit', 'cover_letter', 'completed');
```

---

## Bug Tracking

### Bug Report Template

```markdown
**Title:** [Component] Brief description

**Environment:**
- Browser: Chrome 120
- OS: macOS 14
- Device: MacBook Pro

**Steps to Reproduce:**
1. Navigate to kanban board
2. Click job card
3. ...

**Expected Result:**
Modal opens with job details

**Actual Result:**
Modal shows loading spinner indefinitely

**Screenshots:**
[Attach screenshot]

**Console Errors:**
```
Error: Cannot read property 'id' of undefined
```

**Priority:** P1 (Blocker) / P2 (High) / P3 (Medium) / P4 (Low)
```

---

## Test Coverage Goals

### Code Coverage Targets

- **Unit Tests:** 80% coverage
- **Integration Tests:** 70% coverage
- **E2E Tests:** Critical paths 100%

### Run Coverage

```bash
# Unit + Integration tests
cd app/frontend
bun test --coverage

# E2E tests
bunx playwright test --reporter=html
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Enhanced Kanban Card

on:
  pull_request:
    paths:
      - 'app/frontend/src/components/JobDetail*'
      - 'app/supabase/migrations/014_*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: cd app/frontend && bun install

      - name: Run unit tests
        run: cd app/frontend && bun test

      - name: Run E2E tests
        run: |
          cd app/frontend
          bunx playwright install
          bunx playwright test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Related Documentation

- **PRD:** `./PRD.md`
- **Implementation Plan:** `./ImplementationPlan.md`
- **Frontend Components:** `./FrontendComponents.md`
- **Database Schema:** `./DatabaseSchema.md`
