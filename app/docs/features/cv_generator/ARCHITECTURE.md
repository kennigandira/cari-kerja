# Technical Architecture
# CV & Cover Letter Generator - Background Processing

**Version:** 1.0
**Last Updated:** October 7, 2025
**Status:** Design Phase

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Architecture](#2-component-architecture)
3. [Data Flow](#3-data-flow)
4. [Integration Points](#4-integration-points)
5. [Storage Strategy](#5-storage-strategy)
6. [External Services](#6-external-services)
7. [Error Handling](#7-error-handling)
8. [Security](#8-security)
9. [Scalability](#9-scalability)

---

## 1. System Overview

### 1.1 Architecture Pattern

**Pattern:** Event-Driven Background Processing

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (Vue 3)                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Kanban Board    │  │ Job Card Detail  │  │ Notifications  │ │
│  │ View            │  │ View             │  │ Panel          │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
└───────────┬──────────────────────┬──────────────────┬───────────┘
            │                      │                  │
            │ Trigger              │ Poll Status      │ Receive
            │ Generation           │                  │ Notification
            ↓                      ↓                  ↓
┌──────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                            │
│  ┌────────────────────────┐  ┌────────────────────────────────┐ │
│  │ Processing Queue       │  │ Storage Bucket                 │ │
│  │ tasks table            │  │ cv-generated-docs/             │ │
│  │ - task_type           │  │ - CVs (markdown, tex, pdf)     │ │
│  │ - payload             │  │ - Cover letters                │ │
│  │ - status              │  │                                │ │
│  └────────────────────────┘  └────────────────────────────────┘ │
│               ↑ Write Task             ↑ Upload Files           │
│               │ Read Status            │ Download Files         │
└───────────────┼────────────────────────┼─────────────────────────┘
                │                        │
                │ Poll Queue             │ Store Results
                │                        │
┌───────────────┼────────────────────────┼─────────────────────────┐
│               │    Cloudflare Worker   │                         │
│               ↓                        ↓                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Task Processor (Cron: Every 30 seconds)                 │   │
│  │                                                          │   │
│  │  1. Poll processing_queue_tasks for 'generate_cv'       │   │
│  │  2. Fetch master_profile data                           │   │
│  │  3. Fetch job description                               │   │
│  │  4. Call Claude API → Generate CV markdown              │   │
│  │  5. Call Claude API → Generate cover letter markdown    │   │
│  │  6. Convert markdown → LaTeX                            │   │
│  │  7. Call Render.com (tectonic) → Compile PDFs            │   │
│  │  8. Upload files to Supabase Storage                    │   │
│  │  9. Update task status → 'completed'                    │   │
│  │  10. Create notification                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                     ↓ API Calls                                 │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                          │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Anthropic Claude │  │ Render.com       │                    │
│  │ API              │  │ (PDF Compiler)   │                    │
│  │ - CV generation  │  │ - tex → pdf      │                    │
│  │ - CL generation  │  │ - 100 free/day   │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Frontend Components

#### Kanban Board Integration

**Component:** `JobCard.vue` (existing, modified)

```vue
<template>
  <div class="job-card">
    <!-- Existing card content -->

    <!-- NEW: Generation status indicator -->
    <div v-if="cvGenerationTask" class="cv-status">
      <CVGenerationStatus :task="cvGenerationTask" />
    </div>

    <!-- NEW: Actions -->
    <div class="actions">
      <button @click="generateCV" :disabled="isGenerating">
        {{ isGenerating ? 'Generating...' : 'Generate CV' }}
      </button>
      <button v-if="hasGeneratedCV" @click="downloadCV">
        Download CV
      </button>
    </div>
  </div>
</template>

<script setup>
import { useCV Generator } from '@/composables/useCVGenerator'

const {
  generateCV,
  cvGenerationTask,
  isGenerating,
  hasGeneratedCV,
  downloadCV
} = useCVGenerator(props.job.id)
</script>
```

**New Components:**

1. **CVGenerationStatus.vue**
   - Display task status (pending, processing, completed, failed)
   - Progress indicator
   - Error messages
   - Estimated time remaining

2. **CVVersionList.vue** (Phase 2)
   - List all generated versions
   - Preview functionality
   - Download links
   - Version comparison

#### Composables

**`useCVGenerator.ts`**
```typescript
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'

export function useCVGenerator(jobId: string) {
  const task = ref<ProcessingQueueTask | null>(null)
  const polling = ref<number | null>(null)

  const isGenerating = computed(() =>
    task.value?.status === 'pending' ||
    task.value?.status === 'processing'
  )

  const hasGeneratedCV = computed(() =>
    task.value?.status === 'completed'
  )

  async function generateCV() {
    // 1. Get default profile
    const { data: profile } = await supabase
      .from('master_profiles')
      .select('id')
      .eq('is_default', true)
      .single()

    // 2. Create task
    const { data: newTask } = await supabase
      .from('processing_queue_tasks')
      .insert({
        task_type: 'generate_cv',
        payload: {
          job_id: jobId,
          profile_id: profile.id,
          generate_cover_letter: true,
          include_reviews: false // Phase 2
        },
        status: 'pending'
      })
      .select()
      .single()

    task.value = newTask
    startPolling()
  }

  function startPolling() {
    polling.value = setInterval(async () => {
      const { data } = await supabase
        .from('processing_queue_tasks')
        .select('*')
        .eq('id', task.value?.id)
        .single()

      task.value = data

      if (data.status === 'completed' || data.status === 'failed') {
        stopPolling()
      }
    }, 5000) // Poll every 5 seconds
  }

  function stopPolling() {
    if (polling.value) {
      clearInterval(polling.value)
      polling.value = null
    }
  }

  async function downloadCV() {
    // Get signed URL from Supabase Storage
    const path = `cv-generated-docs/${jobId}/final-cv.pdf`
    const { data } = await supabase.storage
      .from('applications')
      .createSignedUrl(path, 3600) // 1 hour expiry

    window.open(data.signedUrl, '_blank')
  }

  onMounted(() => {
    // Check for existing task
    loadExistingTask()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    task,
    isGenerating,
    hasGeneratedCV,
    generateCV,
    downloadCV
  }
}
```

---

### 2.2 Backend - Cloudflare Worker

**File Structure:**
```
app/workers/src/
├── index.ts                 # Main entry, cron trigger
├── tasks/
│   ├── generate-cv.ts       # CV generation handler
│   ├── generate-cover-letter.ts
│   └── compile-latex.ts
├── services/
│   ├── claude-api.ts        # Anthropic API client
│   ├── render-latex.ts      # Render.com LaTeX client
│   └── supabase-client.ts   # Supabase service role client
├── utils/
│   ├── markdown-to-latex.ts # Conversion utilities
│   └── template-engine.ts   # LaTeX template filling
└── types/
    └── cv-generator.ts      # TypeScript types
```

#### Main Worker Entry

**`index.ts`**
```typescript
import { handleGenerateCV } from './tasks/generate-cv'

export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  ANTHROPIC_API_KEY: string
  LATEX_ONLINE_API_KEY: string
}

export default {
  // Cron trigger: Every 30 seconds
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Poll for pending tasks
    const tasks = await fetchPendingTasks(env)

    for (const task of tasks) {
      if (task.task_type === 'generate_cv') {
        // Process in background (don't await)
        ctx.waitUntil(handleGenerateCV(task, env))
      }
    }
  },

  // HTTP endpoint for manual triggering (dev/testing)
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/generate-cv' && request.method === 'POST') {
      const body = await request.json()
      const task = await createTask(body, env)
      await handleGenerateCV(task, env)
      return Response.json({ success: true, task_id: task.id })
    }

    return new Response('Not Found', { status: 404 })
  }
}

async function fetchPendingTasks(env: Env): Promise<ProcessingQueueTask[]> {
  const { data } = await supabase(env)
    .from('processing_queue_tasks')
    .select('*')
    .eq('task_type', 'generate_cv')
    .in('status', ['pending', 'processing'])
    .lt('attempts', 3)
    .order('created_at', { ascending: true })
    .limit(10)

  return data || []
}
```

#### CV Generation Handler

**`tasks/generate-cv.ts`**
```typescript
import { ClaudeAPI } from '../services/claude-api'
import { LaTeXOnline } from '../services/latex-online'
import { supabase } from '../services/supabase-client'
import { markdownToLaTeX } from '../utils/markdown-to-latex'

export async function handleGenerateCV(
  task: ProcessingQueueTask,
  env: Env
): Promise<void> {
  const { job_id, profile_id, generate_cover_letter } = task.payload

  try {
    // 1. Update status to processing
    await updateTaskStatus(task.id, 'processing', env)

    // 2. Fetch data
    const profile = await fetchMasterProfile(profile_id, env)
    const job = await fetchJob(job_id, env)

    // 3. Generate CV markdown
    const cvMarkdown = await generateCVMarkdown(profile, job, env)

    // 4. Generate cover letter markdown (if requested)
    const clMarkdown = generate_cover_letter
      ? await generateCoverLetterMarkdown(profile, job, env)
      : null

    // 5. Convert to LaTeX
    const cvLaTeX = markdownToLaTeX(cvMarkdown, profile)
    const clLaTeX = clMarkdown ? markdownToLaTeX(clMarkdown, profile) : null

    // 6. Compile to PDF
    const cvPDF = await compileToPDF(cvLaTeX, env)
    const clPDF = clLaTeX ? await compileToPDF(clLaTeX, env) : null

    // 7. Upload to Supabase Storage
    const cvPath = await uploadToStorage(
      `cv-generated-docs/${job_id}/final-cv.pdf`,
      cvPDF,
      env
    )
    const clPath = clPDF
      ? await uploadToStorage(
          `cv-generated-docs/${job_id}/final-cover-letter.pdf`,
          clPDF,
          env
        )
      : null

    // 8. Store markdown and LaTeX too (for debugging)
    await uploadToStorage(
      `cv-generated-docs/${job_id}/final-cv.md`,
      cvMarkdown,
      env
    )
    await uploadToStorage(
      `cv-generated-docs/${job_id}/final-cv.tex`,
      cvLaTeX,
      env
    )

    // 9. Update task status
    await updateTaskStatus(task.id, 'completed', env, {
      result: {
        cv_path: cvPath,
        cover_letter_path: clPath,
        generated_at: new Date().toISOString()
      }
    })

    // 10. Create notification
    await createNotification(profile.user_id, {
      title: 'CV Ready',
      message: `Your CV for ${job.company_name} is ready to download`,
      type: 'cv_generation_complete',
      data: { job_id, cv_path: cvPath }
    }, env)

  } catch (error) {
    // Handle error
    await handleTaskError(task, error, env)
  }
}

async function generateCVMarkdown(
  profile: MasterProfile,
  job: Job,
  env: Env
): Promise<string> {
  const claude = new ClaudeAPI(env.ANTHROPIC_API_KEY)

  const prompt = `You are an expert CV writer. Generate a tailored CV in markdown format.

Master Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
Company: ${job.company_name}
Position: ${job.position}
Description:
${job.job_description}

Requirements:
- Use ONLY information from the master profile (never fabricate)
- Tailor achievements to match job requirements
- Quantify achievements where possible
- Professional tone
- ATS-optimized keywords from job description
- Output in valid markdown format

Generate the CV markdown now:`

  const response = await claude.complete(prompt, {
    max_tokens: 4000,
    temperature: 0.7
  })

  return response.completion
}

async function compileToPDF(
  latexContent: string,
  env: Env
): Promise<ArrayBuffer> {
  const latexOnline = new LaTeXOnline(env.LATEX_ONLINE_API_KEY)

  // Send LaTeX to external service
  const pdfBuffer = await latexOnline.compile(latexContent)

  return pdfBuffer
}

async function handleTaskError(
  task: ProcessingQueueTask,
  error: Error,
  env: Env
): Promise<void> {
  const attempts = task.attempts + 1

  if (attempts < task.max_attempts) {
    // Retry
    await supabase(env)
      .from('processing_queue_tasks')
      .update({
        status: 'pending',
        attempts,
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id)
  } else {
    // Failed permanently
    await updateTaskStatus(task.id, 'failed', env, {
      error_message: error.message,
      error_stack: error.stack
    })

    // Notify user of failure
    await createNotification(task.user_id, {
      title: 'CV Generation Failed',
      message: `Failed to generate CV: ${error.message}`,
      type: 'cv_generation_failed',
      data: { job_id: task.payload.job_id }
    }, env)
  }
}
```

---

## 3. Data Flow

### 3.1 Generation Flow (Happy Path)

```
User Action
    ↓
1. Click "Generate CV" button
    ↓
2. Frontend creates task in processing_queue_tasks
   {
     task_type: 'generate_cv',
     payload: { job_id, profile_id, options },
     status: 'pending'
   }
    ↓
3. Frontend starts polling task status (every 5 seconds)
    ↓
4. Cloudflare Worker cron runs (every 30 seconds)
    ↓
5. Worker finds pending 'generate_cv' task
    ↓
6. Worker updates status → 'processing'
    ↓
7. Worker fetches master_profile data
    ↓
8. Worker fetches job data
    ↓
9. Worker calls Claude API → CV markdown
    ↓
10. Worker calls Claude API → Cover letter markdown
    ↓
11. Worker converts markdown → LaTeX
    ↓
12. Worker calls Render.com (tectonic) → PDF
    ↓
13. Worker uploads files to Supabase Storage
     - cv-generated-docs/{job_id}/final-cv.md
     - cv-generated-docs/{job_id}/final-cv.tex
     - cv-generated-docs/{job_id}/final-cv.pdf
     - cv-generated-docs/{job_id}/final-cover-letter.pdf
    ↓
14. Worker updates task status → 'completed'
     result: { cv_path, cover_letter_path }
    ↓
15. Worker creates notification
    ↓
16. Frontend polling detects status change
    ↓
17. Frontend displays "CV Ready" notification
    ↓
18. User clicks "Download CV"
    ↓
19. Frontend requests signed URL from Supabase Storage
    ↓
20. User downloads PDF
```

### 3.2 Error Flow

```
Worker Processing
    ↓
Error Occurs (API timeout, LaTeX error, etc.)
    ↓
Worker catches error
    ↓
Check attempts < max_attempts (3)?
    ├─ Yes: Update task status → 'pending', increment attempts
    │       Worker will retry in next cron cycle
    │
    └─ No: Update task status → 'failed'
           Store error_message and error_stack
           Create failure notification
           User sees "Generation Failed" with error details
```

---

## 4. Integration Points

### 4.1 Master Profile Integration

**Data Flow:**
```
CV Generator Worker
    ↓
Query: master_profiles table (with RLS bypassed via service role)
    ↓
Fetch: Full profile with nested data
    - Basic info
    - Work experiences
    - Skills
    - Education
    - Certifications
    ↓
Pass to Claude API for CV generation
```

**API Endpoints Used:**
- `GET /rest/v1/master_profiles?id=eq.{profile_id}&select=*,work_experiences(*,achievements(*)),skills(*),education(*),certifications(*)`

**RLS Consideration:**
Worker uses Supabase **service role key** to bypass RLS (has full access).

---

### 4.2 Kanban Job Tracker Integration

**Trigger Point:**
```vue
<!-- JobCardDetailView.vue -->
<button @click="generateCV">
  Generate CV
</button>
```

**Data Flow:**
```
Kanban Job Card
    ↓
Provides: job_id
    ↓
CV Generator creates task
    ↓
Task links back to job via job_id
    ↓
Generated CV stored in Storage with job_id path
    ↓
Job card displays CV status and download link
```

**Database Relationship:**
```sql
-- Optional: Add cv_generated column to jobs table
ALTER TABLE jobs ADD COLUMN cv_generated_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN cv_file_path TEXT;

-- Update after generation
UPDATE jobs
SET cv_generated_at = NOW(),
    cv_file_path = '/cv-generated-docs/{job_id}/final-cv.pdf'
WHERE id = {job_id};
```

---

### 4.3 Notification Integration

**Notification Schema:**
```typescript
interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'cv_generation_complete' | 'cv_generation_failed'
  data: {
    job_id: string
    cv_path?: string
    error_message?: string
  }
  read: boolean
  created_at: string
}
```

**Frontend Notification Polling:**
```typescript
// Poll for new notifications every 30 seconds
setInterval(async () => {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })

  // Display in notification bell icon
  displayNotifications(data)
}, 30000)
```

---

## 5. Storage Strategy

### 5.1 Supabase Storage Structure

**Bucket:** `applications` (private)

**Folder Structure:**
```
applications/
└── cv-generated-docs/
    └── {job_id}/
        ├── final-cv.md                  # Markdown source
        ├── final-cv.tex                 # LaTeX source
        ├── final-cv.pdf                 # Final PDF
        ├── final-cover-letter.md
        ├── final-cover-letter.tex
        └── final-cover-letter.pdf

        # Phase 2: Multiple versions
        ├── draft-cv.pdf
        ├── optimistic-cv.pdf
        ├── skeptical-cv.pdf
        └── manager-final-cv.pdf
```

**Access Control:**
- Bucket is **private** (not publicly accessible)
- Access via **signed URLs** with 1-hour expiry
- RLS policies check user_id ownership

**Storage Policies:**
```sql
-- Allow users to read their own generated CVs
CREATE POLICY "Users can read own CVs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'applications'
    AND (storage.foldername(name))[1] = 'cv-generated-docs'
    AND auth.uid() IN (
      SELECT user_id FROM jobs
      WHERE id::text = (storage.foldername(name))[2]
    )
  );

-- Workers can write CVs (service role only)
CREATE POLICY "Service role can write CVs"
  ON storage.objects FOR INSERT
  USING (bucket_id = 'applications' AND auth.role() = 'service_role');
```

### 5.2 Cleanup Strategy

**Retention Policy:**
- Keep generated CVs for 90 days
- After 90 days, archive or delete to save storage

**Cleanup Cron (future):**
```sql
-- Scheduled function to delete old CVs
CREATE OR REPLACE FUNCTION cleanup_old_cvs()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'applications'
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

---

## 6. External Services

### 6.1 Anthropic Claude API

**Purpose:** Generate CV and cover letter markdown

**Configuration:**
```typescript
// services/claude-api.ts
export class ClaudeAPI {
  constructor(private apiKey: string) {}

  async complete(prompt: string, options: {
    max_tokens: number
    temperature: number
  }): Promise<{ completion: string }> {
    const response = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: options.max_tokens,
        temperature: options.temperature
      })
    })

    return response.json()
  }
}
```

**Cost Estimation:**
- CV generation: ~2,000 tokens → $0.15
- Cover letter: ~1,000 tokens → $0.075
- **Total per application:** ~$0.225
- **Monthly (20 apps):** ~$4.50

**Error Handling:**
- Retry on 429 (rate limit) with exponential backoff
- Retry on 500 (server error) up to 3 times
- Fail permanently on 400 (bad request)

---

### 6.2 Render.com + Tectonic (Self-Hosted)

**Purpose:** Compile LaTeX to PDF using tectonic

**Why Render.com:**
- ✅ **FREE** (750 hours/month, enough for 24/7 uptime)
- ✅ Uses same `tectonic` as local CLI (consistent quality)
- ✅ No third-party API dependencies
- ✅ No rate limits
- ✅ Easy deployment (Docker + GitHub)

**API Endpoint:** `https://latex-compiler-[your-app].onrender.com/compile`

**Configuration:**
```typescript
// services/render-latex.ts
export class RenderLaTeX {
  constructor(private apiUrl: string) {
    // apiUrl = https://latex-compiler-abc123.onrender.com
  }

  async compile(latexContent: string): Promise<ArrayBuffer> {
    const response = await fetch(`${this.apiUrl}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex: latexContent })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`LaTeX compilation failed: ${error.error}`)
    }

    return response.arrayBuffer()
  }
}
```

**Service Architecture:**
```
Render.com (Free Tier)
├── Docker Container
│   ├── tectonic (compiled from Rust)
│   ├── Node.js HTTP server
│   └── /tmp for temp files
├── Resources:
│   ├── 512MB RAM
│   ├── Shared CPU
│   └── 750 hrs/month (always-on)
└── Health checks: /health endpoint
```

**Compilation Time:**
- First request: ~30-60s (cold start + compilation)
- Subsequent requests: ~30-45s (compilation only)
- Free tier has slower CPU than local machine

**Fallback Strategy:**
If Render.com service fails:
1. Retry once after 5 seconds
2. If still fails, store markdown and LaTeX only
3. Notify user: "PDF compilation failed, markdown available"
4. User can download LaTeX and compile locally with tectonic

**Setup Guide:** See [LATEX_SERVICE.md](./LATEX_SERVICE.md) for complete deployment instructions

**Cost:** $0/month (free tier is sufficient for MVP)

---

## 7. Error Handling

### 7.1 Error Categories

| Error Type | Handling Strategy | User Impact |
|------------|-------------------|-------------|
| **Transient Errors** | Retry up to 3 times | Delayed completion (no user action needed) |
| - API rate limit | | |
| - Network timeout | | |
| - Temporary service outage | | |
| **Permanent Errors** | Fail task, notify user | User must fix data or retry manually |
| - Invalid profile data | | |
| - Missing required fields | | |
| - LaTeX syntax error | | |
| **System Errors** | Log, alert engineering | User sees generic error, support notified |
| - Worker crash | | |
| - Database connection failure | | |

### 7.2 Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries - 1) throw error

      const delay = baseDelay * Math.pow(2, attempt)
      await sleep(delay)
    }
  }
  throw new Error('Max retries exceeded')
}

// Usage
const cvMarkdown = await retryWithBackoff(
  () => generateCVMarkdown(profile, job, env),
  3,
  2000
)
```

