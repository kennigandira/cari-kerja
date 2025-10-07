# Security Testing - Quick Start Guide

**Estimated Time:** 2-3 hours
**Prerequisites:** Docker, Node.js, Bun installed

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Configure secrets (one-time)
cd app/workers
wrangler secret put SUPABASE_JWT_SECRET
# Paste JWT secret from Supabase Dashboard
wrangler secret put CLOUDFLARE_ACCOUNT_ID
# Paste: fdfd99f39ae433ab6b17c88f62af0316

# 2. Start all services
cd /Users/user/Documents/cari-kerja
./start-all.sh  # If you have a startup script, or run commands below

# 3. Run automated tests
export JWT_TOKEN="your_jwt_token_after_login"
./test-security.sh
```

---

## Step-by-Step Setup

### 1. Terminal Setup (Open 4 Terminals)

#### Terminal 1: Supabase
```bash
cd /Users/user/Documents/cari-kerja/app/supabase
supabase db reset  # Reset to apply new auth config
supabase start

# Wait for "Started supabase local development setup"
# Note the API URL and anon key
```

#### Terminal 2: Workers
```bash
cd /Users/user/Documents/cari-kerja/app/workers
bun run dev

# Wait for "Ready on http://localhost:8787"
```

#### Terminal 3: Frontend
```bash
cd /Users/user/Documents/cari-kerja/app/frontend
bun run dev

# Wait for "Local: http://localhost:5173"
```

#### Terminal 4: Testing Console
```bash
cd /Users/user/Documents/cari-kerja

# Keep this terminal for running tests
```

---

## 2. Manual Testing Checklist

### A. Authentication Tests (10 min)

1. **Open:** http://localhost:5173
2. **Click:** Sign Up
3. **Test Weak Password:**
   - Email: test1@example.com
   - Password: weak123 (8 chars)
   - **Expected:** ❌ Error "Password must be at least 12 characters"

4. **Test Strong Password:**
   - Email: test2@example.com
   - Password: MySecurePass123 (16 chars, mixed)
   - **Expected:** ✅ "Confirmation email sent"

5. **Confirm Email:**
   - Check Terminal 1 (Supabase logs) for InBucket email
   - Look for: `http://127.0.0.1:54324` - open this in browser
   - Click confirmation link
   - **Expected:** ✅ Email confirmed

6. **Login:**
   - Email: test2@example.com
   - Password: MySecurePass123
   - **Expected:** ✅ Logged in, redirected to dashboard

7. **Get JWT Token:**
   - Open DevTools → Application → Local Storage → cari-kerja-auth
   - Copy `access_token` value
   - `export JWT_TOKEN="paste_token_here"`

---

### B. Automated Security Tests (5 min)

```bash
# Run automated test suite
./test-security.sh

# Expected output:
# ✓ Empty request rejected
# ✓ Short text rejected
# ✓ Missing X-Requested-With rejected
# ✓ Wrong origin rejected
# ✓ Localhost URL rejected
# ✓ Private IP rejected
# ✓ Security headers present
# ✓ Rate limiting enforced
```

---

### C. Manual Functionality Tests (20 min)

#### Test: Job Parsing (URL Method)
1. **Click:** "Add Job" or Parser button
2. **Select:** URL tab
3. **Enter:** https://www.linkedin.com/jobs/view/[any-job-id]
4. **Click:** Parse
5. **Expected:**
   - ✅ Job details extracted
   - ✅ Company name, position filled
   - ✅ Confidence score shown

#### Test: Job Parsing (Manual Method)
1. **Select:** Manual Paste tab
2. **Paste:** [Copy any job description from LinkedIn]
3. **Click:** Parse
4. **Expected:**
   - ✅ Job details extracted
   - ✅ All fields populated

#### Test: SSRF Protection
1. **Select:** URL tab
2. **Enter:** http://localhost:5173/test
3. **Click:** Parse
4. **Expected:** ❌ Error: "not in trusted job sites list"

5. **Enter:** https://example.com/job
6. **Expected:** ❌ Error: "not in trusted job sites list"

#### Test: XSS Prevention
1. **Select:** Manual Paste tab
2. **Paste:**
   ```
   Senior Developer <script>alert('XSS')</script>

   Company needs developer with experience in <img src=x onerror=alert('XSS')>
   ```
3. **Click:** Parse
4. **Expected:**
   - ✅ No JavaScript alerts
   - ✅ Script tags visible as text (escaped)
   - ✅ Check DevTools Elements: should see `&lt;script&gt;`

