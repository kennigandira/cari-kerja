# Implementation Plan - Enhanced Kanban Card Detail View

**Version:** 1.1 (Updated Oct 6, 2025)
**Date:** October 6, 2025
**Priority:** P1 (High)
**Estimated Timeline:** 3 weeks (15-20 hours/week)
**Actual Progress:** Phase 1 Complete (1 day, 9 hours)
**Parent Feature:** Kanban Job Application Tracker

---

## Overview

### Context
**Developer Profile:**
- Solo full-stack engineer
- Part-time availability: 15-20 hours/week
- Active job search requiring immediate value
- Must ship incrementally for continuous feedback

**Business Driver:**
Transform kanban cards from status indicators to comprehensive job management workspaces with AI-powered insights.

### Phased Approach (Planned vs Actual)

| Phase | Planned | Actual | Est. Hours | Actual Hours | Status |
|-------|---------|--------|------------|--------------|--------|
| Phase 1: MVP (Modal + Fields) | Week 1 (Oct 7-13) | Oct 6 | 15-18h | 9h | ✅ Complete |
| Phase 2: AI Integration | Week 2 (Oct 14-20) | TBD | 12-15h | - | ⬜ Not Started |
| Phase 3: Comments System | Week 3 (Oct 21-27) | TBD | 8-10h | - | ⬜ Not Started |

**Total Planned:** 35-43 hours over 3 weeks
**Total Actual:** 9 hours completed (Phase 1 only)

---

## Phase 1: MVP - Detail Modal + Status Fields

**Goal:** Ship clickable cards with full job details and status-specific UI

**Planned Duration:** Week 1 (Oct 7-13)
**Actual Duration:** 1 day (Oct 6, 2025) ✅
**Planned Hours:** 15-18 hours
**Actual Hours:** ~8 hours (50% faster than estimated)

### Task Breakdown (Planned vs Actual)

| Task | Est. Hours | Actual Hours | Status | Notes |
|------|------------|--------------|--------|-------|
| **1. Database Migration 014** | 2h | 1h | ✅ Complete | Faster due to existing migration 013 template |
| **2. Update TypeScript Types** | 1h | 0.5h | ✅ Complete | Types already structured well |
| **3. JobDetailModal.vue Component** | 3h | 2h | ✅ Complete | Reused BaseModal, simpler than planned |
| **4. Status-Specific Field Components** | 4h | 2h | ✅ Complete | Simplified components, no complex logic |
| **5. Make Cards Clickable** | 1h | 0.5h | ✅ Complete | Simple event emission |
| **6. API Client (kanban-api.ts)** | 2h | 1h | ✅ Complete | Leveraged existing patterns |
| **7. Mobile Responsive Modal** | 2h | 0.5h | ✅ Complete | Tailwind grid made this trivial |
| **8. Manual Testing** | 1h | 0.5h | ✅ Complete | chrome-devtools MCP accelerated testing |
| **Bug Fixes (unplanned)** | - | 1h | ✅ Complete | 4 critical UX issues fixed |

**Total Estimated:** 16 hours
**Total Actual:** ~9 hours
**Efficiency Gain:** 44% faster

**Deliverable:** ✅ Working detail modal with all features + bug fixes

### Actual Implementation Timeline (Oct 6, 2025)

**Single Day - 8 hours total:**
- Migration 014 + TypeScript types (1.5h)
- JobDetailModal.vue + BaseModal integration (2h)
- All 6 status-specific field components (2h)
- ApplicationCard clickable integration (0.5h)
- kanban-api.ts service layer (1h)
- Mobile responsive testing + bug fixes (1h)
  - Fixed modal scrolling
  - Fixed status reactivity
  - Added two-column layout
  - Created migrations 023 & 024 for job status sync

**Key Deviations from Plan:**
- ✅ Completed in 1 day vs planned 5 days (accelerated)
- ✅ Simplified architecture (no separate sub-components)
- ✅ Discovered and fixed 4 critical bugs same day
- ✅ Used chrome-devtools MCP for faster manual testing

---

### Implementation Details - Phase 1

#### Step 1: Database Migration

**File:** `/app/supabase/migrations/014_add_enhanced_kanban_fields.sql`

```bash
# Run migration locally
cd app/supabase
supabase db reset

# Verify fields
supabase db inspect
```

