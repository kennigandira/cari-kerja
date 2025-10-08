# Technical Architecture: AI-Powered Job Parser

**Version:** 1.0
**Date:** October 6, 2025
**Author:** Tech Lead & Architect
**Status:** Approved
**Related:** PRD.md, APISpecification.md, DatabaseSchema.md

---

## Executive Summary

The AI-Powered Job Parser uses a **hybrid scraping + AI extraction** architecture to automate job post data entry. The system leverages **Jina AI Reader** (free, handles JavaScript) for URL fetching and **Claude Sonnet 4.5** (superior accuracy) for structured extraction, with **manual paste as a first-class fallback** to achieve 95%+ success rate.

**Key Architectural Decisions:**
- **AD-001:** Use Jina AI Reader over direct HTTP fetch (handles JS-heavy sites)
- **AD-002:** Use Claude Sonnet 4.5 over Haiku (accuracy > cost for personal use)
- **AD-003:** Manual paste as first-class feature, not afterthought (reliability)
- **AD-004:** Preview before save (trust but verify AI extraction)
- **AD-005:** Store raw content for re-parsing (enable continuous improvement)

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 1. Click "Add Job Target" button on KanbanBoard.vue          │  │
│  │ 2. JobParserModal.vue opens                                  │  │
│  │ 3. Select input type: [URL] or [Paste Description]           │  │
│  │ 4. Enter data + click "Parse Job Post"                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vue 3 + TypeScript)                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ JobParserModal.vue                                           │  │
│  │ ├─ Dropdown: inputType = 'url' | 'paste'                    │  │
│  │ ├─ Conditional Input: <input type="url"> or <textarea>      │  │
│  │ ├─ Submit Handler: Call supabase.functions.invoke()         │  │
│  │ ├─ Loading State: "Analyzing job post..."                   │  │
│  │ └─ Preview: Show parsed data → Confirm/Edit buttons         │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ supabase.functions.invoke('parse-job-post', {url?, text?})
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTION (Deno Runtime)                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ parse-job-post/index.ts                                      │  │
│  │                                                               │  │
│  │ Step 1: Get Job Content                                      │  │
│  │   if (url):                                                  │  │
│  │     ├─ Fetch via Jina AI Reader                             │  │
│  │     │  GET https://r.jina.ai/{url}                          │  │
│  │     │  Headers: Accept: text/plain                          │  │
│  │     └─ Returns: Clean markdown (no ads, nav, footer)        │  │
│  │   else:                                                      │  │
│  │     └─ Use text directly                                    │  │
│  │                                                               │  │
│  │ Step 2: Extract Structured Data with Claude Sonnet 4.5       │  │
│  │   ├─ Model: claude-sonnet-4-20250514                        │  │
│  │   ├─ System Prompt: Extract job info as JSON                │  │
│  │   ├─ Input: Job content (markdown/text)                     │  │
│  │   └─ Output: {company, position, description, salary, ...}  │  │
│  │                                                               │  │
│  │ Step 3: Validate & Return                                    │  │
│  │   ├─ Require: company_name + position_title                 │  │
│  │   ├─ Require: confidence ≥ 50                               │  │
│  │   └─ Return: JSON with parsing metadata                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP 200 {parsed job data}
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND: PREVIEW & CONFIRM                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Show parsed data:                                            │  │
│  │   ✅ Company: Airbnb                                         │  │
│  │   ✅ Position: Senior Frontend Engineer                      │  │
│  │   📍 Location: Bangkok, Thailand                             │  │
│  │   💰 Salary: 80,000 - 120,000 THB/month                     │  │
│  │   🎯 Confidence: 92%                                         │  │
│  │                                                               │  │
│  │ Actions:                                                     │  │
│  │   [Edit] → Allow field editing                              │  │
│  │   [Confirm & Add to Board] → Insert into database           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ supabase.from('jobs').insert({...})
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ jobs table                                                   │  │
│  │ ├─ id (uuid)                                                 │  │
│  │ ├─ company_name (text) ← Extracted                          │  │
│  │ ├─ position_title (text) ← Extracted                        │  │
│  │ ├─ job_description_text (text) ← Extracted                  │  │
│  │ ├─ location (text) ← Extracted                              │  │
│  │ ├─ salary_range (text) ← Extracted                          │  │
│  │ ├─ original_url (text) ← User input                         │  │
│  │ ├─ parsing_source (text) ← 'url_jina' | 'manual_paste'     │  │
│  │ ├─ parsing_confidence (int) ← 0-100                         │  │
│  │ ├─ parsing_model (text) ← 'claude-sonnet-4-20250514'       │  │
│  │ └─ raw_content (text) ← Original markdown/text             │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Auto-trigger (via kanbanStore.syncJobsToCards())
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    KANBAN CARD CREATION                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ kanban_cards table                                           │  │
│  │ ├─ company_name: Airbnb                                      │  │
│  │ ├─ job_title: Senior Frontend Engineer                       │  │
│  │ ├─ job_id: <uuid> (links to jobs table)                     │  │
│  │ ├─ column_id: "Interested" column                           │  │
│  │ └─ position: Auto-calculated (end of column)                │  │
│  │                                                               │  │
│  │ Result: New card appears in "Interested" column              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Components

