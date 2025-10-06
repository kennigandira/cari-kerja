# API Specification - Enhanced Kanban Card Detail View

**Version:** 1.1 (Updated Oct 6, 2025)
**Date:** October 6, 2025
**Base URL:** `https://ewqqpflajxvqkoawgmek.supabase.co`
**Parent Feature:** Kanban Job Application Tracker
**Recent Changes:** Enhanced `move_card_between_columns()` to sync job.status (Migration 023)

---

## Overview

This document specifies the API endpoints, RPC functions, and background worker tasks for the Enhanced Kanban Card Detail View feature. The API follows REST principles for direct operations and uses Supabase RPC for complex database operations.

### Key Architectural Patterns
- **Direct Table Access:** Supabase client for CRUD on `jobs` table
- **RPC Functions:** Complex updates (status-specific fields)
- **Background Workers:** AI task processing via Cloudflare Workers cron
- **Optimistic UI:** Frontend updates immediately, syncs asynchronously

---

## Supabase Direct Table Operations

### Get Job Detail
**Method:** Supabase `select()`
**Table:** `jobs`
**Usage:** Frontend fetches job details for modal

```typescript
const { data: job, error } = await supabase
  .from('jobs')
  .select(`
    *,
    match_analysis,
    interview_prep_suggestions,
    offer_ai_analysis,
    status_history
  `)
  .eq('id', jobId)
  .single();
```

**Response:**
```typescript
{
  id: string;
  company_name: string;
  position_title: string;
  location: string;
  job_description_text: string;
  match_percentage: number;
  match_analysis: {
    strengths: string[];
    partial_matches: string[];
    gaps: string[];
  };
  status: JobStatus;

  // Application submission (from migration 013)
  application_url?: string;
  application_method?: string;
  application_submitted_at?: string;

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
    sources: Array<{ title: string; url: string; excerpt?: string }>;
    recommendation: string;
    generated_at: string;
  };

  // Retrospective (NEW)
  retrospective_reason?: string;
  retrospective_learnings?: string;

  // Analytics (NEW)
  status_history: Array<{
    from_status: string | null;
    to_status: string;
    timestamp: string;
    duration_days: number;
  }>;
}
```

---

### Update Job Fields
**Method:** Supabase `update()`
**Table:** `jobs`
**Usage:** Save edits from detail modal

```typescript
const { data, error } = await supabase
  .from('jobs')
  .update({
    company_name: 'Updated Company',
    position_title: 'Updated Position',
    location: 'Bangkok, Thailand',
    job_description_text: 'Updated description...',
    status: 'interviewing'
  })
  .eq('id', jobId)
  .select()
  .single();
```

**Triggers:**
- `update_jobs_updated_at` - Updates `updated_at` timestamp
- `track_job_status_changes` - Logs status changes to `status_history` (if status changed)

---

### Delete Job
**Method:** Supabase `delete()`
**Table:** `jobs`
**Usage:** Delete application from detail modal

```typescript
const { error } = await supabase
  .from('jobs')
  .delete()
  .eq('id', jobId);
```

**Cascades:** Deletes all related records (documents, processing tasks, etc.) via `ON DELETE CASCADE`

---

## RPC Functions (Supabase PostgreSQL)

### 1. Update Interview Phase

**Function:** `update_interview_phase()`
**Purpose:** Update interview tracking fields

```sql
CREATE OR REPLACE FUNCTION update_interview_phase(
  p_job_id UUID,
  p_phase_total INTEGER,
  p_phase_current INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jobs
  SET
    interview_phase_total = p_phase_total,
    interview_phase_current = p_phase_current,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;
```

**Client Usage:**
```typescript
const { error } = await supabase.rpc('update_interview_phase', {
  p_job_id: jobId,
  p_phase_total: 3,
  p_phase_current: 1
});
```

---

### 2. Save Salary Offer

**Function:** `save_salary_offer()`
**Purpose:** Save offer details with validation

