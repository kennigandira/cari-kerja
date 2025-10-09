# 🎯 Cari Kerja - Job Application Tracker

A comprehensive job application tracking system with AI-powered job parsing and intelligent kanban board management.

## ✨ Features

- **🔍 Smart Job Parser**: Parse jobs from URLs (LinkedIn, Indeed, etc.) or manual paste
- **🎨 Kanban Board**: Drag-and-drop interface across 7 workflow stages
- **🤖 AI-Powered**: Claude Sonnet 4.5 for job analysis and extraction
- **🔐 Enterprise Security**: JWT auth, rate limiting, SSRF/XSS protection
- **⚡ Real-time Updates**: Live sync using Supabase Realtime
- **📱 Responsive**: Works on desktop and mobile

## 🏗️ Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite + Pinia
- **Backend**: Cloudflare Workers + Hono
- **Database**: Supabase (PostgreSQL + Realtime)
- **AI**: Claude Sonnet 4.5 via Cloudflare AI Gateway
- **Auth**: Supabase Auth with local JWT verification

## 📁 Project Structure

```
app/
├── frontend/          # Vue 3 SPA with Tailwind CSS
├── workers/           # Cloudflare Workers API
├── supabase/          # Database migrations & RLS policies
└── shared/            # Shared TypeScript types (if any)
```

## ⚡ Quick Start (15 minutes)

### Prerequisites