### 7.3 Monitoring & Alerts

**Metrics to Track:**
- Task success rate (target: ≥ 95%)
- Average processing time (target: < 3 minutes)
- Error rate by type
- API costs (Claude API, Render.com uptime)

**Alerting:**
- Email alert if success rate drops below 90%
- Slack notification on worker crashes
- Budget alert if Claude API costs > $20/month

---

## 8. Security

### 8.1 API Key Management

**Cloudflare Worker Secrets:**
```bash
# Set secrets (never commit these!)
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put LATEX_ONLINE_API_KEY
```

**Access Control:**
- Secrets only accessible to worker runtime
- Not exposed in logs or error messages
- Rotate keys quarterly

### 8.2 Data Privacy

**Master Profile Data:**
- Worker uses service role (bypasses RLS)
- Only fetches data for the requesting user's job
- No logging of PII (names, emails, etc.)

**Generated CVs:**
- Stored in private Storage bucket
- Access via signed URLs only (1-hour expiry)
- RLS policies verify user ownership

### 8.3 Input Validation

**Task Payload Validation:**
```typescript
import { z } from 'zod'

const GenerateCVPayloadSchema = z.object({
  job_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  generate_cover_letter: z.boolean().default(true),
  include_reviews: z.boolean().default(false)
})

// Validate before processing
const payload = GenerateCVPayloadSchema.parse(task.payload)
```

