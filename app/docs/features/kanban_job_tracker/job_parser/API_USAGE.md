# API Usage & Deployment Guide: Job Parser

**Version:** 1.0
**Date:** October 7, 2025
**Audience:** Developers, DevOps Engineers
**Related:** TechnicalArchitecture.md, DATABASE Schema.md

---

## Overview

The Job Parser is implemented as a **Cloudflare Worker** (backend) + **Vue 3 component** (frontend) that integrates:
- **Jina AI Reader** for URL scraping
- **Claude Sonnet 4.5** for AI extraction
- **Supabase PostgreSQL** for data storage

This guide covers deployment, configuration, and API integration.

---

## Architecture Overview

```
┌──────────────────┐
│   Frontend       │
│  (Vue 3 + TS)    │
│  JobParserModal  │
└────────┬─────────┘
         │ HTTP POST
         ▼
┌──────────────────┐
│  Cloudflare      │
│  Worker          │
│  /api/parse-job  │
└────────┬─────────┘
         │
         ├──► Jina AI Reader (URL → Markdown)
         │
         ├──► Claude Sonnet 4.5 (Text → Structured JSON)
         │
         └──► Supabase Database (Save parsed job)
```

---

## Prerequisites

### Required Tools

- **Node.js:** v20.19+ (for Wrangler CLI)
- **Bun:** Latest version (for frontend dev)
- **Wrangler CLI:** `npm install -g wrangler`
- **Supabase CLI:** `npm install -g supabase` (optional, for migrations)
- **Git:** For version control

### Required Accounts

1. **Cloudflare Account**
   - Sign up: https://dash.cloudflare.com/sign-up
   - Workers Plan: Free tier (100,000 requests/day)

2. **Anthropic API Account**
   - Sign up: https://console.anthropic.com
   - Get API key: https://console.anthropic.com/settings/keys
   - Billing: Add payment method (~$5 minimum)

3. **Jina AI Account (Optional but Recommended)**
   - Sign up: https://jina.ai
   - Get free API key: https://jina.ai/reader
   - Free tier: 1M tokens/month, 200 RPM (vs IP-based 20 RPM)

4. **Supabase Project**
   - Already configured at: `ewqqpflajxvqkoawgmek.supabase.co`
   - Service key available in project settings

---

## Initial Setup

### Step 1: Clone Repository

```bash
cd /Users/user/Documents/cari-kerja
git checkout feature/job-parser
```

### Step 2: Install Dependencies

**Frontend:**
```bash
cd app/frontend
bun install
```

**Worker:**
```bash
cd ../workers
bun install
```

### Step 3: Configure Environment Variables

**Frontend (`.env` file):**
```bash
cd app/frontend
cat > .env <<EOF
VITE_SUPABASE_URL=https://ewqqpflajxvqkoawgmek.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_WORKER_URL=https://job-kanban-worker.devkenni-g.workers.dev
JINA_API_KEY=jina_f3e73a1d9218497191a8a84d9d46ef4796852nOkUmRcuxpKm-JKua2vOooq
EOF
```

**Worker (Cloudflare Secrets):**
```bash
cd app/workers

# Set required secrets (interactive prompts)
npx wrangler secret put ANTHROPIC_API_KEY
# Paste your Anthropic API key when prompted

npx wrangler secret put SUPABASE_SERVICE_KEY
# Paste Supabase service role key

npx wrangler secret put JINA_API_KEY
# Paste Jina AI key (or skip if using free tier without key)
```

**Verify secrets:**
```bash
npx wrangler secret list
# Should show: ANTHROPIC_API_KEY, SUPABASE_SERVICE_KEY, JINA_API_KEY
```

---

## Deployment

### Deploy Cloudflare Worker

**Production deployment:**
```bash
cd app/workers
npx wrangler deploy

# Output:
# ✨ Success! Deployed job-kanban-worker to:
# https://job-kanban-worker.devkenni-g.workers.dev
```

**Verify deployment:**
```bash
curl https://job-kanban-worker.devkenni-g.workers.dev/health
# Expected: {"status":"ok","timestamp":"2025-10-07T..."}
```

### Deploy Database Migration

**Apply migration 025 (adds parsing metadata fields):**
```bash
cd app/supabase/migrations

# Check migration file exists
ls -la 025_add_job_parsing_fields.sql

# Apply to production (if using Supabase CLI)
supabase db push --db-url "postgresql://postgres:[password]@db.ewqqpflajxvqkoawgmek.supabase.co:5432/postgres"

# Or apply via Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard/project/ewqqpflajxvqkoawgmek/database/migrations
# 2. Click "New migration"
# 3. Paste contents of 025_add_job_parsing_fields.sql
# 4. Run migration
```

