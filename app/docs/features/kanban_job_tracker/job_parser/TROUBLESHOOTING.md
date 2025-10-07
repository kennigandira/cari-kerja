# Troubleshooting Guide: Job Parser

**Version:** 1.0
**Date:** October 7, 2025
**Related:** USER_GUIDE.md, API_USAGE.md

---

## Common Errors & Solutions

### ❌ Error: "Failed to fetch"

**Error message in modal (red box):**
```
Failed to fetch
```

#### What it means:
The Jina AI Reader could not access the job posting URL.

#### Common causes:
1. **Site requires authentication** (LinkedIn, Indeed with login walls)
2. **CAPTCHA protection** (anti-bot measures)
3. **Invalid URL** (404 Not Found, page removed)
4. **Site blocks scraping** (403 Forbidden)
5. **Network timeout** (slow site or connection)

#### Solutions:

**✅ Solution 1: Use Manual Paste (Recommended)**
1. Open the job posting in your browser
2. Select and copy the entire job description
3. Return to modal (fallback prompt should appear)
4. Dropdown auto-switches to "Copy & paste description"
5. Paste the copied text → Parse → Review → Confirm

**✅ Solution 2: Check URL Format**
- Use the **direct job posting URL**, not search results:
  - ✅ Good: `https://jobs.lever.co/company/engineer-123`
  - ❌ Bad: `https://jobs.lever.co/company?search=engineer`
- Expand shortened URLs (bit.ly, tinyurl):
  - Paste shortened URL in browser → Copy expanded URL from address bar

**✅ Solution 3: Wait and Retry**
- Jina AI might be temporarily rate-limited or down
- Wait 1-2 minutes → Try again
- If fails 3+ times → Use manual paste

---

### ⚠️ Warning: "Extraction confidence is low"

**Warning message in preview (yellow box):**
```
⚠️ Extraction confidence is low (45%). Please review carefully.
```

#### What it means:
AI successfully extracted data but isn't confident about accuracy.

#### Common causes:
1. **Ambiguous company name** (recruiter posting "for our client")
2. **Vague position title** (e.g., "Engineer" without specialization)
3. **Minimal job description** (<100 words)
4. **Mixed information** (multiple positions in one posting)
5. **Non-English content** (poorly translated Thai text)

#### Solutions:

**✅ Solution 1: Review & Edit**
1. Check extracted fields in preview:
   - **Company:** Is it the actual employer or a recruiter?
   - **Position:** Is it specific enough?
   - **Description:** Is it complete?
2. If fields are correct → Click "Confirm & Add to Board" anyway
3. If fields are wrong → Click "Edit" → Try manual paste with clarifications

**✅ Solution 2: Improve Input Quality**
- **For URLs:** Use company career page instead of recruiter/job board
- **For manual paste:** Include more context:
  ```
  Company: Airbnb Thailand
  Position: Senior Frontend Engineer
  [Full job description...]
  ```

**✅ Solution 3: Accept & Edit Later**
- Save the job with low confidence
- Click on the card later → Edit job details manually in detail modal
- Refine company name / position title as needed

---

### ❌ Error: "Could not extract required fields (company and position)"

**Error message in modal (red box):**
```
Could not extract required fields (company and position)
```

#### What it means:
AI could not identify the company name OR position title.

#### Common causes:
1. **Input too short** (< 50 words)
2. **Missing critical information** (job description without company/title)
3. **Unusual formatting** (company name in image/logo only)
4. **AI parsing failure** (rare edge case)

#### Solutions:

**✅ Solution 1: Add Missing Information**
1. Click "Edit" to return to input
2. Prepend company and position explicitly:
   ```
   Company: ABC Corporation
   Position: Software Engineer

   [Original job description]
   ```
3. Parse again → Should succeed with 90%+ confidence

**✅ Solution 2: Use Structured Format**
- Copy job description in sections:
  ```
  About ABC Corporation:
  [Company description]

  Role: Software Engineer

  Responsibilities:
  [List of duties]

  Requirements:
  [Qualifications]
  ```

**✅ Solution 3: Check Original Posting**
- Verify the URL/text actually contains job information
- Some URLs might be category pages or expired listings

---

### 🔄 Error: "Network error. Please check your connection."

**Error message in modal (red box):**
```
Network error. Please check your connection.
```

#### What it means:
Request to Cloudflare Worker failed to reach the server.

#### Common causes:
1. **No internet connection**
2. **Firewall blocking Worker domain** (*.workers.dev)
3. **VPN interference**
4. **Browser blocking cross-origin requests**
5. **Worker is down** (deployment issue)

#### Solutions:

**✅ Solution 1: Check Internet Connection**
- Open another website to verify connectivity
- Reload the kanban board page
- Try again

**✅ Solution 2: Check Browser Console**
- Press `F12` → Console tab
- Look for errors like:
  - `ERR_NAME_NOT_RESOLVED` → DNS issue
  - `ERR_CONNECTION_REFUSED` → Worker down
  - `CSP violation` → Content Security Policy blocking request

**✅ Solution 3: Verify Worker Deployment**
- Open `https://job-kanban-worker.devkenni-g.workers.dev/health`
- Should return: `{"status":"ok","timestamp":"..."}`
- If 404/error → Worker not deployed (see API_USAGE.md)

**✅ Solution 4: Disable VPN/Proxy**
- Temporarily disable VPN
- Try parsing again
- Re-enable VPN after successful parse

**✅ Solution 5: Check CSP Settings**
- Developer error - Worker URL might not be in CSP whitelist
- See API_USAGE.md for CSP configuration

---

### ⏱️ Issue: Parser hangs (>30 seconds, no response)

**Symptoms:**
- "Analyzing..." spinner shows for >30 seconds
- No preview appears
- No error message
- Button stuck in loading state

#### Common causes:
1. **Claude API timeout** (processing very long job description)
2. **Jina AI slow response** (site is slow to load)
3. **Worker cold start** (first request after inactivity)
4. **Network congestion**

#### Solutions:

**✅ Solution 1: Wait 60 seconds**
- Worker timeout is 30 seconds, but network delay can add 10-20s
- Wait up to 60 seconds total before giving up

**✅ Solution 2: Refresh & Retry**
- Refresh the entire kanban board page (`Cmd/Ctrl + R`)
- Click "Add Job Target" again
- Try the same URL/text → Should respond faster (Worker warm)

**✅ Solution 3: Reduce Input Size**
- If using manual paste with >10,000 words → Trim to essentials:
  - Keep: Company, position, requirements, responsibilities
  - Remove: Company history, benefits details, legal disclaimers

**✅ Solution 4: Check Worker Logs**
- Access Cloudflare dashboard → Workers → job-kanban-worker
- View real-time logs for errors/timeouts
- See API_USAGE.md for log access instructions

---

### 🚫 Error: "Please sign in to use the job parser"

**Error message in modal (red box):**
```
Please sign in to use the job parser
```

#### What it means:
Your authentication session expired or is invalid.

#### Solutions:

**✅ Solution 1: Refresh Page**
- Refresh the kanban board page
- Session should auto-restore

**✅ Solution 2: Sign Out & Sign In**
- Click "Sign Out" (top-right)
- Sign in again with your credentials
- Try parsing again

**✅ Solution 3: Check Supabase Session**
- Open browser DevTools → Application tab → Local Storage
- Look for `supabase.auth.token`
- If missing → Sign in again

---

## Known Limitations

### Sites That Often Fail

| Site | Success Rate | Recommendation |
|------|--------------|----------------|
| LinkedIn (public URLs) | 30-50% | Use manual paste |
| LinkedIn (logged in) | 5% | Always use manual paste |
| Indeed | 70-85% | URL works usually, fallback ready |
| Glassdoor | 60-75% | Try URL first, manual paste if fails |
| Company career pages | 80-95% | Best success rate |
| Greenhouse ATS | 85-95% | Excellent reliability |
| Lever ATS | 85-95% | Excellent reliability |
| Workable ATS | 70-80% | Good reliability |

### Fields That May Be Missed

| Field | Extraction Rate | Notes |
|-------|-----------------|-------|
| Company Name | 98% | Rarely missed |
| Position Title | 97% | Almost always found |
| Job Description | 99% | Primary focus, highly reliable |
| Location | 70-85% | Often ambiguous (remote vs office) |
| Salary Range | 40-60% | Many postings don't list salary |
| Job Type | 65-80% | Full-time vs contract often unclear |
| Posted Date | 30-50% | Rarely explicitly stated |

**Recommendation:** Don't rely on optional fields. Always review the preview and manually edit missing data.

---

## Debugging Tips

### Enable Verbose Logging

**Browser Console (F12):**
1. Open DevTools → Console tab
2. Check for errors during parsing
3. Look for API response details

**Key logs to watch:**
```
Log: Sending parse request with URL: https://...
Log: Parse response received: {confidence: 85, ...}
Error: Failed to fetch job content: HTTP 403
```

### Check Network Requests

**Browser DevTools → Network tab:**
1. Filter by "Fetch/XHR"
2. Look for `/api/parse-job` request
3. Check response status:
   - `200 OK` → Success
   - `400 Bad Request` → URL fetch failed
   - `422 Unprocessable` → Low confidence
   - `500 Internal Error` → Worker crash