**JobParserModal.vue**
```typescript
<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  success: [jobId: string]
}>()

// State
const inputType = ref<'url' | 'paste'>('url')
const jobUrl = ref('')
const jobText = ref('')
const loading = ref(false)
const error = ref('')
const previewData = ref<any>(null)

// Call Edge Function
const handleSubmit = async () => {
  const { data, error } = await supabase.functions.invoke('parse-job-post', {
    body: {
      url: inputType.value === 'url' ? jobUrl.value : null,
      text: inputType.value === 'paste' ? jobText.value : null
    }
  })

  if (error) {
    // Handle fallback: Show "paste description instead"
  } else {
    previewData.value = data // Show preview
  }
}

// Insert into database
const handleConfirm = async () => {
  const { data: job } = await supabase.from('jobs').insert({
    company_name: previewData.value.company_name,
    position_title: previewData.value.position_title,
    // ... other fields
  }).select().single()

  emit('success', job.id)
  emit('close')
}
</script>
```

**Integration in KanbanBoard.vue**
```vue
<template>
  <div class="kanban-board">
    <header>
      <button @click="isParserModalOpen = true">
        + Add Job Target
      </button>
    </header>

    <!-- Kanban columns -->

    <JobParserModal
      :is-open="isParserModalOpen"
      @close="isParserModalOpen = false"
      @success="handleJobAdded"
    />
  </div>
</template>
```

---

### 2. Backend Architecture (Supabase Edge Function)

**File:** `app/supabase/functions/parse-job-post/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

serve(async (req) => {
  try {
    const { url, text } = await req.json()

    // Step 1: Get job content
    let jobContent: string
    let parsingSource: string

    if (url) {
      // Use Jina AI Reader
      const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`
      const jinaResponse = await fetch(jinaUrl, {
        headers: { 'Accept': 'text/plain' }
      })

      if (!jinaResponse.ok) {
        return new Response(JSON.stringify({
          error: 'Unable to fetch URL',
          fallback: 'manual_paste'
        }), { status: 400 })
      }

      jobContent = await jinaResponse.text()
      parsingSource = 'url_jina'
    } else {
      jobContent = text
      parsingSource = 'manual_paste'
    }

    // Step 2: Extract with Claude Sonnet 4.5
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Parse this job post:\n\n${jobContent}`
      }]
    })

    const extracted = JSON.parse(message.content[0].text)

    // Step 3: Validate
    if (!extracted.company_name || !extracted.position_title) {
      return new Response(JSON.stringify({
        error: 'Could not extract required fields',
        extracted
      }), { status: 422 })
    }

    if (extracted.confidence < 50) {
      return new Response(JSON.stringify({
        error: 'Low confidence extraction',
        extracted
      }), { status: 422 })
    }

    // Step 4: Return
    return new Response(JSON.stringify({
      ...extracted,
      parsing_source: parsingSource,
      parsing_model: 'claude-sonnet-4-20250514',
      raw_content: jobContent,
      original_url: url || null
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), { status: 500 })
  }
})
```