```sql
CREATE OR REPLACE FUNCTION save_salary_offer(
  p_job_id UUID,
  p_amount DECIMAL(12,2),
  p_currency TEXT,
  p_benefits TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate currency
  IF p_currency NOT IN ('THB', 'USD', 'EUR', 'GBP', 'SGD', 'AUD') THEN
    RAISE EXCEPTION 'Invalid currency: %', p_currency;
  END IF;

  -- Update job
  UPDATE jobs
  SET
    salary_offer_amount = p_amount,
    salary_offer_currency = p_currency,
    offer_benefits = p_benefits,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;
```

**Client Usage:**
```typescript
const { error } = await supabase.rpc('save_salary_offer', {
  p_job_id: jobId,
  p_amount: 1200000.00,
  p_currency: 'THB',
  p_benefits: 'Health insurance, stock options, remote work'
});
```

---

### 3. Save Retrospective

**Function:** `save_retrospective()`
**Purpose:** Save "Not Now" learning data

```sql
CREATE OR REPLACE FUNCTION save_retrospective(
  p_job_id UUID,
  p_reason TEXT,
  p_learnings TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jobs
  SET
    retrospective_reason = p_reason,
    retrospective_learnings = p_learnings,
    status = 'not_now',  -- Ensure status is set
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;
```

**Client Usage:**
```typescript
const { error } = await supabase.rpc('save_retrospective', {
  p_job_id: jobId,
  p_reason: 'Salary below market rate',
  p_learnings: 'Ask about salary range earlier in process'
});
```

---

### 4. Move Card Between Columns (Enhanced Oct 6, 2025)

**Function:** `move_card_between_columns()`
**Purpose:** Move kanban card AND sync job.status atomically
**Migration:** 023_sync_job_status_on_card_move.sql

**Function Signature:**
```sql
CREATE OR REPLACE FUNCTION move_card_between_columns(
  p_card_id UUID,
  p_from_column_id UUID,
  p_to_column_id UUID,
  p_new_position INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
```

**Key Enhancement (Oct 6, 2025):**
This function now syncs the linked job's status when cards move between columns.

**Logic Flow:**
1. Get card's `job_id` and lock row
2. Move card to temporary position (-1)
3. Shift positions in source column
4. Make space in destination column
5. Move card to final position
6. **NEW:** If `job_id` exists:
   - Get destination column name
   - Map column name to job status
   - Update `jobs.status` field
7. Log activity to `kanban_card_activities`

**Column Name → Job Status Mapping:**
```sql
v_new_job_status := CASE
  WHEN v_column_name ILIKE '%to submit%' THEN 'to_submit'
  WHEN v_column_name ILIKE '%waiting%' THEN 'waiting_for_call'
  WHEN v_column_name ILIKE '%interview%' THEN 'ongoing'
  WHEN v_column_name ILIKE '%offer%' THEN 'success'
  WHEN v_column_name ILIKE '%not now%' THEN 'not_now'
  WHEN v_column_name ILIKE '%rejected%' THEN 'not_now'
  WHEN v_column_name ILIKE '%processing%' THEN 'processing'
  ELSE NULL -- Keep existing status if no match
END;
```

**Client Usage:**
```typescript
const { error } = await supabase.rpc('move_card_between_columns', {
  p_card_id: cardId,
  p_from_column_id: fromColumnId,
  p_to_column_id: toColumnId,
  p_new_position: 2
});

// After this call:
// - Card is in new column at position 2
// - Job status is automatically synced
// - Status history is updated via trigger
```

**Side Effects:**
- Updates `kanban_cards.column_id` and `position`
- Updates `jobs.status` (if job_id exists)
- Triggers `track_job_status_changes` on jobs table
- Inserts activity log in `kanban_card_activities`

---

### 5. Update Status with History

**Function:** `update_job_status()`
**Purpose:** Change status and auto-log to history

```sql
CREATE OR REPLACE FUNCTION update_job_status(
  p_job_id UUID,
  p_new_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate status
  IF p_new_status NOT IN ('processing', 'to_submit', 'waiting_for_call', 'ongoing', 'success', 'not_now') THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  -- Update (trigger will handle status_history)
  UPDATE jobs
  SET status = p_new_status
  WHERE id = p_job_id;
END;
$$;
```

**Client Usage:**
```typescript
const { error } = await supabase.rpc('update_job_status', {
  p_job_id: jobId,
  p_new_status: 'interviewing'
});
```