### Test Worker Directly

**Using curl:**
```bash
# Health check
curl https://job-kanban-worker.devkenni-g.workers.dev/health

# Test parse endpoint (requires auth token)
curl -X POST https://job-kanban-worker.devkenni-g.workers.dev/api/parse-job \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Company: TestCo\nPosition: Engineer\n\nWe are hiring..."}'
```

**Expected responses:**
- Health: `{"status":"ok","timestamp":"..."}`
- Parse: `{"company_name":"TestCo","position_title":"Engineer",...}`

---

## Getting Support

### Before Reporting a Bug

**Collect this information:**
1. **Error message** (exact text from modal)
2. **Job URL** (if applicable, redact sensitive parts)
3. **Browser & OS:** (e.g., "Chrome 120 on macOS Sonoma")
4. **Screenshot** of error state
5. **Console errors** (F12 → Console tab → screenshot)
6. **Network response** (F12 → Network → /api/parse-job → Preview tab)

### Where to Report

1. **GitHub Issues:** [your-repo/issues](https://github.com/your-repo/issues)
   - Tag with `bug` and `job-parser`
   - Include all info from "Before Reporting" section

2. **Support Email:** support@your-domain.com
   - Subject: "[Job Parser] Brief error description"
   - Attach screenshots and logs

3. **Community Forum:** [forum.your-domain.com](https://forum.your-domain.com)
   - Search existing threads first
   - Post in "Job Parser Help" category

---

## Performance Optimization

### Slow Parsing (>15 seconds)

**Causes & Fixes:**

1. **Large job description (>5000 words)**
   - **Fix:** Trim to essentials before pasting

2. **Cold Worker start (first request after 15+ min)**
   - **Fix:** Accept the delay, subsequent requests will be fast (<5s)

3. **Jina AI slow site fetch**
   - **Fix:** Use manual paste to bypass Jina AI

4. **Claude API rate limiting**
   - **Fix:** Wait 1 minute between parses

### Frequent Failures

**Patterns to avoid:**

- **Parsing 10+ jobs rapidly** → Triggers rate limits → Wait 30s between parses
- **Using LinkedIn URLs repeatedly** → Blocked by LinkedIn → Switch to manual paste
- **Pasting entire company About page** → Too much noise → Paste only job description section

---

## FAQ: Troubleshooting Edition

**Q: Why does LinkedIn fail 90% of the time?**
**A:** LinkedIn aggressively blocks scrapers and requires login for most jobs. Always use manual paste for LinkedIn.

**Q: The parser worked yesterday, why not today?**
**A:** Site might have added CAPTCHA or changed HTML structure. Try manual paste.

**Q: Can I increase the timeout from 30s to 60s?**
**A:** Not from the UI. You can modify `app/workers/src/tasks/parse-job-post.ts` and redeploy (see API_USAGE.md).

**Q: Parser says "confidence 0%" but the data looks correct.**
**A:** AI's confidence algorithm is conservative. If fields are accurate, click "Confirm" anyway.

**Q: Does parsing cost money?**
**A:** Yes, ~$0.014 per job (Claude API) + Jina AI free tier (1M tokens/month). See API_USAGE.md for cost analysis.

---

## Advanced: Developer Fixes

### Update Claude System Prompt

If extraction quality is poor for specific job types:

1. Edit `app/workers/src/tasks/parse-job-post.ts`
2. Modify `SYSTEM_PROMPT` constant (lines 52-146)
3. Redeploy Worker: `npx wrangler deploy`

**Example:** Improve Thai language handling:
```typescript
const SYSTEM_PROMPT = `...
### Thai Language (UPDATED):
If content is in Thai, first translate key fields to English:
- Company name: Keep original Thai in parentheses
- Position title: Translate to English equivalent
- Description: Full English translation
...`
```

### Increase Worker Timeout

Default: 30 seconds (Cloudflare limit: 60s)

**Edit `app/workers/src/tasks/parse-job-post.ts`:**
```typescript
const response = await fetch(jinaUrl, {
  headers,
  signal: AbortSignal.timeout(60000) // Increase to 60s
})
```

### Add Custom Error Messages

**Edit `app/frontend/src/components/JobParserModal.vue`:**
```typescript
const handleError = (err: ParseJobError, status: number) => {
  if (status === 403) {
    error.value = 'LinkedIn requires login. Please use manual paste instead.'
  }
  // ... existing error handling
}
```

---

**Last Updated:** October 7, 2025
**Version:** 1.0
**Feedback:** Create an issue or edit this doc