- [Bun](https://bun.sh/) installed (`curl -fsSL https://bun.sh/install | bash`)
- [Supabase](https://supabase.com/) account (free tier works)
- [Cloudflare](https://workers.cloudflare.com/) account (free tier works)
- [Anthropic API](https://console.anthropic.com/) key
- [Jina AI](https://jina.ai/reader) key (optional, for better rate limits)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd cari-kerja/app

# Install dependencies for all services
cd frontend && bun install && cd ..
cd workers && bun install && cd ..
```

### 2. Supabase Setup

1. **Create project**: Go to [supabase.com](https://supabase.com) → New Project
2. **Get credentials**: Project Settings > API
   - Save `URL`
   - Save `anon public` key
   - Save `service_role` key (keep secret!)
   - Save `JWT Secret` (keep secret!)

3. **Run migrations**: In Supabase SQL Editor, run migrations in order from `app/supabase/migrations/`

### 3. Get API Keys

1. **Anthropic**: https://console.anthropic.com/settings/keys
2. **Jina AI** (optional): https://jina.ai/reader (200 RPM free tier)
3. **Cloudflare Account ID**: Cloudflare Dashboard > Account ID (top right)

### 4. Configure Local Development

#### Frontend

```bash
cd app/frontend
cp .env.example .env

# Edit .env:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_WORKER_URL=https://your-worker.workers.dev

# For local worker development, create .env.local:
cp .env.local.example .env.local
# It should have: VITE_WORKER_URL=http://localhost:8787
```

#### Workers (Local Development)

```bash
cd app/workers
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your actual secrets:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
ANTHROPIC_API_KEY=sk-ant-...
JINA_API_KEY=jina_...  # Optional
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_GATEWAY_ID=job-parser-getaway
ENVIRONMENT=development
```

**Where to get values:**
- `SUPABASE_SERVICE_KEY`: Supabase > Settings > API > `service_role` secret
- `SUPABASE_JWT_SECRET`: Supabase > Settings > API > JWT Secret
- `ANTHROPIC_API_KEY`: console.anthropic.com > API Keys
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Dashboard > Account ID

### 5. Run Locally

**Option 1: Automated (macOS)**
```bash
cd /path/to/cari-kerja
./start-local.sh
```

**Option 2: Manual (2 terminals)**

Terminal 1 - Worker:
```bash
cd app/workers
wrangler dev --local
# Wait for: "Ready on http://localhost:8787"
```

Terminal 2 - Frontend:
```bash
cd app/frontend
bun run dev
# Wait for: "Local: http://localhost:5173"
```

**Open browser**: http://localhost:5173

✅ Frontend on `localhost:5173`
✅ Worker on `localhost:8787`
✅ Supabase production (cloud)

### 6. Deploy to Production

#### Workers

```bash
cd app/workers
wrangler login  # First time only

# Set production secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put SUPABASE_JWT_SECRET
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put JINA_API_KEY  # Optional
wrangler secret put CLOUDFLARE_ACCOUNT_ID

# Deploy
wrangler deploy
```

#### Frontend (Cloudflare Pages)

1. Push to GitHub
2. Cloudflare Pages > Create Project
3. Select repository
4. Build settings:
   - Framework: Vue
   - Build command: `cd app/frontend && bun install && bun run build`
   - Output: `app/frontend/dist`
5. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WORKER_URL`

## 📊 Database Schema

### Kanban Tables
- **kanban_columns**: 7 workflow stages (Interested, Applied, Interviewing, Offer, Rejected, Accepted, Withdrawn)
- **kanban_cards**: Job application cards with drag-and-drop positions
- **kanban_card_activities**: Audit log for card movements

### Job Tables
- **jobs**: Job postings with AI-extracted metadata
- **job_documents**: CV and cover letter versions (future feature)
- **regeneration_requests**: Document regeneration tracking (future feature)
- **processing_queue**: Background task queue (future feature)

## 🎨 Kanban Workflow (7 Stages)

1. **🟣 Interested** → Exploring opportunity
2. **🔵 Applied** → Application submitted, waiting for response
3. **🟡 Interviewing** → Active interview process
4. **🟢 Offer** → Offer received, decision pending
5. **🔴 Rejected** → Application declined
6. **✅ Accepted** → Offer accepted
7. **⚪ Withdrawn** → Application withdrawn by candidate

## 🔍 Job Parser Flow

When you add a new job:

1. **Parse URL** (LinkedIn, Indeed, etc.) → Extract via Jina AI Reader
   - OR **Paste Text** → Use job description directly
2. **AI Analysis** → Claude Sonnet 4.5 extracts:
   - Company name
   - Position title
   - Location, salary, job type
   - Full job description (cleaned)
   - Confidence score (0-100)
3. **Create Card** → Automatically added to kanban board
4. **Track Progress** → Drag through workflow stages

## 🛠️ Development

### Frontend Development

```bash
cd app/frontend
bun run dev      # Start dev server (localhost:5173)
bun run build    # Build for production
bun run preview  # Preview production build
bun run lint     # Lint code (if configured)
```

### Workers Development

```bash
cd app/workers
wrangler dev --local    # Run worker locally (localhost:8787)
wrangler deploy         # Deploy to production
wrangler tail           # Stream production logs
```

### Full Local Development

See [LOCAL_DEV_SETUP.md](../LOCAL_DEV_SETUP.md) for detailed setup guide.

**Quick start:**
```bash
./start-local.sh  # Automated (macOS)
```

## 🔐 Security Features

This application implements enterprise-grade security:

- ✅ **Authentication**: Supabase Auth with local JWT verification (fast!)
- ✅ **Rate Limiting**: 10-30 req/min based on endpoint
- ✅ **SSRF Protection**: Domain allowlist for job parsing
- ✅ **XSS Prevention**: Safe DOM manipulation, CSP headers
- ✅ **Input Validation**: Server-side validation (50KB limit)
- ✅ **RLS Policies**: Row Level Security on all database tables
- ✅ **Security Headers**: 10+ OWASP-compliant headers
- ✅ **No Exposed Secrets**: All credentials in secure storage

**Security Score**: 8.5/10 (Medium-Low Risk)

For security details: See [`.ai_security_context/SECURITY_FIXES_COMPLETE.md`](../.ai_security_context/SECURITY_FIXES_COMPLETE.md)

## 🧪 Testing

### Quick Health Check (30 seconds)
```bash
./quick-test.sh
```

### Full Security Tests (5 minutes)
```bash
# Get JWT token from browser (DevTools > Application > Local Storage)
export JWT_TOKEN="your_token_here"
./test-security.sh
```

### Manual Testing
See [TESTING_QUICKSTART.md](../TESTING_QUICKSTART.md) for comprehensive test guide.

## 🔑 Complete Environment Variables

### Frontend (.env for production)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_WORKER_URL=https://your-worker.workers.dev
```

### Frontend (.env.local for local dev)
```env
VITE_WORKER_URL=http://localhost:8787
```

### Workers (.dev.vars for local dev)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
ANTHROPIC_API_KEY=sk-ant-...
JINA_API_KEY=jina_...  # Optional
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_GATEWAY_ID=job-parser-getaway
ENVIRONMENT=development
```

### Workers (Production Secrets)
```bash
# Set via wrangler secret put
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put SUPABASE_JWT_SECRET
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put JINA_API_KEY  # Optional
wrangler secret put CLOUDFLARE_ACCOUNT_ID
```

## 📝 Usage

### Adding a Job

1. **Click "Add Job Target"** button
2. **Choose input method:**
   - **URL**: Paste LinkedIn/Indeed/etc. job posting URL
   - **Manual**: Copy & paste job description text
3. **Parse**: Click "Parse Job Post"
4. **Review**: Check extracted details (company, position, salary, etc.)
5. **Save**: Create kanban card

### Managing Applications

- **Drag cards** between columns to update status
- **Click card** to view full job details
- **Delete** unwanted applications
- **Track progress** across 7 workflow stages

## 🧪 Testing

### Before Committing
```bash
./quick-test.sh  # 30-second health check
```

### Full Test Suite
```bash
export JWT_TOKEN="..."  # Get from DevTools > Application > Local Storage
./test-security.sh
```

See [TESTING_QUICKSTART.md](../TESTING_QUICKSTART.md) for detailed testing guide.

## 🐛 Troubleshooting

### "Failed to fetch" or CORS errors
**Cause**: Worker not running or CSP blocking connection

**Fix**:
```bash
# Check if worker is running
lsof -i :8787

# If not, start it
cd app/workers && wrangler dev --local
```

### "401 Unauthorized" errors
**Cause**: Missing or incorrect JWT secret

**Fix**:
```bash
# Verify .dev.vars has correct SUPABASE_JWT_SECRET
# Get from: Supabase > Settings > API > JWT Secret
# Restart worker after updating
```

### "SUPABASE_JWT_SECRET not configured"
**Fix**: Add to `app/workers/.dev.vars`:
```env
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase
```

### Rate limit exceeded
**Normal**: Wait 60 seconds, limit resets
**If frequent**: Adjust rate limits in `app/workers/src/middleware/rate-limit.ts`

### Job parsing fails
**Check**:
1. Is URL from trusted domain? (LinkedIn, Indeed, etc.)
2. Worker logs: `wrangler tail` or check terminal
3. API keys configured correctly in `.dev.vars`

### Real-time updates not working
- Verify Supabase Realtime is enabled
- Check browser console for WebSocket errors
- Ensure user is authenticated

## 🤝 Contributing

### For Developers

1. **Clone repo** and follow Quick Start above
2. **Create feature branch**: `git checkout -b feature/your-feature`
3. **Run tests** before committing: `./quick-test.sh`
4. **Follow conventions**:
   - TypeScript strict mode
   - ESLint + Prettier (if configured)
   - Meaningful commit messages
5. **Submit PR** with description of changes

### Development Workflow

1. Make changes
2. Test locally (`./quick-test.sh`)
3. Commit (`git commit -m "feat: your feature"`)
4. Push and create PR
5. Deploy after review

### Getting Help

- Check [LOCAL_DEV_SETUP.md](../LOCAL_DEV_SETUP.md) for setup issues
- Check [TESTING_QUICKSTART.md](../TESTING_QUICKSTART.md) for testing help
- Review `.ai_security_context/` for security documentation

## 📄 License

MIT

## 📚 Additional Documentation

- [LOCAL_DEV_SETUP.md](../LOCAL_DEV_SETUP.md) - Detailed local development guide
- [TESTING_QUICKSTART.md](../TESTING_QUICKSTART.md) - Testing guide
- [README_SECURITY_TESTING.md](../README_SECURITY_TESTING.md) - Security testing
- `.ai_security_context/` - Security audit reports and fixes

## 🎯 Roadmap

- [ ] CV/Cover letter generation (planned)
- [ ] PDF export functionality
- [ ] Email integration
- [ ] Analytics dashboard
- [ ] Chrome extension
- [ ] Mobile app