---

## Background Worker Tasks (Cloudflare Workers)

### Processing Queue Task Types

#### Task: `generate_interview_prep`

**Trigger:** User clicks "Get Interview Prep ✨" button in "Waiting for Call" status

**Workflow:**
1. Frontend creates task in `processing_queue` table
2. Cloudflare Worker cron picks up task
3. Worker calls Claude API with interview prep prompt
4. Worker updates `interview_prep_suggestions` JSONB field
5. Frontend polls or uses Realtime to detect update

**Task Creation (Frontend):**
```typescript
async function triggerInterviewPrep(jobId: string) {
  const { data: task, error } = await supabase
    .from('processing_queue')
    .insert({
      job_id: jobId,
      task_type: 'generate_interview_prep',
      priority: 5, // High priority for user-triggered tasks
      task_data: { job_id: jobId }
    })
    .select()
    .single();

  if (error) throw error;
  return task.id;
}
```

**Worker Implementation:** `/app/workers/src/tasks/generate-interview-prep.ts`
```typescript
import type { ProcessingQueueTask } from '../../../shared/types';

type Env = {
  ANTHROPIC_API_KEY: string;
};

export async function generateInterviewPrep(
  task: ProcessingQueueTask,
  supabase: any,
  env: Env
): Promise<{ topics: string[] }> {
  // Get job data
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', task.job_id)
    .single();

  if (error || !job) {
    throw new Error('Job not found');
  }

  // Prepare AI prompt
  const interviewPrepPrompt = `You are a career coach helping a candidate prepare for a job interview.

CANDIDATE PROFILE:
Frontend Engineer with 8+ years experience:
- React, TypeScript, Next.js, Vue.js expertise
- Performance optimization (Core Web Vitals)
- Real estate, gaming, travel platforms
- Skills: React, TypeScript, Next.js, Vue, Node.js, Jest, TailwindCSS, Docker, AWS

JOB DESCRIPTION:
Position: ${job.position_title}
Company: ${job.company_name}
${job.job_description_text}

Provide 5-7 specific topics this candidate should prepare for the interview. Focus on:
1. Technical skills mentioned in job description
2. System design relevant to company's domain
3. Behavioral questions based on job requirements
4. Company-specific knowledge

Return JSON:
{
  "topics": [
    "Deep dive into React Server Components (they use Next.js 14)",
    "Prepare examples of Core Web Vitals optimization (LCP < 2.5s)",
    "..."
  ]
}`;

  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307', // Use Haiku for cost efficiency
      max_tokens: 1000,
      messages: [{ role: 'user', content: interviewPrepPrompt }],
    }),
  });

  const result = await response.json();
  const prepData = JSON.parse(result.content[0].text);

  // Store in database
  await supabase
    .from('jobs')
    .update({
      interview_prep_suggestions: {
        topics: prepData.topics,
        generated_at: new Date().toISOString(),
        model: 'claude-3-haiku-20240307'
      }
    })
    .eq('id', task.job_id);

  return { topics: prepData.topics };
}
```

**Response Format:**
```json
{
  "topics": [
    "Deep dive into React Server Components and Next.js 14 App Router",
    "Prepare Core Web Vitals optimization examples (LCP, CLS, FID)",
    "System design: Real estate search with 10M+ listings",
    "Behavioral: Tell me about optimizing a slow feature to meet deadlines",
    "Company research: Their tech stack and recent product launches"
  ],
  "generated_at": "2025-10-06T10:30:00Z",
  "model": "claude-3-haiku-20240307"
}
```

---

#### Task: `analyze_salary_offer`

**Trigger:** User clicks "Analyze Offer ✨" button in "Offer" status

**Workflow:**
1. Frontend creates task with offer details in `task_data`
2. Worker calls Claude API with web search capability
3. AI searches for salary data + cites sources
4. Worker updates `offer_ai_analysis` JSONB field

**Task Creation (Frontend):**
```typescript
async function triggerOfferAnalysis(
  jobId: string,
  amount: number,
  currency: string,
  benefits: string
) {
  const { data: task, error } = await supabase
    .from('processing_queue')
    .insert({
      job_id: jobId,
      task_type: 'analyze_salary_offer',
      priority: 5,
      task_data: {
        job_id: jobId,
        salary_amount: amount,
        salary_currency: currency,
        benefits: benefits
      }
    })
    .select()
    .single();

  if (error) throw error;
  return task.id;
}
```