**Verify migration:**
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'jobs'
  AND column_name LIKE 'parsing%';

-- Should return 4 rows:
-- parsing_source | text
-- parsing_confidence | integer
-- parsing_model | text
-- raw_content | text
```

### Deploy Frontend

**Development mode:**
```bash
cd app/frontend
bun run dev
# Serves at http://localhost:5174
```

**Production build:**
```bash
bun run build
# Outputs to dist/

# Deploy to Cloudflare Pages (auto-deploys on git push to main)
git add -A
git commit -m "feat: job parser deployment"
git push origin feature/job-parser

# Or manual deploy:
npx wrangler pages deploy dist/ --project-name=cari-kerja
```

---

## API Specification

### Endpoint: `POST /api/parse-job`

**Base URL:** `https://job-kanban-worker.devkenni-g.workers.dev`

#### Request

**Headers:**
```
Authorization: Bearer <supabase-access-token>
Content-Type: application/json
```

**Body (URL mode):**
```json
{
  "url": "https://jobs.company.com/senior-frontend-engineer"
}
```

**Body (Text mode):**
```json
{
  "text": "Company: Airbnb\nPosition: Senior Frontend Engineer\n\nWe are seeking..."
}
```

**Validation:**
- **Exactly one of** `url` or `text` must be provided (not both)
- **URL:** Must be valid HTTPS/HTTP URL, <2000 chars, not localhost/private IPs
- **Text:** 50-100,000 characters

#### Response

**Success (200 OK):**
```json
{
  "company_name": "Airbnb",
  "position_title": "Senior Frontend Engineer",
  "location": "Bangkok, Thailand",
  "salary_range": "80,000-120,000 THB/month",
  "job_type": "full-time",
  "job_description_text": "Airbnb is seeking a Senior Frontend Engineer...",
  "posted_date": "2025-10-01",
  "confidence": 95,
  "parsing_source": "url_jina",
  "parsing_model": "claude-sonnet-4.5-20250514",
  "raw_content": "# Airbnb\n\n## Senior Frontend Engineer...",
  "original_url": "https://jobs.airbnb.com/positions/12345"
}
```

**Error: Fetch Failed (400 Bad Request):**
```json
{
  "error": "Site blocked by CAPTCHA or authentication",
  "fallback": "manual_paste",
  "code": "FETCH_FAILED"
}
```

**Error: Low Confidence (422 Unprocessable Entity):**
```json
{
  "error": "Extraction confidence is too low. Please review carefully.",
  "code": "LOW_CONFIDENCE",
  "extracted": {
    "company_name": "Unknown Recruiter",
    "position_title": "Engineer",
    "confidence": 45,
    ...
  }
}
```

**Error: Internal Server Error (500):**
```json
{
  "error": "An error occurred processing your request.",
  "code": "INTERNAL_ERROR",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

## Configuration

### Environment Variables

**Worker (`wrangler.toml` - do NOT commit secrets):**
```toml
name = "job-kanban-worker"
main = "src/index.ts"
compatibility_date = "2025-01-01"

