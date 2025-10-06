# Technical Specification - CV Upload & Extraction

**Version:** 1.0
**Date:** October 6, 2025
**Status:** Architecture Reviewed & Approved
**Reviewer:** Software Architect
**Recommendation:** DEFER TO PHASE 3

---

## Table of Contents

1. [Architecture Decision Analysis](#1-architecture-decision-analysis)
2. [Recommended Architecture](#2-recommended-architecture)
3. [Database Schema](#3-database-schema)
4. [Frontend Components](#4-frontend-components)
5. [AI Integration](#5-ai-integration)
6. [Performance & Scalability](#6-performance--scalability)
7. [Integration Points](#7-integration-points)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. Architecture Decision Analysis

### Option A: Client-Side Direct AI Processing

```
Browser → Anthropic Claude API (direct) → Extract → Populate Form
```

**Implementation:**
```typescript
// ❌ NEVER DO THIS
const apiKey = 'sk-ant-...'; // Exposed in browser!
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': apiKey }
});
```

**Problems:**
- 🔴 **CRITICAL SECURITY RISK:** API key exposed in browser source code
- 🔴 **NO COST CONTROL:** Users can drain API credits freely
- 🔴 **BROWSER LIMITATIONS:** Large PDFs (5MB+) slow down browser
- 🔴 **NO RETRY LOGIC:** Network failures = user must re-upload

**Verdict:** ❌ **ARCHITECTURALLY UNSOUND - DO NOT USE**

---

### Option B: Cloudflare Worker Processing

```
Browser → Cloudflare Worker → Supabase Storage → Claude API → Response
```

**Implementation:**
```typescript
// workers/cv-extract/index.ts
export default {
  async fetch(request: Request, env: Env) {
    // 1. Receive file upload
    const formData = await request.formData();
    const file = formData.get('cv');

    // 2. Upload to Supabase Storage
    const { publicUrl } = await uploadToSupabase(file, env.SUPABASE_URL);

    // 3. Extract text from PDF
    const text = await extractPDFText(file);

    // 4. Call Claude API (API key in worker env)
    const extraction = await callClaude(text, env.ANTHROPIC_API_KEY);

    return new Response(JSON.stringify(extraction));
  }
};
```

**Pros:**
- ✅ API keys secured in worker environment
- ✅ Can implement rate limiting per user
- ✅ Auto-scaling (serverless)
- ✅ Global edge deployment (low latency)

**Cons:**
- ⚠️ **New infrastructure:** Not currently using Cloudflare Workers
- ⚠️ **Synchronous timeout:** Workers have 30-50s limit → long CVs fail
- ⚠️ **No retry logic:** Network errors = user must re-upload
- ⚠️ **Bundle size:** pdf-parse library adds 2MB to worker
- ⚠️ **Deployment complexity:** Separate CI/CD pipeline needed

**Estimated Effort:** 12-18 hours
**Verdict:** ⚠️ **FEASIBLE BUT ADDS NEW INFRASTRUCTURE**

---

### Option C: Supabase Edge Function

```
Browser → Supabase Edge Function → Supabase Storage → Claude API → Database
```

**Implementation:**
```typescript
// supabase/functions/cv-extract/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  // 1. Validate file
  const formData = await req.formData();
  const file = formData.get('cv') as File;

  // 2. Upload to Storage
  const { data: upload } = await supabase.storage
    .from('cv-uploads')
    .upload(`${userId}/${file.name}`, file);

  // 3. Extract text (Deno-compatible library)
  const arrayBuffer = await file.arrayBuffer();
  const text = await extractText(arrayBuffer);

  // 4. Call Claude API
  const extraction = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
      'content-type': 'application/json'
    },
    body: JSON.stringify({ /* extraction request */ })
  });

  return new Response(JSON.stringify(extraction));
});
```

**Pros:**
- ✅ **Fits existing stack:** Already using Supabase
- ✅ **RLS integration:** Storage policies work automatically
- ✅ **Simpler deployment:** `supabase functions deploy`
- ✅ **Environment variables:** API keys in Edge Function secrets

**Cons:**
- ⚠️ **Same timeout issues:** Edge Functions also timeout (25-30s)
- ⚠️ **Synchronous processing:** User waits during extraction
- ⚠️ **Deno ecosystem:** PDF parsing libraries less mature than Node.js
- ⚠️ **No retry queue:** Failed extractions require user to re-upload

**Estimated Effort:** 10-14 hours
**Verdict:** 🟡 **BEST FIT FOR CURRENT STACK, BUT TIMEOUT RISK**

---

### Option D: Async Job Queue (RECOMMENDED)

```
Browser → Upload API → Storage → Job Queue → Worker → Claude API
                          ↓                              ↓
                   Return taskId              Update task status
                          ↓                              ↓
                    Frontend ← Poll every 2s ← Check status
```

**Implementation:**

**Step 1: Upload (returns immediately)**
```typescript
// POST /functions/v1/cv-upload
async function handleUpload(file: File) {
  // 1. Store file
  const { data: filePath } = await supabase.storage
    .from('cv-uploads')
    .upload(`${userId}/${file.name}`, file);

  // 2. Create extraction task
  const { data: task } = await supabase
    .from('cv_extraction_tasks')
    .insert({
      user_id: userId,
      file_path: filePath,
      status: 'pending'
    })
    .select()
    .single();

  // 3. Return immediately (don't wait for extraction)
  return { task_id: task.id };
}
```

**Step 2: Background Worker (processes async)**
```typescript
// Supabase Database Function (pg_cron trigger)
CREATE OR REPLACE FUNCTION process_pending_extractions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_task cv_extraction_tasks;
BEGIN
  -- Get next pending task
  SELECT * INTO v_task
  FROM cv_extraction_tasks
  WHERE status = 'pending'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_task IS NULL THEN
    RETURN; -- No pending tasks
  END IF;

  -- Update status to processing
  UPDATE cv_extraction_tasks
  SET status = 'processing', started_at = NOW()
  WHERE id = v_task.id;

  -- Call Edge Function to do actual extraction
  -- (This is the long-running part)
  PERFORM http_post(
    'https://your-project.supabase.co/functions/v1/extract-cv-worker',
    jsonb_build_object('task_id', v_task.id)
  );
END;
$$;

-- Schedule every 10 seconds
SELECT cron.schedule('process-cv-extractions', '*/10 * * * * *', 'SELECT process_pending_extractions()');
```

**Step 3: Frontend Polling**
```typescript
async function pollStatus(taskId: string) {
  while (true) {
    const { data } = await supabase
      .from('cv_extraction_tasks')
      .select('status, extracted_data')
      .eq('id', taskId)
      .single();

    if (data.status === 'completed') {
      return data.extracted_data;
    } else if (data.status === 'failed') {
      throw new Error('Extraction failed');
    }

    await sleep(2000); // Poll every 2 seconds
  }
}
```

**Pros:**
- ✅ **Proper async pattern:** Upload returns instantly (<1s)
- ✅ **No timeout issues:** Extraction can take 60+ seconds
- ✅ **Retry logic:** Can auto-retry failed extractions
- ✅ **Scalable:** Process 100s of CVs concurrently
- ✅ **Better UX:** Loading state with progress indicator
- ✅ **Testable:** Extraction logic independent of upload

**Cons:**
- ⚠️ **Higher complexity:** Need job queue, worker, polling
- ⚠️ **More infrastructure:** Background worker process needed
- ⚠️ **Polling overhead:** Frontend polls every 2s (network traffic)
- ⚠️ **More failure modes:** Queue, worker, polling can all fail

**Estimated Effort:** 20-30 hours (full feature)
**Verdict:** ✅ **RECOMMENDED IF BUILDING THIS FEATURE**

---

## 2. Recommended Architecture

### 2.1 System Overview

If building CV extraction, use **Option D (Async Job Queue)**.

**Architecture Diagram:**
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Upload CV
       ↓
┌─────────────────────────┐
│ Upload API              │
│ (Edge Function)         │
│ - Validate file         │
│ - Store in Storage      │
│ - Create task record    │
│ - Return task_id        │
└──────┬──────────────────┘
       │
       ↓ 2. Task created
┌─────────────────────────┐
│ cv_extraction_tasks     │
│ status: 'pending'       │
└──────┬──────────────────┘
       │
       ↓ 3. Worker picks up (pg_cron every 10s)
┌─────────────────────────┐
│ Background Worker       │
│ (Edge Function)         │
│ - Download CV from      │
│   Storage               │
│ - Extract text          │
│ - Call Claude API       │
│ - Parse response        │
│ - Validate data         │
│ - Update task status    │
└──────┬──────────────────┘
       │
       ↓ 4. Extraction complete
┌─────────────────────────┐
│ cv_extraction_tasks     │
│ status: 'completed'     │
│ extracted_data: {...}   │
└──────┬──────────────────┘
       │
       ↑ 5. Poll every 2s
┌─────────────┐
│   Browser   │
│ - Show      │
│   progress  │
│ - Get       │
│   results   │
│ - Populate  │
│   form      │
└─────────────┘
```

### 2.2 Data Flow

**Step 1: Upload (Instant Response)**
```
User selects file → Client validates → POST to Edge Function
→ Store in Supabase Storage → Create task record → Return task_id
Total time: <1 second
```

**Step 2: Extraction (Background)**
```
pg_cron triggers worker (every 10s) → Worker picks up pending task
→ Download file → Extract text → Call Claude API → Parse response
→ Update task with results
Total time: 10-30 seconds (user not waiting)
```

**Step 3: Status Check (Polling)**
```
Frontend polls task status every 2s → Check task.status
→ If 'completed': Get extracted_data → Populate form
→ If 'failed': Show error → Offer retry
```

---

## 3. Database Schema

### 3.1 New Tables

#### Table: cv_uploads

**Purpose:** Store uploaded CV file metadata

```sql
CREATE TABLE cv_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For pre-auth uploads
  profile_id UUID REFERENCES master_profiles(id) ON DELETE SET NULL,

  -- File metadata
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,

  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Constraints
  CONSTRAINT valid_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  CONSTRAINT valid_mime_type CHECK (
    mime_type IN (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  CONSTRAINT has_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_cv_uploads_user ON cv_uploads(user_id) WHERE user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_cv_uploads_session ON cv_uploads(session_id) WHERE session_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_cv_uploads_deleted ON cv_uploads(deleted_at) WHERE deleted_at IS NOT NULL;
```

#### Table: cv_extraction_tasks

**Purpose:** Track async extraction job status

```sql
CREATE TABLE cv_extraction_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  cv_upload_id UUID REFERENCES cv_uploads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  session_id TEXT,

  -- Job status
  status TEXT NOT NULL DEFAULT 'pending',

  -- Results
  extracted_data JSONB, -- Full extraction result
  confidence_score NUMERIC(3,2), -- 0.00-1.00
  validation_errors JSONB, -- Array of field errors

  -- Error handling
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  max_retries INTEGER DEFAULT 3 NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  CONSTRAINT valid_confidence CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  ),
  CONSTRAINT max_retries_check CHECK (retry_count <= max_retries)
);

-- Indexes
CREATE INDEX idx_extraction_tasks_status ON cv_extraction_tasks(status, created_at) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_extraction_tasks_user ON cv_extraction_tasks(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_extraction_tasks_session ON cv_extraction_tasks(session_id) WHERE session_id IS NOT NULL;
```

#### Table: cv_upload_rate_limits

**Purpose:** Prevent abuse via rate limiting

```sql
CREATE TABLE cv_upload_rate_limits (
  user_id UUID,
  session_id TEXT,
  upload_count INTEGER DEFAULT 0 NOT NULL,
  window_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure one of user_id or session_id present
  CONSTRAINT has_identifier CHECK (user_id IS NOT NULL OR session_id IS NOT NULL),

  -- Unique constraint
  CONSTRAINT unique_rate_limit UNIQUE NULLS NOT DISTINCT (user_id, session_id)
);

-- Function: Check rate limit before upload
CREATE OR REPLACE FUNCTION check_cv_upload_rate_limit(
  p_user_id UUID,
  p_session_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_limit CONSTANT INTEGER := 5; -- 5 uploads per hour
  v_window CONSTANT INTERVAL := '1 hour';
BEGIN
  -- Get current count and window
  SELECT upload_count, window_start INTO v_count, v_window_start
  FROM cv_upload_rate_limits
  WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
     OR (p_user_id IS NULL AND session_id = p_session_id);

  -- Reset window if expired
  IF v_window_start IS NULL OR v_window_start < NOW() - v_window THEN
    INSERT INTO cv_upload_rate_limits (user_id, session_id, upload_count, window_start)
    VALUES (p_user_id, p_session_id, 1, NOW())
    ON CONFLICT ((COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), COALESCE(session_id, '')))
    DO UPDATE SET upload_count = 1, window_start = NOW();
    RETURN true;
  END IF;

  -- Check if limit exceeded
  IF v_count >= v_limit THEN
    RETURN false;
  END IF;

  -- Increment counter
  UPDATE cv_upload_rate_limits
  SET upload_count = upload_count + 1
  WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
     OR (p_user_id IS NULL AND session_id = p_session_id);

  RETURN true;
END;
$$;
```

### 3.2 RLS Policies

#### cv_uploads Table

```sql
ALTER TABLE cv_uploads ENABLE ROW LEVEL SECURITY;

-- Users can view own uploads
CREATE POLICY "Users view own cv uploads"
  ON cv_uploads FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

-- Users can upload CVs
CREATE POLICY "Users upload own cvs"
  ON cv_uploads FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Users can delete own uploads
CREATE POLICY "Users delete own uploads"
  ON cv_uploads FOR DELETE
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
  );
```

#### cv_extraction_tasks Table

```sql
ALTER TABLE cv_extraction_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own extraction tasks"
  ON cv_extraction_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cv_uploads u
      WHERE u.id = cv_extraction_tasks.cv_upload_id
      AND u.deleted_at IS NULL
      AND (
        (u.user_id IS NOT NULL AND auth.uid() = u.user_id)
        OR (u.user_id IS NULL AND u.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
      )
    )
  );
```

#### Supabase Storage Bucket Policies

```sql
-- cv-uploads bucket
-- Users can upload to their own folder
CREATE POLICY "Users upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cv-uploads'
    AND (auth.uid()::text || '/') = (storage.foldername(name))[1]
  );

-- Users can read their own files
CREATE POLICY "Users read own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cv-uploads'
    AND (auth.uid()::text || '/') = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "Users delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cv-uploads'
    AND (auth.uid()::text || '/') = (storage.foldername(name))[1]
  );
```

---

## 4. Frontend Components

### 4.1 Component Hierarchy

```
ProfilesListView.vue
  └─ ProfileCreationModal.vue (NEW)
       ├─ Option: "Upload CV" → CVUploadModal.vue (NEW)
       └─ Option: "Manual Entry" → ProfileCreateView.vue (existing)

CVUploadModal.vue
  ├─ FileUploadInput.vue (NEW)
  ├─ UploadProgress.vue (NEW)
  └─ ExtractionStatus.vue (NEW)
       └─ On complete → Navigate to ProfileCreateView with initialData

ProfileCreateView.vue (modified)
  └─ ProfileForm.vue (modified)
       └─ Accepts initialData prop
       └─ Shows confidence badges
```

### 4.2 Component Specifications

#### ProfileCreationModal.vue

**Purpose:** Choose between upload or manual entry

**Props:** None

**Emits:**
- `close()` - User dismissed modal
- `uploadSelected()` - User chose upload
- `manualSelected()` - User chose manual

**Template:**
```vue
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2>How would you like to create your profile?</h2>

      <div class="options">
        <button @click="$emit('uploadSelected')" class="option-card primary">
          <span class="icon">📄</span>
          <h3>Upload CV</h3>
          <p>Let AI extract your information</p>
          <small>PDF or DOCX • Max 10MB</small>
        </button>

        <button @click="$emit('manualSelected')" class="option-card secondary">
          <span class="icon">✍️</span>
          <h3>Enter Manually</h3>
          <p>Fill out the form yourself</p>
          <small>Takes about 15 minutes</small>
        </button>
      </div>
    </div>
  </div>
</template>
```

#### CVUploadModal.vue

**Purpose:** File upload with extraction status

**Props:**
```typescript
interface Props {
  modelValue: boolean; // v-model for show/hide
}
```

**Emits:**
- `update:modelValue(boolean)` - Modal visibility
- `extractionComplete(ExtractedCVData)` - Extraction finished

**State Machine:**
```typescript
enum UploadState {
  FILE_SELECT = 'file_select',   // Initial state
  UPLOADING = 'uploading',        // File uploading
  EXTRACTING = 'extracting',      // AI processing
  REVIEW = 'review',              // Show extracted data
  ERROR = 'error'                 // Error occurred
}
```

**Template:**
```vue
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <!-- State: FILE_SELECT -->
      <div v-if="state === 'file_select'">
        <h2>Upload Your CV</h2>
        <FileUploadInput
          @file-selected="handleFileSelect"
          :allowed-types="['pdf', 'docx']"
          :max-size="10485760"
        />
      </div>

      <!-- State: UPLOADING -->
      <div v-if="state === 'uploading'">
        <h2>Uploading...</h2>
        <ProgressBar :value="uploadProgress" />
        <p>{{ uploadProgress }}% complete</p>
      </div>

      <!-- State: EXTRACTING -->
      <div v-if="state === 'extracting'">
        <h2>Analyzing Your CV...</h2>
        <ProgressSpinner />
        <p>{{ statusMessage }}</p>
        <small>This may take up to 30 seconds</small>
      </div>

      <!-- State: REVIEW -->
      <div v-if="state === 'review'">
        <h2>Extraction Complete</h2>
        <div class="confidence-score" :class="confidenceClass">
          Confidence: {{ (confidenceScore * 100).toFixed(0) }}%
        </div>
        <div class="extracted-preview">
          <!-- Show key extracted fields -->
        </div>
        <button @click="handleConfirm">Use This Data</button>
        <button @click="handleRetry">Try Again</button>
      </div>

      <!-- State: ERROR -->
      <div v-if="state === 'error'">
        <h2>Extraction Failed</h2>
        <p class="error-message">{{ errorMessage }}</p>
        <button @click="handleRetry">Try Again</button>
        <button @click="handleManualEntry">Enter Manually</button>
      </div>
    </div>
  </div>
</template>
```

**Composable: useCVExtraction**
```typescript
// composables/useCVExtraction.ts
export function useCVExtraction() {
  const state = ref<UploadState>('file_select');
  const uploadProgress = ref(0);
  const statusMessage = ref('');
  const extractedData = ref<ExtractedCVData | null>(null);
  const errorMessage = ref('');

  async function uploadAndExtract(file: File) {
    state.value = 'uploading';

    try {
      // 1. Upload to Supabase Storage
      const { data: upload, error: uploadError } = await supabase.storage
        .from('cv-uploads')
        .upload(`${userId}/${file.name}`, file, {
          onUploadProgress: (progress) => {
            uploadProgress.value = (progress.loaded / progress.total) * 100;
          }
        });

      if (uploadError) throw uploadError;

      // 2. Create extraction task
      const { data: task } = await supabase
        .from('cv_extraction_tasks')
        .insert({
          cv_upload_id: upload.id,
          user_id: userId,
          session_id: sessionId,
          status: 'pending'
        })
        .select()
        .single();

      // 3. Poll for status
      state.value = 'extracting';
      const result = await pollExtractionStatus(task.id);

      if (result.status === 'completed') {
        extractedData.value = result.extracted_data;
        state.value = 'review';
      } else {
        throw new Error(result.error_message);
      }
    } catch (error) {
      state.value = 'error';
      errorMessage.value = error.message;
    }
  }

  async function pollExtractionStatus(taskId: string) {
    const maxAttempts = 30; // 60 seconds (2s intervals)

    for (let i = 0; i < maxAttempts; i++) {
      const { data } = await supabase
        .from('cv_extraction_tasks')
        .select('status, extracted_data, error_message, confidence_score')
        .eq('id', taskId)
        .single();

      if (data.status === 'completed' || data.status === 'failed') {
        return data;
      }

      statusMessage.value = `Processing... (${i * 2}s elapsed)`;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Extraction timeout after 60 seconds');
  }

  return {
    state,
    uploadProgress,
    statusMessage,
    extractedData,
    errorMessage,
    uploadAndExtract
  };
}
```

---

## 5. AI Integration

### 5.1 Claude API Configuration

**Model:** claude-3-5-sonnet-20241022
**Max Tokens:** 2048 (output)
**Temperature:** 0 (deterministic)

**API Request:**
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    temperature: 0,
    messages: [{
      role: 'user',
      content: extractionPrompt
    }]
  })
});
```

### 5.2 Extraction Prompt Template

```
You are a professional CV data extraction specialist. Extract structured information from the provided CV text and return it as valid JSON.

IMPORTANT RULES:
1. Only extract information explicitly stated in the CV. Do not invent or hallucinate data.
2. If a field is not found, use null (not empty string).
3. For dates, use YYYY-MM format (e.g., "2020-01" for January 2020).
4. For work experiences, extract in chronological order (most recent first).
5. Categorize skills accurately: Frontend, Backend, DevOps, Database, Other.
6. Include confidence scores (0.0-1.0) for each field based on clarity in CV.

OUTPUT FORMAT (valid JSON only, no markdown):
{
  "full_name": "string",
  "email": "string",
  "phone_primary": "string (E.164 format: +66123456789)",
  "location": "string (City, Country)",
  "professional_summary": "string (2-3 sentences from CV summary/objective)",
  "years_of_experience": number,
  "current_position": "string (most recent job title)",
  "work_experiences": [
    {
      "company_name": "string",
      "position_title": "string",
      "location": "string (City, Country)",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or null if current job",
      "is_current": boolean,
      "description": "string (key responsibilities)"
    }
  ],
  "skills": [
    {
      "skill_name": "string",
      "category": "Frontend|Backend|DevOps|Database|Design|Other",
      "proficiency_level": "Expert|Advanced|Intermediate|Beginner",
      "years_of_experience": number or null
    }
  ],
  "confidence_scores": {
    "full_name": 0.98,
    "email": 0.95,
    "phone_primary": 0.85,
    "location": 0.90,
    "professional_summary": 0.80,
    "work_experiences": 0.92,
    "skills": 0.88
  }
}

CV TEXT:
"""
{cv_text_content}
"""

Extract the data now and return ONLY the JSON object (no explanations, no markdown).
```

### 5.3 Response Parsing & Validation

```typescript
interface ExtractionResponse {
  content: Array<{ type: string; text: string }>;
}

function parseClaudeResponse(response: ExtractionResponse): ExtractedCVData {
  // 1. Extract JSON from response
  const jsonText = response.content[0].text;

  // 2. Parse JSON (handle potential errors)
  let extracted;
  try {
    extracted = JSON.parse(jsonText);
  } catch (err) {
    throw new Error('INVALID_JSON_RESPONSE');
  }

  // 3. Validate required fields
  const validationErrors = [];

  if (!extracted.full_name) {
    validationErrors.push({ field: 'full_name', message: 'Name not found in CV' });
  }

  if (!extracted.email || !isValidEmail(extracted.email)) {
    validationErrors.push({ field: 'email', message: 'Valid email not found' });
  }

  if (!extracted.location) {
    validationErrors.push({ field: 'location', message: 'Location not found' });
  }

  if (!extracted.professional_summary || extracted.professional_summary.length < 50) {
    validationErrors.push({ field: 'professional_summary', message: 'Summary too short or missing' });
  }

  // 4. Calculate overall confidence
  const confidenceValues = Object.values(extracted.confidence_scores || {});
  const avgConfidence = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;

  // 5. Return validated result
  return {
    ...extracted,
    confidence_score: avgConfidence,
    validation_errors: validationErrors
  };
}
```

---

## 6. Performance & Scalability

### 6.1 Latency Breakdown

| Operation | Expected Time | 95th Percentile |
|-----------|--------------|----------------|
| File upload (5MB) | 2-5 seconds | 8 seconds |
| PDF text extraction | 1-3 seconds | 5 seconds |
| Claude API call | 5-15 seconds | 20 seconds |
| Response parsing | <100ms | 200ms |
| Database save | <100ms | 200ms |
| **Total (async)** | **Upload: <1s** | **Upload: 2s** |
| **Total (background)** | **Extraction: 10-20s** | **Extraction: 30s** |

**User Experience:**
- Upload returns **instantly** (user doesn't wait)
- Extraction happens in background
- Progress indicator shows status
- User can navigate away and come back

### 6.2 Scalability Analysis

**Current Scale (Solo User):**
- 1 user × 2 uploads/month = **2 extractions/month**
- Cost: $0.10/month
- Storage: <100MB
- API calls: 2/month (well within limits)

**Target Scale (100 Users):**
- 100 users × 2 uploads/month = **200 extractions/month**
- Cost: $10/month
- Storage: ~5GB
- API calls: 200/month

**Max Scale (1,000 Users):**
- 1,000 users × 5 uploads/month = **5,000 extractions/month**
- Cost: $250/month
- Storage: ~50GB
- API calls: 5,000/month (need Build tier: 50 req/min)

**Bottlenecks:**
1. **Claude API rate limit:** Free tier = 50 req/day (insufficient for 1,000 users)
2. **Supabase Storage:** $0.021/GB/month (reasonable)
3. **Database queries:** RLS policies optimized with indexes

### 6.3 Cost Optimization Strategies

#### Strategy 1: Caching

```sql
-- Cache extraction results by file hash
CREATE TABLE cv_extraction_cache (
  file_hash TEXT PRIMARY KEY, -- SHA-256 hash
  extracted_data JSONB NOT NULL,
  confidence_score NUMERIC(3,2),
  cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  cache_hits INTEGER DEFAULT 0 NOT NULL,

  CONSTRAINT valid_cache_age CHECK (cached_at > NOW() - INTERVAL '90 days')
);

-- Before calling AI, check cache
SELECT extracted_data FROM cv_extraction_cache
WHERE file_hash = $1
  AND cached_at > NOW() - INTERVAL '90 days';

-- If hit, increment counter and return cached result
-- If miss, call AI and cache result
```

**Savings:** If 10% of uploads are duplicates, saves 10% of AI costs

#### Strategy 2: Use Cheaper Model for Simple CVs

```typescript
// Detect CV complexity
function estimateCVComplexity(text: string): 'simple' | 'complex' {
  const pageCount = (text.match(/\f/g) || []).length + 1;
  const wordCount = text.split(/\s+/).length;

  if (pageCount <= 2 && wordCount < 1000) {
    return 'simple'; // Use Claude Haiku ($0.25/$1.25 per million tokens)
  }
  return 'complex'; // Use Claude Sonnet ($3/$15 per million tokens)
}
```

**Savings:** 80% cost reduction on simple CVs (2-page, straightforward format)

---

## 7. Integration Points

### 7.1 Modify ProfilesListView.vue

**File:** `app/frontend/src/views/ProfilesListView.vue`

**Current (line 79-81):**
```typescript
function navigateToCreate() {
  router.push('/profiles/new');
}
```

**Change to:**
```typescript
const showCreationModal = ref(false);

function navigateToCreate() {
  showCreationModal.value = true;
}

function handleUploadSelected() {
  showUploadModal.value = true;
  showCreationModal.value = false;
}

function handleManualSelected() {
  router.push('/profiles/new');
  showCreationModal.value = false;
}
```

**Add to template:**
```vue
<ProfileCreationModal
  v-if="showCreationModal"
  @close="showCreationModal = false"
  @upload-selected="handleUploadSelected"
  @manual-selected="handleManualSelected"
/>

<CVUploadModal
  v-model="showUploadModal"
  @extraction-complete="handleExtractionComplete"
/>
```

### 7.2 Modify ProfileCreateView.vue

**File:** `app/frontend/src/views/ProfileCreateView.vue`

**Add Route Query Handling:**
```typescript
import { useRoute } from 'vue-router';

const route = useRoute();
const initialData = ref<Partial<MasterProfile> | null>(null);
const isFromExtraction = ref(false);

onMounted(() => {
  // Check if coming from CV extraction
  const taskId = route.query.task_id as string;
  if (taskId) {
    loadExtractionResult(taskId);
  }
});

async function loadExtractionResult(taskId: string) {
  const { data } = await supabase
    .from('cv_extraction_tasks')
    .select('extracted_data, confidence_score')
    .eq('id', taskId)
    .single();

  if (data?.extracted_data) {
    initialData.value = data.extracted_data;
    isFromExtraction.value = true;
  }
}
```

**Pass to ProfileForm:**
```vue
<ProfileForm
  :is-editing="false"
  :initial-data="initialData"
  :is-from-extraction="isFromExtraction"
/>
```

### 7.3 Modify ProfileForm.vue

**Add Props:**
```typescript
interface Props {
  isEditing: boolean;
  initialData?: Partial<MasterProfile>;
  isFromExtraction?: boolean;
  confidenceScores?: Record<string, number>;
}

const props = withDefaults(defineProps<Props>(), {
  isFromExtraction: false,
  confidenceScores: () => ({})
});
```

**Pre-populate Form:**
```typescript
onMounted(() => {
  if (props.initialData) {
    Object.assign(formData, props.initialData);
  }
});
```

**Show Confidence Badges:**
```vue
<div v-if="isFromExtraction" class="extraction-badge">
  <span class="icon">✨</span>
  Extracted from CV
  <button @click="handleClearExtraction">Start Over</button>
</div>

<!-- For each field with low confidence -->
<div class="form-field" :class="{ 'low-confidence': getConfidence('email') < 0.7 }">
  <label>Email</label>
  <input v-model="formData.email" />
  <span v-if="getConfidence('email') < 0.7" class="confidence-warning">
    ⚠️ Please verify - low extraction confidence
  </span>
</div>
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// tests/unit/cvExtraction.test.ts
describe('CV Extraction', () => {
  describe('File Validation', () => {
    it('should accept valid PDF files', () => {
      const file = createMockFile('resume.pdf', 'application/pdf', 5000000);
      expect(validateFile(file).valid).toBe(true);
    });

    it('should reject files over 10MB', () => {
      const file = createMockFile('large.pdf', 'application/pdf', 11000000);
      expect(validateFile(file).valid).toBe(false);
      expect(validateFile(file).error).toContain('10MB');
    });

    it('should reject .exe files with fake .pdf extension', () => {
      const file = createMockFileWithMagicNumber('malware.pdf', [0x4D, 0x5A]); // MZ header
      expect(validateFile(file).valid).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should validate email format', () => {
      const result = validateExtractionResult({ email: 'invalid-email' });
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'email' })
      );
    });

    it('should detect overlapping work dates', () => {
      const experiences = [
        { start_date: '2020-01', end_date: '2022-01' },
        { start_date: '2021-06', end_date: '2023-01' } // Overlaps!
      ];
      expect(validateWorkExperiences(experiences).errors.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence Scoring', () => {
    it('should flag fields with confidence <0.7', () => {
      const extraction = {
        full_name: 'John Doe',
        email: 'john@example.com',
        confidence_scores: { full_name: 0.95, email: 0.65 }
      };
      expect(requiresReview(extraction, 'email')).toBe(true);
      expect(requiresReview(extraction, 'full_name')).toBe(false);
    });
  });
});
```

### 8.2 Integration Tests

```typescript
// tests/integration/cvUploadFlow.test.ts
describe('CV Upload Flow', () => {
  it('should upload file to Supabase Storage', async () => {
    const file = await loadTestFile('sample-cv.pdf');
    const upload = await uploadCV(file);

    expect(upload.file_path).toMatch(/cv-uploads\//);

    // Verify file exists in storage
    const { data } = await supabase.storage
      .from('cv-uploads')
      .list(userId);

    expect(data).toContainEqual(
      expect.objectContaining({ name: file.name })
    );
  });

  it('should create extraction task after upload', async () => {
    const file = await loadTestFile('sample-cv.pdf');
    const { task_id } = await uploadCV(file);

    const { data } = await supabase
      .from('cv_extraction_tasks')
      .select('*')
      .eq('id', task_id)
      .single();

    expect(data.status).toBe('pending');
  });
});
```

### 8.3 E2E Tests (Playwright)

```typescript
// tests/e2e/cvExtraction.spec.ts
test.describe('CV Upload & Extraction', () => {
  test('complete happy path: upload → extract → review → save', async ({ page }) => {
    // 1. Navigate to profiles page
    await page.goto('/profiles');

    // 2. Click "Create New Profile"
    await page.click('button:text("Create New Profile")');

    // 3. Verify modal appears
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // 4. Click "Upload CV"
    await page.click('button:text("Upload CV")');

    // 5. Upload test file
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample-cv.pdf');
    await page.click('button:text("Upload & Continue")');

    // 6. Wait for extraction (max 30s)
    await expect(page.locator('text=Analyzing')).toBeVisible();
    await expect(page.locator('text=Extraction Complete')).toBeVisible({ timeout: 30000 });

    // 7. Verify data populated
    await expect(page.locator('#full-name')).toHaveValue('John Doe');
    await expect(page.locator('#email')).toHaveValue('john@example.com');

    // 8. Submit profile
    await page.click('button:text("Save Profile")');

    // 9. Verify saved
    await expect(page).toHaveURL('/profiles');
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should handle extraction failure gracefully', async ({ page }) => {
    await page.goto('/profiles');
    await page.click('button:text("Create New Profile")');
    await page.click('button:text("Upload CV")');

    // Upload corrupted PDF
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/corrupted.pdf');
    await page.click('button:text("Upload & Continue")');

    // Should show error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('button:text("Try Again")')).toBeVisible();
    await expect(page.locator('button:text("Enter Manually")')).toBeVisible();
  });
});
```

---

## 9. Risks & Mitigation

### Critical Risk: PDF Text Extraction Complexity

**Problem:** PDF is a visual layout format, not a text format. Extracting structured text is difficult.

**Edge Cases:**
- Image-only PDFs (scanned documents) - no text layer
- Multi-column layouts - text extraction order wrong
- Tables - extracted as unstructured text
- Non-Latin characters - encoding issues
- Password-protected PDFs - cannot extract

**Mitigation:**
```typescript
// Pre-validation before extraction
async function validatePDFQuality(pdfBuffer: ArrayBuffer): Promise<ValidationResult> {
  const pdf = await pdfParse(pdfBuffer);

  // Check 1: Has text layer
  if (pdf.text.length < 100) {
    return {
      valid: false,
      error: 'PDF appears to be image-based. Please upload a text-based PDF or DOCX.'
    };
  }

  // Check 2: Character encoding
  const nonAsciiRatio = (pdf.text.match(/[^\x00-\x7F]/g) || []).length / pdf.text.length;
  if (nonAsciiRatio > 0.5) {
    return {
      valid: false,
      error: 'PDF contains unusual characters. Extraction may not work correctly.'
    };
  }

  return { valid: true };
}
```

**Recommendation:** Start with DOCX support only (easier to parse). Add PDF in Phase 3.4.

---

**Last Updated:** October 6, 2025
**Status:** Architecture approved, implementation deferred
**Next Steps:** Complete Sprint 0 spike if proceeding with build
