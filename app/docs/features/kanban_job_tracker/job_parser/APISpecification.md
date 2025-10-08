# API Specification: Job Parser Edge Function

**Version:** 1.0
**Date:** October 6, 2025
**Status:** Approved
**Related:** TechnicalArchitecture.md, DatabaseSchema.md

---

## Overview

The `parse-job-post` Edge Function provides AI-powered job post extraction from URLs or manual text. It uses Jina AI Reader for URL scraping and Claude Sonnet 4.5 for structured data extraction.

**Base URL:** `https://<project-ref>.supabase.co/functions/v1/parse-job-post`

**Authentication:** Supabase Auth token (automatically included by Supabase client)

---

## Endpoint

### POST /parse-job-post

Extracts structured job data from a URL or manual text input.

**Request Body:**

```typescript
interface ParseJobRequest {
  url?: string           // Job posting URL (e.g., https://jobs.company.com/position)
  text?: string          // Manual job description text
}

// Exactly ONE of url or text must be provided
```

**Response (Success - 200 OK):**

```typescript
interface ParseJobResponse {
  // Extracted fields
  company_name: string                    // Required
  position_title: string                  // Required
  location: string | null                 // e.g., "Bangkok, Thailand" or "Remote"
  salary_range: string | null             // e.g., "80,000 - 120,000 THB/month"
  job_type: 'full-time' | 'contract' | 'remote' | 'hybrid' | null
  job_description_text: string            // Full plaintext description
  posted_date: string | null              // ISO 8601 format

  // Metadata
  confidence: number                      // 0-100 (AI confidence score)
  parsing_source: 'url_jina' | 'manual_paste'
  parsing_model: string                   // e.g., "claude-sonnet-4-20250514"
  raw_content: string                     // Original HTML/markdown
  original_url: string | null             // Input URL (if provided)
}
```

**Response (Error - 400 Bad Request):**

```typescript
interface ParseJobError {
  error: string                           // Human-readable error message
  fallback?: 'manual_paste'               // Suggest fallback to manual paste
  code?: string                           // Error code for programmatic handling
}
```

**Response (Error - 422 Unprocessable Entity):**

```typescript
interface ParseJobValidationError {
  error: string                           // e.g., "Low confidence extraction"
  extracted?: Partial<ParseJobResponse>   // Partial data (user can review/edit)
  code: 'LOW_CONFIDENCE' | 'MISSING_REQUIRED_FIELDS'
}
```

---

## Request Examples

### Example 1: Parse from URL

```typescript
const { data, error } = await supabase.functions.invoke('parse-job-post', {
  body: {
    url: 'https://jobs.airbnb.com/positions/5678'
  }
})

// Response (200 OK):
{
  "company_name": "Airbnb",
  "position_title": "Senior Frontend Engineer",
  "location": "Bangkok, Thailand",
  "salary_range": "80,000 - 120,000 THB/month",
  "job_type": "full-time",
  "job_description_text": "We are seeking a Senior Frontend Engineer...",
  "posted_date": "2025-10-01",
  "confidence": 95,
  "parsing_source": "url_jina",
  "parsing_model": "claude-sonnet-4-20250514",
  "raw_content": "# Senior Frontend Engineer\n\nAirbnb is hiring...",
  "original_url": "https://jobs.airbnb.com/positions/5678"
}
```

### Example 2: Parse from Manual Text

```typescript
const { data, error } = await supabase.functions.invoke('parse-job-post', {
  body: {
    text: `Senior Frontend Engineer at Grab

Location: Bangkok, Thailand
Salary: 100,000 - 150,000 THB/month

We are looking for an experienced frontend engineer...`
  }
})

// Response (200 OK):
{
  "company_name": "Grab",
  "position_title": "Senior Frontend Engineer",
  "location": "Bangkok, Thailand",
  "salary_range": "100,000 - 150,000 THB/month",
  "job_type": "full-time",
  "job_description_text": "We are looking for an experienced frontend engineer...",
  "posted_date": null,
  "confidence": 88,
  "parsing_source": "manual_paste",
  "parsing_model": "claude-sonnet-4-20250514",
  "raw_content": "Senior Frontend Engineer at Grab\n\nLocation...",
  "original_url": null
}
```

### Example 3: URL Fetch Failed (Fallback to Manual Paste)