# Secrets (set via wrangler secret put):
# - ANTHROPIC_API_KEY
# - SUPABASE_SERVICE_KEY
# - JINA_API_KEY (optional)
```

**Frontend (`.env` - do NOT commit):**
```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_WORKER_URL=https://job-kanban-worker.[username].workers.dev
```

### Content Security Policy (CSP)

**Add Worker domain to CSP whitelist:**

**File: `app/frontend/vite.config.ts`** (development)
```typescript
"connect-src 'self' ws://localhost:* wss://localhost:* https://*.supabase.co wss://*.supabase.co https://*.workers.dev",
```

**File: `app/frontend/public/_headers`** (production)
```
Content-Security-Policy: ... connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.workers.dev; ...
```

### CORS Configuration

**Worker CORS (already configured in `app/workers/src/index.ts`):**
```typescript
app.use('/*', cors({
  origin: ['https://cari-kerja.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400,
  credentials: true,
}));
```

**To allow additional origins:**
```typescript
origin: ['https://cari-kerja.pages.dev', 'http://localhost:5174'],
```

---

## Cost Analysis

### API Costs (Monthly)

**Assumptions:** 100 jobs parsed/month (average personal use)

| Service | Pricing | Monthly Cost |
|---------|---------|--------------|
| **Jina AI Reader** | Free (1M tokens/month) | $0.00 |
| **Claude Sonnet 4.5** | $3/1M input + $15/1M output | ~$1.40 |
| **Cloudflare Workers** | Free (100k req/day) | $0.00 |
| **Supabase Database** | Free (500MB) | $0.00 |
| **Total** | | **$1.40/month** |

**Cost per job:** ~$0.014 (1.4 cents)

**Detailed Claude calculation:**
- **Input:** ~5,000 tokens/job (average job description)
- **Output:** ~500 tokens/job (structured JSON)
- **Cost:** (5000 × $3/1M) + (500 × $15/1M) = $0.015 + $0.0075 ≈ $0.014/job

**At scale (1,000 jobs/month):** ~$14/month

---

## Monitoring & Debugging

### View Worker Logs

**Real-time logs (CLI):**
```bash
cd app/workers
npx wrangler tail

# Filter for parse-job requests:
npx wrangler tail --grep="parse-job"
```

**Dashboard logs:**
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → job-kanban-worker
3. Click "Logs" tab
4. Real-time stream shows all requests

### Analytics

**Worker analytics:**
1. Cloudflare dashboard → job-kanban-worker
2. "Metrics" tab shows:
   - Requests/minute
   - CPU time usage
   - Success/error rates

**Database analytics:**
```sql
-- Success rate by parsing source
SELECT
  parsing_source,
  COUNT(*) as total_jobs,
  AVG(parsing_confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE parsing_confidence >= 80) as high_confidence
FROM jobs
WHERE parsing_source IS NOT NULL
GROUP BY parsing_source;

-- Recent parsing failures (low confidence)
SELECT company_name, position_title, parsing_confidence, created_at
FROM jobs
WHERE parsing_confidence < 50
ORDER BY created_at DESC
LIMIT 20;
```

### Health Checks

**Worker health endpoint:**
```bash
curl https://job-kanban-worker.devkenni-g.workers.dev/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Database health:**
```bash
# Check Supabase status
curl https://ewqqpflajxvqkoawgmek.supabase.co/rest/v1/jobs?limit=1 \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6..."

# Expected: 200 OK with JSON array
```

---

## Advanced Configuration

### Switch AI Models

**Change from Sonnet 4.5 to Haiku (cheaper, faster, less accurate):**

**File: `app/workers/src/tasks/parse-job-post.ts`**
```typescript
// Line 44: Change model
const PARSING_MODEL = 'claude-haiku-4-20250514' // Was: claude-sonnet-4.5-20250514

// Cost comparison:
// Sonnet 4.5: $3/$15 per 1M tokens → $0.014/job
// Haiku 4: $0.25/$1.25 per 1M tokens → $0.001/job (14x cheaper)
```

**Redeploy:**
```bash
npx wrangler deploy
```

### Customize System Prompt

**Improve extraction for specific job types:**

**File: `app/workers/src/tasks/parse-job-post.ts`** (lines 52-146)
```typescript
const SYSTEM_PROMPT = `You are a specialized job posting data extractor...

// Add custom rules:
## Special Case: Bangkok Jobs
- If location mentions "Thailand" without city, assume "Bangkok, Thailand"
- Convert Thai Baht (฿) to "THB" in salary_range
- Recognize common Bangkok districts: Sukhumvit, Silom, Sathorn

...`
```

### Add Retry Logic

**For transient failures:**

**File: `app/frontend/src/components/JobParserModal.vue`**
```typescript
const handleSubmit = async () => {
  const maxRetries = 3
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      const response = await fetch(`${worker.url}/api/parse-job`, {...})
      if (response.ok) {
        previewData.value = await response.json()
        return
      }
    } catch (err) {
      attempt++
      if (attempt >= maxRetries) {
        error.value = 'Failed after 3 retries. Please try again.'
      }
      await new Promise(r => setTimeout(r, 1000 * attempt)) // Exponential backoff
    }
  }
}
```

### Increase Timeout

**Default: 10s (Jina AI), 30s (total Worker)**

**File: `app/workers/src/tasks/parse-job-post.ts`**
```typescript
// Line 176: Increase Jina timeout
const response = await fetch(jinaUrl, {
  headers,
  signal: AbortSignal.timeout(30000) // Was: 10000 (10s) → Now: 30s
})
```

**Note:** Cloudflare Workers have a hard 60s CPU time limit.

---

## Security Best Practices

### API Key Rotation

**Rotate Anthropic API key every 90 days:**
```bash
# 1. Generate new key in Anthropic console
# 2. Update Worker secret
npx wrangler secret put ANTHROPIC_API_KEY
# Paste new key

# 3. Verify deployment
curl https://job-kanban-worker.devkenni-g.workers.dev/health
```

### Rate Limiting

**Cloudflare Workers doesn't have built-in rate limiting. Implement manually:**

**File: `app/workers/src/index.ts`**
```typescript
// Add rate limiting middleware
const rateLimiter = new Map<string, number[]>()

app.use('/api/*', async (c, next) => {
  const userId = c.get('user')?.id
  if (!userId) return next()

  const now = Date.now()
  const userRequests = rateLimiter.get(userId) || []
  const recentRequests = userRequests.filter(t => now - t < 60000) // Last minute

  if (recentRequests.length >= 10) { // Max 10 req/min
    return c.json({ error: 'Rate limit exceeded. Try again in 1 minute.' }, 429)
  }

  rateLimiter.set(userId, [...recentRequests, now])
  return next()
})
```

### Input Validation

**Already implemented in `parse-job-post.ts`:**
- URL validation (SSRF protection, private IP blocking)
- Text length limits (50-100,000 chars)
- Content sanitization (escape special chars before sending to Claude)

---

## Troubleshooting Deployment

### Error: "Worker not found"

**Cause:** Worker not deployed or wrong project name

**Fix:**
```bash
npx wrangler whoami # Verify logged in
npx wrangler deploy # Redeploy
```

### Error: "Secret not found: ANTHROPIC_API_KEY"

**Cause:** Secrets not set

**Fix:**
```bash
npx wrangler secret put ANTHROPIC_API_KEY
# Paste key when prompted

# Verify:
npx wrangler secret list
```

### Error: "Failed to publish Worker"

**Cause:** Syntax error in worker code

**Fix:**
```bash
# Build locally first
cd app/workers
bun run build

# Check for TypeScript errors
npx tsc --noEmit

# Fix errors, then deploy
npx wrangler deploy
```

---

## Testing

### Local Testing

**Run Worker locally:**
```bash
cd app/workers
npx wrangler dev

# Worker runs at: http://localhost:8787
# Test health: curl http://localhost:8787/health
```

**Run Frontend locally:**
```bash
cd app/frontend
bun run dev

# App runs at: http://localhost:5174
# Update .env to point to local worker:
# VITE_WORKER_URL=http://localhost:8787
```

### Integration Testing

**Test full flow (requires deployed Worker):**
```bash
# 1. Get auth token from Supabase
TOKEN="eyJhbGci..." # Your Supabase session token

# 2. Test URL parsing
curl -X POST https://job-kanban-worker.devkenni-g.workers.dev/api/parse-job \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://jobs.lever.co/shopify/senior-frontend-engineer"}'

# Expected: 200 OK with parsed job JSON

# 3. Test text parsing
curl -X POST https://job-kanban-worker.devkenni-g.workers.dev/api/parse-job \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Company: TestCo\nPosition: Software Engineer\n\nWe are hiring..."}'

# Expected: 200 OK with parsed job JSON
```

---

## Maintenance

### Updating Dependencies

**Worker dependencies:**
```bash
cd app/workers
bun update
npx wrangler deploy
```

**Frontend dependencies:**
```bash
cd app/frontend
bun update
bun run build
# Deploy to Cloudflare Pages
```

### Database Maintenance

**Re-parsing existing jobs (when prompt improves):**
```sql
-- Future feature: Re-parse jobs using cached raw_content
UPDATE jobs
SET
  parsing_confidence = (SELECT new_confidence FROM re_parse(raw_content)),
  parsing_model = 'claude-sonnet-4.5-20250514-v2'
WHERE parsing_source IS NOT NULL
  AND parsing_confidence < 80;
```

---

## FAQ

**Q: Can I self-host the Worker instead of Cloudflare?**
**A:** Yes, convert to Node.js/Express server. Replace `Deno` APIs with Node equivalents.

**Q: How do I add support for non-English jobs?**
**A:** Update `SYSTEM_PROMPT` in `parse-job-post.ts` with language-specific instructions.

**Q: Can I use OpenAI instead of Claude?**
**A:** Yes, replace Anthropic SDK with OpenAI SDK, adjust API calls and prompts.

**Q: How do I monitor API costs?**
**A:** Check Anthropic console: https://console.anthropic.com/settings/usage

---

**Last Updated:** October 7, 2025
**Version:** 1.0
**Maintainer:** devkenni.g@gmail.com