**Verification:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'jobs'
  AND column_name IN (
    'interview_phase_total',
    'salary_offer_amount',
    'retrospective_reason'
  );
```

#### Step 2: Update Types

**File:** `/app/shared/types.ts`

```typescript
export interface Job {
  // ... existing fields ...

  // Interview tracking (NEW)
  interview_phase_total?: number;
  interview_phase_current?: number;
  interview_prep_suggestions?: {
    topics: string[];
    generated_at: string;
    model: string;
  };

  // Offer analysis (NEW)
  salary_offer_amount?: number;
  salary_offer_currency?: string;
  offer_benefits?: string;
  offer_ai_analysis?: {
    is_competitive: 'above_average' | 'average' | 'below_average';
    analysis: string;
    sources: Array<{ title: string; url: string }>;
    recommendation: string;
    generated_at: string;
  };

  // Retrospective (NEW)
  retrospective_reason?: string;
  retrospective_learnings?: string;

  // Analytics (NEW)
  status_history?: Array<{
    from_status: string | null;
    to_status: string;
    timestamp: string;
    duration_days: number;
  }>;
}
```

#### Step 3: Router Setup

**File:** `/app/frontend/src/router/index.ts`

```typescript
// Add route for modal (optional, can use query params instead)
{
  path: '/job/:id',
  name: 'job-detail',
  component: () => import('@/views/JobDetailView.vue'),
  props: true
}

// Or use query params
{
  path: '/',
  name: 'kanban',
  component: KanbanView,
  // Modal opens via ?job={id} query param
}
```

#### Step 4: Component Integration

**File:** `/app/frontend/src/components/kanban/ApplicationCard.vue`

```vue
<template>
  <div
    class="job-card cursor-pointer hover:shadow-lg transition-shadow"
    @click="handleClick"
  >
    <!-- Existing card content -->
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
const emit = defineEmits(['open-detail']);