**Worker Implementation:** `/app/workers/src/tasks/analyze-salary-offer.ts`
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

  const offerAnalysisPrompt = `You are a salary negotiation expert. Analyze if this offer is competitive.

OFFER DETAILS:
Position: ${job.position_title}
Location: ${job.location}
Offer: ${salary_amount} ${salary_currency} (annual gross)
Benefits: ${benefits}

INSTRUCTIONS:
1. Search the web for current 2025 salary data for this role and location
2. Compare the offer to market average
3. Consider total compensation (base + benefits)
4. Cite at least 2 reliable sources

Return JSON:
{
  "is_competitive": "above_average|average|below_average",
  "analysis": "This offer is X% above/below market average...",
  "market_average": {"amount": 1040000, "currency": "THB"},
  "sources": [
    {"title": "Source name", "url": "https://...", "excerpt": "Quote from source"},
    ...
  ],
  "recommendation": "Accept if culture fits | Negotiate for X | Consider declining"
}`;

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
      messages: [{ role: 'user', content: offerAnalysisPrompt }],
    }),
  });

  const result = await response.json();
  const analysisData = JSON.parse(result.content[0].text);

  // Store analysis
  await supabase
    .from('jobs')
    .update({
      offer_ai_analysis: {
        ...analysisData,
        generated_at: new Date().toISOString(),
        model: 'claude-3-haiku-20240307'
      }
    })
    .eq('id', task.job_id);

  return analysisData;
}
```

**Response Format:**
```json
{
  "is_competitive": "above_average",
  "analysis": "This offer of ฿1,200,000 THB is approximately 15% above the market average for Senior Frontend Engineers in Bangkok with 8+ years of experience.",
  "market_average": {
    "amount": 1040000,
    "currency": "THB"
  },
  "sources": [
    {
      "title": "Thailand Tech Salaries Report 2025",
      "url": "https://techsalaries.th/report-2025",
      "excerpt": "Senior Frontend Engineers in Bangkok: ฿900K - ฿1.2M THB, average ฿1.05M"
    },
    {
      "title": "Glassdoor: Frontend Engineer Bangkok",
      "url": "https://www.glassdoor.com/Salaries/bangkok-frontend-engineer-salary",
      "excerpt": "Average base salary: ฿1,040,000 THB/year"
    }
  ],
  "recommendation": "Strong offer for the market. Accept if company culture and growth opportunities align with your career goals.",
  "generated_at": "2025-10-06T14:20:00Z",
  "model": "claude-3-haiku-20240307"
}
```

---

## Cron Worker Updates

### Updated Task Processing Loop

**File:** `/app/workers/src/cron.ts`

```typescript
// Add new task handlers
switch (task.task_type) {
  case 'extract_job_info':
    result = await extractJobInfo(task, supabase, env);
    break;
  case 'calculate_match':
    result = await calculateMatch(task, supabase, env);
    break;
  // ... existing tasks ...

  // NEW TASKS
  case 'generate_interview_prep':
    result = await generateInterviewPrep(task, supabase, env);
    break;
  case 'analyze_salary_offer':
    result = await analyzeSalaryOffer(task, supabase, env);
    break;

  default:
    throw new Error(`Unknown task type: ${task.task_type}`);
}
```

---

## Frontend API Client (TypeScript)

### Supabase Client Wrapper

**File:** `/app/frontend/src/services/kanban-api.ts`

```typescript
import { supabase } from './supabase';
import type { Job, ProcessingQueueTask } from '../../../shared/types';

export class KanbanCardAPI {