**Claude API Output Sanitization:**
- Validate markdown structure
- Remove potentially malicious LaTeX commands
- Limit output length (max 10,000 chars)

---

## 9. Scalability

### 9.1 Current Scale

**Assumptions:**
- 1 user (MVP)
- 20 applications/month
- 20 CV generations/month
- 1 worker processing queue

**Resource Usage:**
- Cloudflare Workers: ~20 invocations/month (free tier: 100k/day)
- Supabase Storage: ~40MB/month (free tier: 1GB)
- Claude API: ~$5/month (free tier: $18 starting credit)

**Bottlenecks:** None at current scale

### 9.2 Future Scale (100 Users)

**Assumptions:**
- 100 users
- 20 apps/user/month = 2,000 CV generations/month
- Peak: 100 concurrent generations

**Resource Usage:**
- Cloudflare Workers: ~2,000 invocations/month (still free tier)
- Supabase Storage: ~4GB/month ($0.021/GB = $0.08/month)
- Claude API: ~$500/month
- Render.com: Free tier (750 hrs/month) sufficient for 24/7 uptime

**Scaling Strategy:**
1. **Worker Concurrency:** Cloudflare Workers auto-scales (no action needed)
2. **Task Queue:** Add indexing on status + created_at for faster polling
3. **LaTeX Compilation:** Migrate to self-hosted Gotenberg to remove rate limits
4. **Cost Optimization:** Batch multiple jobs per Claude API call

**Database Optimization:**
```sql
-- Index for faster task polling
CREATE INDEX idx_tasks_pending
ON processing_queue_tasks(task_type, status, created_at)
WHERE status IN ('pending', 'processing');

-- Partition tasks table by month (future)
CREATE TABLE processing_queue_tasks_2025_10
PARTITION OF processing_queue_tasks
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
```

---

## Next Steps

1. ✅ Review architecture with engineering team
2. ⏳ Deploy Render.com tectonic service (1 day spike)
3. ⏳ Build MVP worker (Sprint 1-2)
4. ⏳ Load testing (100 concurrent tasks)
5. ⏳ Deploy to production

---

## Related Documents

- **PRD:** [PRD.md](./PRD.md) - Product requirements
- **User Stories:** [USER_STORIES.md](./USER_STORIES.md) - Sprint-ready stories
- **Implementation Plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Phased rollout