function handleClick() {
  // Option 1: Emit to parent
  emit('open-detail', props.job.id);

  // Option 2: Router navigation
  router.push({ name: 'job-detail', params: { id: props.job.id } });
}
</script>
```

---

## Phase 2: AI Integration

**Goal:** Add interview prep and salary analysis AI features

**Duration:** Week 2 (Oct 14-20)
**Hours:** 12-15 hours

### Task Breakdown

| Task | Hours | Owner | Definition of Done |
|------|-------|-------|-------------------|
| **1. Worker: generate-interview-prep.ts** | 3h | Backend | Task handler implemented, Claude API integrated, stores JSONB |
| **2. Worker: analyze-salary-offer.ts** | 3h | Backend | Web search + salary analysis logic, cites sources |
| **3. Update Cron Task Handler** | 1h | Backend | New task types added to switch statement |
| **4. Frontend: Trigger AI Buttons** | 2h | Frontend | "Get Prep" and "Analyze Offer" buttons create tasks |
| **5. Frontend: Task Polling** | 2h | Frontend | Poll task status, update UI when complete |
| **6. Frontend: Display AI Results** | 2h | Frontend | Format interview topics, salary analysis with sources |
| **7. Error Handling & Loading States** | 1h | Frontend | Spinners, error toasts, retry logic |
| **8. Testing AI Prompts** | 1h | QA | Test different job descriptions, verify quality |

**Deliverable:** Working AI insights for interview prep and salary analysis

### Day-by-Day Schedule

**Day 1 (Monday, Oct 14) - 3 hours**
- Implement generate-interview-prep.ts worker (3h)

**Day 2 (Tuesday, Oct 15) - 3 hours**
- Implement analyze-salary-offer.ts worker (3h)

**Day 3 (Wednesday, Oct 16) - 3 hours**
- Update cron handler + deploy (1h)
- Frontend: Trigger AI buttons (2h)

**Day 4 (Thursday, Oct 17) - 3 hours**
- Task polling logic (2h)
- Display AI results UI (1h)

**Day 5 (Friday, Oct 18) - 2 hours**
- Error handling + loading states (1h)
- AI prompt testing + refinement (1h)

**Weekend:** Test with real job descriptions, tune prompts

---

### Implementation Details - Phase 2

#### Step 1: Interview Prep Worker

**File:** `/app/workers/src/tasks/generate-interview-prep.ts`

```typescript
export async function generateInterviewPrep(
  task: ProcessingQueueTask,
  supabase: any,
  env: Env
): Promise<{ topics: string[] }> {
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', task.job_id)
    .single();

  const prompt = `Generate 5-7 specific interview prep topics for:
  Position: ${job.position_title}
  Company: ${job.company_name}
  Description: ${job.job_description_text}

  Return JSON: {"topics": ["...", "..."]}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const result = await response.json();
  const data = JSON.parse(result.content[0].text);

  await supabase
    .from('jobs')
    .update({
      interview_prep_suggestions: {
        topics: data.topics,
        generated_at: new Date().toISOString(),
        model: 'claude-3-haiku-20240307'
      }
    })
    .eq('id', task.job_id);

  return data;
}
```

#### Step 2: Salary Analysis Worker

**File:** `/app/workers/src/tasks/analyze-salary-offer.ts`

```typescript
export async function analyzeSalaryOffer(
  task: ProcessingQueueTask,
  supabase: any,
  env: Env
): Promise<object> {
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', task.job_id)
    .single();

  const { salary_amount, salary_currency, benefits } = task.task_data;

  const prompt = `Analyze salary competitiveness:
  Offer: ${salary_amount} ${salary_currency}
  Position: ${job.position_title}
  Location: ${job.location}

  Search web for 2025 salary data. Return JSON with:
  {
    "is_competitive": "above_average|average|below_average",
    "analysis": "...",
    "sources": [{"title": "...", "url": "..."}],
    "recommendation": "..."
  }`;

  // Call Claude with web search capability
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const result = await response.json();
  const analysisData = JSON.parse(result.content[0].text);

  await supabase
    .from('jobs')
    .update({
      offer_ai_analysis: {
        ...analysisData,
        generated_at: new Date().toISOString()
      }
    })
    .eq('id', task.job_id);

  return analysisData;
}
```

#### Step 3: Task Polling

**File:** `/app/frontend/src/composables/useTaskPolling.ts`

```typescript
import { ref } from 'vue';
import { KanbanCardAPI } from '@/services/kanban-api';

export function useTaskPolling() {
  const isPolling = ref(false);

  async function pollTask(taskId: string, maxAttempts = 30) {
    isPolling.value = true;
    let attempts = 0;

    const poll = async () => {
      const task = await KanbanCardAPI.getTaskStatus(taskId);

      if (task.status === 'completed') {
        isPolling.value = false;
        return task;
      }

      if (task.status === 'failed') {
        isPolling.value = false;
        throw new Error(task.error_message || 'Task failed');
      }

      if (attempts++ >= maxAttempts) {
        isPolling.value = false;
        throw new Error('Task polling timeout');
      }

      // Poll every 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      return poll();
    };

    return poll();
  }

  return { isPolling, pollTask };
}
```

---

## Phase 3: Comments System (Optional)

**Goal:** Add rich text comments to applications

**Duration:** Week 3 (Oct 21-27)
**Hours:** 8-10 hours

### Task Breakdown

| Task | Hours | Owner | Definition of Done |
|------|-------|-------|-------------------|
| **1. Database: job_comments Table** | 1h | Backend | Table created, RLS policies, indexes |
| **2. API: Comment CRUD** | 2h | Backend | RPC functions for create/update/delete comments |
| **3. Tiptap Integration** | 3h | Frontend | Rich text editor with bold, italic, color |
| **4. Comment Thread UI** | 2h | Frontend | Display comments chronologically, edit/delete |
| **5. Testing** | 1h | QA | Test comment creation, editing, persistence |

**Deliverable:** Working comment system with basic formatting

**Note:** This phase is optional and can be deferred if time is limited.

---

## Deployment Strategy

### Phase 1 Deployment

**Frontend:**
```bash
cd app/frontend
bun run build
# Deploy to Cloudflare Pages
npx wrangler pages publish dist
```

**Backend (Supabase):**
```bash
cd app/supabase
supabase db push
# Migration 014 applied to production
```

### Phase 2 Deployment

**Workers:**
```bash
cd app/workers
bun run build
npx wrangler deploy
# New task handlers deployed
```

**Verification:**
```bash
# Trigger cron manually
curl -X POST https://workers.your-domain.workers.dev/cron \
  -H "Authorization: Bearer YOUR_SECRET"
```

---

## Risk Mitigation

### High-Risk Areas

1. **AI Prompt Quality**
   - **Risk:** Generated topics/analysis not helpful
   - **Mitigation:** Test with 5+ real job descriptions, iterate prompts
   - **Fallback:** Allow users to edit AI-generated content

2. **Task Polling Performance**
   - **Risk:** Too many polling requests
   - **Mitigation:** Use exponential backoff, max 30 attempts
   - **Fallback:** Manual refresh button

3. **Mobile UX**
   - **Risk:** Modal not usable on small screens
   - **Mitigation:** Test on iPhone SE, Android small device
   - **Fallback:** Full-screen modal on mobile

4. **Database Migration**
   - **Risk:** Migration fails on production
   - **Mitigation:** Test rollback script, backup data first
   - **Fallback:** Manual column addition via Supabase dashboard

---

## Success Criteria

### Phase 1
- ✅ Cards are clickable
- ✅ Modal shows full job details
- ✅ All 6 status-specific fields render correctly
- ✅ Edit/delete works
- ✅ Mobile responsive (tested on iOS/Android)

### Phase 2
- ✅ Interview prep generates 5-7 relevant topics
- ✅ Salary analysis cites 2+ sources
- ✅ AI results display in <15 seconds
- ✅ Error handling graceful (toasts, retry)

### Phase 3 (Optional)
- ✅ Comments support bold, italic, color
- ✅ Edit/delete own comments
- ✅ Thread sorted chronologically

---

## Testing Checklist

### Manual Testing (Phase 1)

- [ ] Click card → modal opens
- [ ] ESC key → modal closes
- [ ] Edit job info → saves to DB
- [ ] Delete job → confirms + removes
- [ ] Status change → triggers history log
- [ ] "To Submit" → Apply button works
- [ ] "Waiting for Call" → timestamp displays
- [ ] "Interviewing" → phase tracker updates
- [ ] "Offer" → salary input saves
- [ ] "Not Now" → retrospective saves
- [ ] "Accepted" → congratulations shows
- [ ] Mobile Safari → modal full-screen
- [ ] Mobile Android → touch targets 44px+

### Integration Testing (Phase 2)

- [ ] Trigger interview prep → task created
- [ ] Task completes → UI updates
- [ ] Interview topics display as checklist
- [ ] Trigger offer analysis → web search works
- [ ] Salary analysis cites 2+ sources
- [ ] Error handling → shows toast

---

## Rollback Plan

### Phase 1 Rollback

```bash
# Revert frontend
git revert <commit-hash>
bun run build && npx wrangler pages publish dist

# Revert database
cd app/supabase
# Run rollback script from DatabaseSchema.md
supabase db reset --version 013
```

### Phase 2 Rollback

```bash
# Revert worker tasks
git revert <worker-commit>
bun run build && npx wrangler deploy

# Remove task types from processing_queue
# (Keep data, just prevent execution)
```

---

## Post-Launch Monitoring

### Metrics to Track

1. **Usage Metrics**
   - Modal opens per day
   - Status-specific field completion rate
   - AI feature usage (prep vs salary analysis)

2. **Performance Metrics**
   - Modal load time (<500ms target)
   - AI task completion time (<15s target)
   - Task polling efficiency

3. **Error Metrics**
   - Failed AI tasks (target <5%)
   - Migration errors (target 0)
   - Frontend errors (Sentry)

### Monitoring Tools

- **Supabase Dashboard:** Query performance, DB size
- **Cloudflare Analytics:** Worker invocations, errors
- **Browser DevTools:** Frontend performance, network

---

## Related Documentation

- **PRD:** `./PRD.md`
- **Database Schema:** `./DatabaseSchema.md`
- **API Specification:** `./APISpecification.md`
- **Frontend Components:** `./FrontendComponents.md`
- **Testing Strategy:** `./TestingStrategy.md`

---

## Appendix: Time Estimates

### Confidence Levels

| Task Category | Estimated Hours | Confidence | Notes |
|---------------|-----------------|------------|-------|
| Database Migration | 2h | High | Standard Supabase migration |
| Frontend Components | 8h | Medium | Vue 3 + TypeScript familiar |
| AI Integration | 6h | Medium | Similar to existing tasks |
| Mobile Responsive | 2h | High | Tailwind CSS utilities |
| Comments System | 8h | Low | Tiptap integration new |

**Total (excluding comments):** 18h (High confidence)
**With comments:** 26h (Medium confidence)