  // Get job detail
  static async getJobDetail(jobId: string): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  }

  // Update job fields
  static async updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update interview phase
  static async updateInterviewPhase(
    jobId: string,
    total: number,
    current: number
  ): Promise<void> {
    const { error } = await supabase.rpc('update_interview_phase', {
      p_job_id: jobId,
      p_phase_total: total,
      p_phase_current: current
    });

    if (error) throw error;
  }

  // Save salary offer
  static async saveSalaryOffer(
    jobId: string,
    amount: number,
    currency: string,
    benefits: string
  ): Promise<void> {
    const { error } = await supabase.rpc('save_salary_offer', {
      p_job_id: jobId,
      p_amount: amount,
      p_currency: currency,
      p_benefits: benefits
    });

    if (error) throw error;
  }

  // Trigger AI interview prep
  static async generateInterviewPrep(jobId: string): Promise<string> {
    const { data: task, error } = await supabase
      .from('processing_queue')
      .insert({
        job_id: jobId,
        task_type: 'generate_interview_prep',
        priority: 5,
        task_data: { job_id: jobId }
      })
      .select()
      .single();

    if (error) throw error;
    return task.id; // Return task ID for polling
  }

  // Trigger AI offer analysis
  static async analyzeOffer(
    jobId: string,
    amount: number,
    currency: string,
    benefits: string
  ): Promise<string> {
    const { data: task, error } = await supabase
      .from('processing_queue')
      .insert({
        job_id: jobId,
        task_type: 'analyze_salary_offer',
        priority: 5,
        task_data: {
          job_id: jobId,
          salary_amount: amount,
          salary_currency: currency,
          benefits: benefits
        }
      })
      .select()
      .single();

    if (error) throw error;
    return task.id;
  }

  // Poll task status
  static async getTaskStatus(taskId: string): Promise<ProcessingQueueTask> {
    const { data, error } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) throw error;
    return data;
  }

  // Delete job
  static async deleteJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
  }
}
```

---

## Error Handling

### HTTP Status Codes (Supabase)
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid auth token)
- `403` - Forbidden (RLS policy violation)
- `404` - Not found
- `500` - Server error

### Error Response Format
```typescript
{
  error: {
    message: string;
    code: string;
    details?: any;
  }
}
```

### Frontend Error Handling Pattern
```typescript
try {
  await KanbanCardAPI.saveSalaryOffer(jobId, amount, currency, benefits);
  showSuccessToast('Offer details saved');
} catch (error) {
  if (error.message.includes('Invalid currency')) {
    showErrorToast('Please select a valid currency');
  } else {
    showErrorToast('Failed to save offer details');
    console.error('Offer save error:', error);
  }
}
```

---

## Rate Limiting & Cost Considerations

### AI Task Rate Limits
- **Interview Prep:** Max 1 request per job per day (prevent spam)
- **Offer Analysis:** Max 1 request per job per day
- **Cost:** ~$0.0002 per request (Haiku pricing)
- **Monthly Budget:** ~$10 for 50K requests (way beyond expected usage)

### Implementation
```typescript
// Check if AI task already generated today
const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

const { data: recentTask } = await supabase
  .from('processing_queue')
  .select('id')
  .eq('job_id', jobId)
  .eq('task_type', 'generate_interview_prep')
  .eq('status', 'completed')
  .gt('completed_at', oneHourAgo)
  .limit(1);

if (recentTask.length > 0) {
  throw new Error('Interview prep already generated recently. Please wait 1 hour.');
}
```

---

## Testing Endpoints

### Postman Collection

**Base URL:** `https://ewqqpflajxvqkoawgmek.supabase.co/rest/v1`
**Auth Header:** `apikey: your-anon-key` + `Authorization: Bearer your-access-token`

**Test Requests:**

1. **Get Job Detail**
```
GET /jobs?id=eq.{job-id}&select=*
```

2. **Update Interview Phase**
```
POST /rpc/update_interview_phase
Content-Type: application/json

{
  "p_job_id": "uuid-here",
  "p_phase_total": 3,
  "p_phase_current": 1
}
```

3. **Trigger Interview Prep**
```
POST /processing_queue
Content-Type: application/json

{
  "job_id": "uuid-here",
  "task_type": "generate_interview_prep",
  "priority": 5,
  "task_data": {"job_id": "uuid-here"}
}
```

---

## Related Documentation

- **Database Schema:** `./DatabaseSchema.md`
- **Frontend Components:** `./FrontendComponents.md`
- **PRD:** `./PRD.md`
- **Worker Tasks:** `/app/workers/src/tasks/`
