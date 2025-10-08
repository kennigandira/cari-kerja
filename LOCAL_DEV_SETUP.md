# Local Development Setup Guide

**Goal:** Run frontend + workers + supabase all locally for smooth development

---

## One-Time Setup (5 minutes)

### Step 1: Create Worker Secrets File

```bash
cd /Users/user/Documents/cari-kerja/app/workers
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and fill in your actual values:

```env
SUPABASE_URL=https://ewqqpflajxvqkoawgmek.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG... (get from Supabase Dashboard)
SUPABASE_JWT_SECRET=your-super... (get from Supabase Dashboard)
ANTHROPIC_API_KEY=sk-ant-... (get from console.anthropic.com)
JINA_API_KEY=jina_... (optional)
CLOUDFLARE_ACCOUNT_ID=fdfd99f39ae433ab6b17c88f62af0316
CLOUDFLARE_GATEWAY_ID=job-parser-getaway
ENVIRONMENT=development
```

**Where to get secrets:**
- **SUPABASE_SERVICE_KEY:** Supabase Dashboard > Settings > API > `service_role` secret
- **SUPABASE_JWT_SECRET:** Supabase Dashboard > Settings > API > JWT Secret
- **ANTHROPIC_API_KEY:** https://console.anthropic.com/settings/keys
- **JINA_API_KEY:** https://jina.ai/reader (optional, for better rate limits)

### Step 2: Frontend Already Configured

✅ The file `app/frontend/.env.local` is already set to use `http://localhost:8787`

---

## Daily Development (3 Terminals)

### Terminal 1: Supabase (Optional - if using local DB)
```bash
cd /Users/user/Documents/cari-kerja/app/supabase
supabase start

# Wait for: "Started supabase local development setup"
```

### Terminal 2: Worker
```bash
cd /Users/user/Documents/cari-kerja/app/workers
wrangler dev --local

# Wait for: "Ready on http://localhost:8787"
# Or if you prefer: bun run dev (if configured in package.json)
```

### Terminal 3: Frontend
```bash
cd /Users/user/Documents/cari-kerja/app/frontend
bun run dev

# Wait for: "Local: http://localhost:5173"
```

### Open Browser
```
http://localhost:5173
```

---

## Verify Local Setup

```bash
# Test worker health
curl http://localhost:8787/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## Switching Between Local & Production

### Use Local (Development)
- Frontend automatically uses `http://localhost:8787` (via .env.local)
- Worker runs locally with `wrangler dev --local`

### Use Production (Testing)
```bash
# Delete .env.local temporarily
mv app/frontend/.env.local app/frontend/.env.local.backup

# Frontend will use production worker from .env
# VITE_WORKER_URL=https://job-kanban-worker.devkenni-g.workers.dev
```

**Restore local:**
```bash
mv app/frontend/.env.local.backup app/frontend/.env.local
```

---

## Troubleshooting

### "401 Unauthorized" Error
**Cause:** JWT secret mismatch or not set
**Fix:**
1. Check `.dev.vars` has correct `SUPABASE_JWT_SECRET`
2. Get correct value from Supabase Dashboard > Settings > API
3. Restart worker: Ctrl+C, then `wrangler dev --local`

### "Worker not found at localhost:8787"
**Fix:**
```bash
cd app/workers
wrangler dev --local
```

### "SUPABASE_JWT_SECRET not configured"
**Fix:** Add to `app/workers/.dev.vars` file

### Frontend still hitting production
**Fix:** Check `app/frontend/.env.local` exists and has:
```
VITE_WORKER_URL=http://localhost:8787
```

Then restart frontend (Ctrl+C, then `bun run dev`)

---

## Pro Tips

1. **Keep terminals organized:**
   - Terminal 1: Supabase (optional)
   - Terminal 2: Worker (required)
   - Terminal 3: Frontend (required)

2. **Check logs for errors:**
   - Worker logs show auth/validation errors
   - Browser console shows frontend errors

3. **Quick restart:**
   ```bash
   # Ctrl+C in worker terminal, then
   wrangler dev --local
   ```

4. **Use production for final testing:**
   - Deploy with `wrangler deploy`
   - Test with production URL
   - Switch back to local for development

---

## Current Status

✅ Frontend configured for local dev (`.env.local` created)
⏳ Need to create `app/workers/.dev.vars` with your secrets
⏳ Need to run `wrangler dev --local`

**Next:** Create `.dev.vars` file and start worker locally!