**System Prompt:**
```typescript
const EXTRACTION_SYSTEM_PROMPT = `You are an expert job post analyzer. Extract structured data from job postings.

Return ONLY valid JSON with this exact schema:
{
  "company_name": string (required - company hiring for this position),
  "position_title": string (required - exact job title),
  "location": string | null (city, country, or "Remote"),
  "salary_range": string | null (e.g., "80,000 - 120,000 THB/month"),
  "job_type": "full-time" | "contract" | "remote" | "hybrid" | null,
  "job_description_text": string (required - full clean plaintext description),
  "posted_date": string | null (ISO 8601 format),
  "confidence": number (0-100, your confidence in the extraction)
}

Rules:
1. If company or position not clearly stated, set confidence < 50
2. Remove all HTML tags from description
3. Preserve bullet points and formatting in description (use \n for newlines)
4. For salary_range: Include currency and time period (e.g., "per month", "per year")
5. For location: Normalize to "City, Country" or "Remote" or "Hybrid"
6. For job_type: Infer from keywords like "full-time", "contract", "remote work"
7. For confidence:
   - 90-100: All fields clearly stated
   - 70-89: Most fields found, some ambiguity
   - 50-69: Missing optional fields or unclear phrasing
   - <50: Company or position not clearly identified
8. Return null for missing fields (don't guess or make up data)

Example output:
{
  "company_name": "Airbnb",
  "position_title": "Senior Frontend Engineer",
  "location": "Bangkok, Thailand",
  "salary_range": "80,000 - 120,000 THB/month",
  "job_type": "full-time",
  "job_description_text": "We are seeking a Senior Frontend Engineer to join our team in Bangkok...\n\nResponsibilities:\n- Build scalable React applications\n- Lead frontend architecture decisions\n...",
  "posted_date": "2025-10-01",
  "confidence": 95
}`
```

---

## Architectural Decisions

### AD-001: Use Jina AI Reader over Direct HTTP Fetch

**Context:**
Need to scrape job URLs from various sources (LinkedIn, Indeed, company career pages). Many sites use JavaScript rendering or anti-bot protection.

**Options:**
1. Direct HTTP fetch (simple, free, fast)
2. Jina AI Reader API (handles JS, returns clean markdown, free tier)
3. Headless browser (Puppeteer/Playwright - complex, expensive)

**Decision:** Use Jina AI Reader

**Rationale:**
- ✅ Handles JavaScript-heavy sites (LinkedIn, Greenhouse, Lever)
- ✅ Returns clean markdown (removes ads, navigation, footers)
- ✅ Free tier: 1M tokens/month (~20k job posts)
- ✅ No infrastructure needed (vs headless browser)
- ✅ Fast (2-3s vs 10-15s for browser automation)
- ✅ Reliable (maintained by Jina AI team)

**Cost:** $0 (free tier sufficient for 100-200 jobs/month)

**Alternatives Rejected:**
- Direct fetch: Only works for ~60% of sites (JS walls, CAPTCHA)
- Headless browser: Overkill, slow, expensive infrastructure

---

### AD-002: Use Claude Sonnet 4.5 over Haiku

**Context:**
Need AI to extract structured data from job posts. Haiku is cheaper but less accurate.

**Options:**
1. Claude Haiku ($0.25/$1.25 per 1M tokens) - Fast, cheap
2. Claude Sonnet 4.5 ($3/$15 per 1M tokens) - Accurate, slower
3. GPT-4 Turbo (comparable cost, different capabilities)

**Decision:** Use Claude Sonnet 4.5

**Rationale:**
- ✅ Superior accuracy for Bangkok/Thailand job posts (mixed English/Thai)
- ✅ Better at nuanced extraction (ambiguous titles, complex salary ranges)
- ✅ Cost difference negligible: $1.40/month (Sonnet) vs $0.10/month (Haiku) for 100 jobs
- ✅ Consistency with /cv_letsgo quality (already uses Claude for job analysis)
- ✅ Better confidence scoring (fewer false positives)

**Cost Analysis (100 jobs/month):**
- Average job post: 2k input tokens, 500 output tokens
- Haiku: (2k × $0.25/1M) + (500 × $1.25/1M) = $0.001/job → $0.10/month
- Sonnet 4.5: (2k × $3/1M) + (500 × $15/1M) = $0.014/job → $1.40/month
- **Difference: $1.30/month** (insignificant vs data quality)

**Alternatives Rejected:**
- Haiku: Too many errors on edge cases (ambiguous job posts)
- GPT-4: Comparable cost, but Claude API already integrated

---

### AD-003: Manual Paste as First-Class Feature

**Context:**
Some job URLs will be inaccessible (CAPTCHA, authentication walls, 403/404 errors).

**Options:**
1. URL-only (rely on Jina AI 100%)
2. Manual paste as "emergency fallback" (hidden unless URL fails)
3. Manual paste as first-class option (equal prominence in UI)

**Decision:** Manual paste as first-class feature

**Rationale:**
- ✅ 10-20% of URLs will fail scraping (CAPTCHA, auth walls, regional blocks)
- ✅ Users need confidence that they can ALWAYS add jobs
- ✅ Prevents frustration ("scraping failed, now what?")
- ✅ Some users prefer paste (already have description in clipboard)
- ✅ Enables 95%+ success rate (vs 80-85% with URL-only)

**UI Decision:**
- Dropdown with two options (not radio buttons)
- Default: "Paste job URL" (most common)
- Option 2: "Copy & paste description" (equally discoverable)

**Alternatives Rejected:**
- URL-only: Too many failures, poor UX
- Hidden fallback: Users don't discover it, leads to support issues

---

### AD-004: Preview Before Save (Trust but Verify)

**Context:**
AI extraction can have errors (wrong company, hallucinated salary). Need to balance automation with accuracy.

**Options:**
1. Auto-save (fully automated, no preview)
2. Preview with option to skip (power users can auto-save)
3. Always preview (mandatory review)

**Decision:** Always preview with Edit/Confirm buttons

**Rationale:**
- ✅ Jobs are created once but used dozens of times (CV tailoring, match analysis)
- ✅ Bad data is worse than slow data (wrong company = wasted effort)
- ✅ Preview takes 3-5 seconds (small cost for data accuracy)
- ✅ Builds user trust in AI system
- ✅ Allows users to catch errors (e.g., "Director of Engineering" vs "Software Engineer")

**Preview UI:**
```
✅ Found: "Senior Frontend Engineer" at "Airbnb"
📍 Location: Bangkok, Thailand
💰 Salary: 80,000 - 120,000 THB/month
🎯 Confidence: 92%

[Edit] [Confirm & Add to Board]
```

**Alternatives Rejected:**
- Auto-save: Too risky, users lose trust after first error
- Optional preview: Power users will skip, then complain about bad data

---

### AD-005: Store Raw Content for Re-Parsing

**Context:**
AI prompts improve over time. Need ability to re-parse jobs without re-fetching URLs.

**Options:**
1. Store only extracted JSON (save storage space)
2. Store raw HTML/markdown (enable re-parsing)
3. Store both (redundant but safe)

**Decision:** Store raw_content in database

**Rationale:**
- ✅ Enables continuous improvement (update prompt → re-parse all jobs)
- ✅ Storage cost negligible (2-5KB per job × 100 jobs = 500KB)
- ✅ Useful for debugging (compare raw → extracted to find prompt issues)
- ✅ Future use cases: Summarization, skills extraction, company research

**Schema:**
```sql
ALTER TABLE jobs ADD COLUMN raw_content TEXT;
```

**Cost:**
- 100 jobs × 3KB average = 300KB
- Supabase storage: Free tier 500MB (negligible impact)

**Alternatives Rejected:**
- JSON-only: Can't re-parse without re-fetching URL
- External storage (S3): Overkill, adds complexity

---

## Data Flow

### Successful URL Parsing

```
User Input: https://jobs.airbnb.com/positions/12345
    ↓
Frontend: JobParserModal.vue
    ↓ supabase.functions.invoke('parse-job-post', {url: ...})
    ↓
Edge Function: parse-job-post
    ↓
Jina AI Reader: GET https://r.jina.ai/https://jobs.airbnb.com/positions/12345
    ↓ Returns: Clean markdown
    ↓
Claude Sonnet 4.5: Extract structured JSON
    ↓ Returns: {company: "Airbnb", position: "Senior Frontend Engineer", confidence: 95, ...}
    ↓
Edge Function: Validate (company + position required, confidence ≥ 50)
    ↓ HTTP 200 {parsed job data}
    ↓
Frontend: Show preview UI
    ↓ User clicks "Confirm"
    ↓
Database: INSERT INTO jobs (company_name, position_title, ...)
    ↓
Kanban Store: syncJobsToCards()
    ↓
Database: INSERT INTO kanban_cards (company_name, job_title, job_id, ...)
    ↓
UI: New card appears in "Interested" column
```

### Failed URL Scraping (Fallback)

```
User Input: https://protected-site.com/job
    ↓
Edge Function: Jina AI Reader request
    ↓
Jina AI: HTTP 403 Forbidden (CAPTCHA wall)
    ↓
Edge Function: Return {error: "Unable to fetch URL", fallback: "manual_paste"}
    ↓
Frontend: Show error + switch to textarea
    ↓ "Unable to access URL. Please paste job description instead."
    ↓
User: Pastes job description manually
    ↓
Frontend: Re-submit with {text: "..."}
    ↓
Edge Function: Skip Jina AI, go directly to Claude
    ↓
Claude Sonnet 4.5: Extract from pasted text
    ↓
[Continue same flow as successful parsing]
```

### Low Confidence Extraction

```
Edge Function: Claude returns {company: "???", position: "Engineer", confidence: 35}
    ↓
Edge Function: Validate (confidence < 50)
    ↓ HTTP 422 {error: "Low confidence", extracted: {...}}
    ↓
Frontend: Show warning UI
    ↓ "⚠️ Extraction confidence is low. Please review carefully."
    ↓ Display editable fields (company*, position*)
    ↓
User: Edits company to "Acme Corp"
    ↓ User clicks "Confirm"
    ↓
Database: INSERT with user-corrected data
```

---

## Technology Stack

### Frontend
- **Framework:** Vue 3.5.22 (Composition API)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.x
- **HTTP Client:** Supabase JS Client (built-in fetch)
- **State:** Component-local ref() (no store needed for modal)

### Backend
- **Runtime:** Deno (Supabase Edge Functions)
- **AI SDK:** @anthropic-ai/sdk 0.20.0
- **HTTP:** Deno std/http
- **Scraping:** Jina AI Reader API (external, free)

### Database
- **Engine:** PostgreSQL 15 (Supabase)
- **New Columns:** parsing_source, parsing_confidence, parsing_model, raw_content
- **Existing Columns:** company_name, position_title, job_description_text, location, salary_range

### External APIs
- **Jina AI Reader:** https://r.jina.ai/{url} (Free tier, 1M tokens/month)
- **Claude API:** claude-sonnet-4-20250514 ($3/$15 per 1M tokens)

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| URL fetch (Jina AI) | <3s (p95) | Edge Function logs |
| AI extraction (Claude) | <5s (p95) | Edge Function logs |
| Total end-to-end | <10s (p95) | Frontend timing |
| Preview rendering | <200ms | Chrome DevTools |
| Database insert | <500ms | Supabase logs |

---

## Security Considerations

### URL Validation
```typescript
function isValidJobUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Only allow HTTPS
    if (parsed.protocol !== 'https:') return false

    // Block internal IPs (prevent SSRF)
    const hostname = parsed.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) return false

    // Must be reasonable length
    if (url.length > 2000) return false

    return true
  } catch {
    return false
  }
}
```

### Input Sanitization
```typescript
function sanitizeExtractedText(text: string): string {
  // Remove potential XSS from job descriptions
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .trim()
}
```

### Rate Limiting
```typescript
// Supabase Edge Function: Max 10 requests/minute per user
// Implemented via Supabase built-in rate limiting
```

---

## Error Handling Strategy

### Frontend Errors
```typescript
try {
  const { data, error } = await supabase.functions.invoke('parse-job-post', {...})

  if (error) {
    if (error.message.includes('Unable to fetch URL')) {
      // Show fallback: "Please paste description instead"
      inputType.value = 'paste'
      showError('Unable to access URL. Please paste job description.')
    } else if (error.message.includes('Low confidence')) {
      // Show preview with warning
      showWarning('Extraction confidence is low. Please review.')
      previewData.value = error.extracted
    } else {
      // Generic error
      showError('Failed to parse job. Please try again.')
    }
  }
} catch (err) {
  showError('Network error. Please check connection.')
}
```

### Edge Function Errors
```typescript
// All errors return JSON with descriptive message
try {
  // ... processing
} catch (error) {
  return new Response(JSON.stringify({
    error: error.message,
    code: 'PARSING_FAILED'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

---

## Monitoring & Observability

### Metrics to Track
```typescript
// Log to Supabase Edge Function logs
console.log(JSON.stringify({
  event: 'job_parse_complete',
  parsing_source: 'url_jina' | 'manual_paste',
  confidence: 92,
  duration_ms: 4500,
  model: 'claude-sonnet-4-20250514',
  success: true
}))
```

### Dashboard Metrics
- Parse success rate (daily)
- Average confidence score
- Jina AI failure rate
- Manual paste usage rate
- Average parsing time (p50, p95, p99)
- Cost per parse (track tokens used)

---

## Cost Analysis

### Monthly Cost Projection (100 jobs)

**Jina AI Reader:**
- Cost: $0 (free tier, 1M tokens/month)
- Usage: ~100 requests/month
- Well within free tier

**Claude Sonnet 4.5:**
- Input: 2k tokens/job × 100 jobs = 200k tokens
- Output: 500 tokens/job × 100 jobs = 50k tokens
- Cost: (200k × $3/1M) + (50k × $15/1M) = $0.60 + $0.75 = **$1.35/month**

**Supabase:**
- Edge Function invocations: 100 calls/month (free tier: 500k/month)
- Database storage: 100 jobs × 3KB = 300KB (free tier: 500MB)
- Cost: $0

**Total Monthly Cost: ~$1.40**

**Cost per job: ~$0.014 (1.4 cents)**

---

## Scalability Considerations

### Current Scale
- 1 user
- ~100 jobs/month
- $1.40/month

### Future Scale (If Productized)
- 100 users
- ~10,000 jobs/month
- $140/month

**Optimization Strategies:**
1. Cache frequently parsed URLs (e.g., "Senior Frontend at Google" parsed by multiple users)
2. Batch API requests (parse 10 jobs at once)
3. Use Haiku for low-confidence jobs (cheaper, then upgrade to Sonnet if <70% confidence)
4. Implement rate limiting per user (max 50 jobs/month on free tier)

---

## Future Enhancements

### Phase 2 (Not in MVP)
- **Job description summarization** (Claude Sonnet 4.5 → TL;DR)
- **Skills gap analysis** (compare job requirements vs master profile)
- **Salary normalization** (convert USD/THB/EUR to common currency)
- **Company research** (auto-fetch Glassdoor reviews, LinkedIn info)

### Phase 3 (Post-MVP)
- **Browser extension** (one-click save from LinkedIn/Indeed)
- **Email integration** (parse job alerts from Gmail)
- **Bulk import** (CSV upload, LinkedIn connection scraping)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Tech Lead | Initial architecture document |

---

**Status:** ✅ Approved - Ready for Implementation
**Next Review:** October 13, 2025 (post-MVP)