#### Test: Kanban Board
1. **Create Card:** From parsed job
2. **Drag Card:** To different column
3. **Edit Card:** Update details
4. **Delete Card:** Remove card
5. **Expected:** ✅ All operations work smoothly

#### Test: Rate Limiting
1. **Action:** Parse 5 jobs rapidly (< 1 minute)
2. **Expected:** All succeed (within limit)
3. **Action:** Parse 11 jobs rapidly
4. **Expected:**
   - ✅ First 10 succeed
   - ❌ 11th shows error: "Rate limit exceeded"
5. **Wait:** 60 seconds
6. **Action:** Try again
7. **Expected:** ✅ Works (limit reset)

---

### D. Security Headers Test (5 min)

1. **Open:** http://localhost:5173
2. **Open DevTools:** F12 → Network tab
3. **Make API call:** Parse a job
4. **Click:** The request to `/api/parse-job`
5. **Check Response Headers:**

**Must Have:**
- [ ] content-security-policy
- [ ] x-content-type-options: nosniff
- [ ] x-frame-options: DENY
- [ ] referrer-policy: strict-origin-when-cross-origin
- [ ] permissions-policy
- [ ] cross-origin-embedder-policy: require-corp
- [ ] cross-origin-opener-policy: same-origin
- [ ] cross-origin-resource-policy: same-origin
- [ ] x-ratelimit-limit
- [ ] x-ratelimit-remaining

**Must NOT Have:**
- [ ] x-xss-protection (deprecated, should be absent)

---

### E. Browser Console Test (2 min)

1. **Open DevTools:** Console tab
2. **Use the app:** Register, login, parse job, create card
3. **Check:**
   - [ ] No errors in console
   - [ ] No warnings about security issues
   - [ ] No CORS errors
   - [ ] No CSP violations

**If errors found, document:**
```
Error: _______________
File: _______________
Line: _______________
```

---

### F. Cross-Browser Testing (15 min)

Repeat core tests in:

#### Chrome
- [ ] Registration works
- [ ] Job parsing works
- [ ] Kanban works

#### Firefox
- [ ] Registration works
- [ ] Job parsing works
- [ ] Kanban works

#### Safari (if on macOS)
- [ ] Registration works
- [ ] Job parsing works
- [ ] Kanban works

---

### G. Mobile Testing (10 min)

1. **Open DevTools:** Toggle device toolbar (Ctrl+Shift+M)
2. **Select:** iPhone 14 Pro
3. **Test:**
   - [ ] UI responsive
   - [ ] Touch interactions work
   - [ ] Forms usable
   - [ ] Job parsing works
   - [ ] Kanban drag-and-drop works

---

## Performance Benchmarks

### Response Time Tests

| Endpoint | Target | Actual | Status |
|----------|--------|--------|--------|
| /health | < 50ms | __ ms | ✓ / ✗ |
| /api/parse-job (text) | < 10s | __ s | ✓ / ✗ |
| /api/parse-job (url) | < 15s | __ s | ✓ / ✗ |
| JWT auth check | < 200ms | __ ms | ✓ / ✗ |

---

## Issues Found

### Critical (Blocks Deployment)
_None_ / _List:_
1. _______________

### High (Fix Before Deploy)
_None_ / _List:_
1. _______________

### Medium (Fix Soon)
_None_ / _List:_
1. _______________

### Low (Backlog)
1. _______________

---

## Regression Check

**Did security fixes break any existing features?**

- [ ] ✅ No regressions - all features work
- [ ] ⚠️ Minor issues - list below
- [ ] ❌ Major issues - blocks deployment

**Details:** _______________

---

## Final Verdict

### Security Assessment
- **Security Features Working:** Yes / No
- **All Tests Passed:** ___% (___/30+)
- **Critical Issues:** ___ found
- **Deployment Ready:** Yes / No

### Functionality Assessment
- **Core Features Working:** Yes / No
- **Performance Acceptable:** Yes / No
- **User Experience Good:** Yes / No

### Overall Status
- [ ] ✅ **APPROVED** - Deploy to production
- [ ] ⚠️ **CONDITIONAL** - Fix issues first, then deploy
- [ ] ❌ **BLOCKED** - Critical issues, do not deploy

---

## Approval Signatures

**Tester:** _______________ Date: _______________
**Reviewer:** _______________ Date: _______________
**Approver:** _______________ Date: _______________

---

## Notes & Observations

_______________
_______________
_______________

---

## Attachments

- [ ] Screenshots of test results
- [ ] Browser console logs
- [ ] Network request/response examples
- [ ] Performance profiling data

---

**Test Completion Time:** _______________
**Total Duration:** _______________
**Result:** PASS / FAIL / CONDITIONAL