```typescript
const { data, error } = await supabase.functions.invoke('parse-job-post', {
  body: {
    url: 'https://protected-site.com/job-with-captcha'
  }
})

// Response (400 Bad Request):
{
  "error": "Unable to fetch URL. The site requires authentication or is blocked.",
  "fallback": "manual_paste",
  "code": "FETCH_FAILED"
}

// Frontend should:
// 1. Show error message to user
// 2. Switch input to textarea mode
// 3. Prompt: "Please paste the job description manually"
```

### Example 4: Low Confidence Extraction

```typescript
const { data, error } = await supabase.functions.invoke('parse-job-post', {
  body: {
    text: "Looking for an engineer. Email us at jobs@company.com"
  }
})

// Response (422 Unprocessable Entity):
{
  "error": "Could not extract required fields with confidence. Please review.",
  "code": "LOW_CONFIDENCE",
  "extracted": {
    "company_name": null,
    "position_title": "Engineer",
    "location": null,
    "salary_range": null,
    "job_type": null,
    "job_description_text": "Looking for an engineer...",
    "posted_date": null,
    "confidence": 35
  }
}

// Frontend should:
// 1. Show warning: "Extraction confidence is low"
// 2. Display extracted data with editable fields
// 3. Require user to fill in company_name (required field)
// 4. User confirms → Save to database
```

---

## Error Codes

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `FETCH_FAILED` | 400 | Jina AI unable to access URL (403, 404, timeout, CAPTCHA) | Switch to manual paste |
| `LOW_CONFIDENCE` | 422 | AI confidence < 50 | Review and edit extracted data |
| `MISSING_REQUIRED_FIELDS` | 422 | Company or position not found | Fill in missing fields manually |
| `INVALID_INPUT` | 400 | Neither url nor text provided | Provide url or text |
| `INVALID_URL` | 400 | URL format invalid or blocked (localhost, internal IP) | Check URL format |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests (>10/min) | Wait and retry |
| `AI_API_ERROR` | 500 | Claude API error | Retry after 1 minute |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Contact support |

---

## Frontend Integration

### TypeScript Interface

```typescript
// types/job-parser.ts

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

### Usage Example (JobParserModal.vue)

```typescript
import { supabase } from '@/lib/supabase'
import type { ParseJobRequest, ParseJobResponse, ParseJobError } from '@/types/job-parser'

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  previewData.value = null

  try {
    const body: ParseJobRequest = inputType.value === 'url'
      ? { url: jobUrl.value }
      : { text: jobText.value }

    const { data, error: fnError } = await supabase.functions.invoke<ParseJobResponse>(
      'parse-job-post',
      { body }
    )

    if (fnError) {
      const errorData = fnError as ParseJobError

      if (errorData.code === 'FETCH_FAILED') {
        // Fallback to manual paste
        error.value = errorData.error
        inputType.value = 'paste'
        showFallbackPrompt.value = true
      } else if (errorData.code === 'LOW_CONFIDENCE') {
        // Show preview with warning
        error.value = 'Extraction confidence is low. Please review.'
        previewData.value = errorData.extracted
      } else {
        // Generic error
        error.value = errorData.error || 'Failed to parse job post'
      }
    } else {
      // Success: Show preview
      previewData.value = data
    }

  } catch (err: any) {
    error.value = 'Network error. Please check your connection.'
  } finally {
    loading.value = false
  }
}
```

---

## Edge Function Implementation

### File Structure

```
app/supabase/functions/parse-job-post/
├── index.ts                 # Main handler
├── jina-reader.ts           # Jina AI integration
├── claude-extractor.ts      # Claude Sonnet 4.5 extraction
├── validators.ts            # Input validation
└── types.ts                 # TypeScript interfaces
```

### Main Handler (index.ts)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { fetchJobContent } from './jina-reader.ts'
import { extractStructuredData } from './claude-extractor.ts'
import { validateUrl, validateExtractedData } from './validators.ts'
import type { ParseJobRequest, ParseJobResponse } from './types.ts'

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    })
  }

  try {
    const { url, text }: ParseJobRequest = await req.json()

    // Validate input
    if (!url && !text) {
      return errorResponse('Either url or text must be provided', 'INVALID_INPUT', 400)
    }

    if (url && text) {
      return errorResponse('Provide only url OR text, not both', 'INVALID_INPUT', 400)
    }

    if (url && !validateUrl(url)) {
      return errorResponse('Invalid URL format', 'INVALID_URL', 400)
    }

    // Step 1: Get job content
    let jobContent: string
    let parsingSource: 'url_jina' | 'manual_paste'

    if (url) {
      try {
        jobContent = await fetchJobContent(url)
        parsingSource = 'url_jina'
      } catch (err: any) {
        return errorResponse(
          `Unable to fetch URL. ${err.message}`,
          'FETCH_FAILED',
          400,
          { fallback: 'manual_paste' }
        )
      }
    } else {
      jobContent = text!
      parsingSource = 'manual_paste'
    }

    // Step 2: Extract with Claude
    const extracted = await extractStructuredData(jobContent)

    // Step 3: Validate
    const validation = validateExtractedData(extracted)
    if (!validation.valid) {
      return errorResponse(
        validation.error!,
        validation.code!,
        422,
        { extracted }
      )
    }

    // Step 4: Return success
    const response: ParseJobResponse = {
      ...extracted,
      parsing_source: parsingSource,
      parsing_model: 'claude-sonnet-4-20250514',
      raw_content: jobContent,
      original_url: url || null
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Parse job error:', error)
    return errorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
  }
})

function errorResponse(
  message: string,
  code: string,
  status: number,
  extra?: Record<string, any>
) {
  return new Response(JSON.stringify({
    error: message,
    code,
    ...extra
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### Jina AI Integration (jina-reader.ts)

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
    if (status === 403) {
      throw new Error('Site blocked by CAPTCHA or authentication')
    } else if (status === 404) {
      throw new Error('Job posting not found')
    } else if (status === 429) {
      throw new Error('Rate limit exceeded. Try again in 1 minute.')
    } else {
      throw new Error(`HTTP ${status}: Unable to fetch URL`)
    }
  }

  const markdown = await response.text()

  if (!markdown || markdown.length < 50) {
    throw new Error('Empty or invalid content')
  }

  return markdown
}
```

### Claude Extraction (claude-extractor.ts)

```typescript
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

const SYSTEM_PROMPT = `You are an expert job post analyzer. Extract structured data from job postings.

Return ONLY valid JSON with this exact schema:
{
  "company_name": string (required),
  "position_title": string (required),
  "location": string | null,
  "salary_range": string | null,
  "job_type": "full-time" | "contract" | "remote" | "hybrid" | null,
  "job_description_text": string (required),
  "posted_date": string | null,
  "confidence": number (0-100)
}

Rules:
- If company/position unclear, set confidence < 50
- Remove HTML tags from description
- Preserve bullet points with \n
- For salary: Include currency and period (e.g., "THB/month")
- For location: "City, Country" or "Remote"
- Return null for missing fields (don't guess)`

export async function extractStructuredData(content: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Parse this job post:\n\n${content}`
    }]
  })

  const extracted = JSON.parse(message.content[0].text)
  return extracted
}
```

### Validators (validators.ts)

```typescript
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Only HTTPS
    if (parsed.protocol !== 'https:') return false

    // Block internal IPs (SSRF prevention)
    const hostname = parsed.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) return false
    if (hostname.startsWith('172.16.') || hostname.startsWith('172.31.')) return false

    // Reasonable length
    if (url.length > 2000) return false

    return true
  } catch {
    return false
  }
}

export function validateExtractedData(extracted: any) {
  if (!extracted.company_name || !extracted.position_title) {
    return {
      valid: false,
      error: 'Could not extract required fields (company and position)',
      code: 'MISSING_REQUIRED_FIELDS'
    }
  }

  if (extracted.confidence < 50) {
    return {
      valid: false,
      error: 'Extraction confidence is too low. Please review carefully.',
      code: 'LOW_CONFIDENCE'
    }
  }

  return { valid: true }
}
```

---

## Deployment

### Environment Variables

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Deploy Command

```bash
# Deploy Edge Function
npx supabase functions deploy parse-job-post

# Set environment variables
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Test Locally

```bash
# Start local development
npx supabase functions serve parse-job-post

# Test with curl
curl -X POST http://localhost:54321/functions/v1/parse-job-post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{"url": "https://jobs.airbnb.com/positions/5678"}'
```

---

## Performance & Cost

### Response Times (p95)
- Jina AI fetch: <3s
- Claude extraction: <5s
- Total: <10s

### Cost Per Request
- Jina AI: $0 (free tier)
- Claude Sonnet 4.5: ~$0.014/job
- Total: ~$0.014/job

### Rate Limits
- Supabase: 10 requests/minute per user
- Jina AI: 1M tokens/month (free tier)
- Claude API: No hard limit (pay-as-you-go)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Backend Team | Initial API specification |

---

**Status:** ✅ Ready for Implementation
**Next:** DatabaseSchema.md, FrontendComponents.md
