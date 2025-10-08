# 🔒 Security Testing Guide

This guide helps you test all 18 security fixes to ensure they work correctly without breaking functionality.

---

## 📚 Documentation Structure

```
cari-kerja/
├── README_SECURITY_TESTING.md          ← You are here! (Start here)
├── TESTING_QUICKSTART.md               ← Step-by-step manual testing
├── quick-test.sh                       ← 30-second automated health check
├── test-security.sh                    ← 5-minute comprehensive auto tests
└── .ai_security_context/
    ├── TESTING_SUMMARY.md              ← Testing strategies overview
    ├── test_execution_guide.md         ← Detailed test procedures
    ├── test_results_template.md        ← Template for documenting results
    ├── SECURITY_FIXES_COMPLETE.md      ← What was fixed
    └── final_remediation_report.md     ← Technical details
```

---

## 🚀 Three Ways to Test

### 1️⃣ Ultra Quick Test (30 seconds) ⚡

Just want to know if it's working?

```bash
cd /Users/user/Documents/cari-kerja
./quick-test.sh
```

**Tests:**
- ✓ Worker running
- ✓ Security headers present
- ✓ CSRF protection active
- ✓ Authentication required

**Use when:** Quick validation, smoke testing

---

### 2️⃣ Automated Security Test (5 minutes) 🤖

Test all security features automatically:

```bash
# 1. Start services (3 terminals)
cd app/supabase && supabase start
cd app/workers && bun run dev
cd app/frontend && bun run dev

# 2. Get JWT token (register & login via UI)
export JWT_TOKEN="your_token_from_browser"

# 3. Run tests
./test-security.sh
```

**Tests:**
- ✓ Input validation (15 tests)
- ✓ CSRF protection (3 tests)
- ✓ SSRF protection (5 tests)
- ✓ Security headers (5 tests)
- ✓ Rate limiting (3 tests)

**Use when:** Before deployment, after changes

---

### 3️⃣ Full Manual Testing (2.5 hours) 🔍

Complete validation of security + functionality:

**Follow:** `TESTING_QUICKSTART.md`

**Covers:**
- ✓ All 18 security features
- ✓ All 5 core functionalities
- ✓ Cross-browser testing
- ✓ Performance benchmarks
- ✓ Edge cases

**Use when:** Pre-production, major releases

---

## 🎯 What Gets Tested

### Security Features (18)

1. **Authentication**
   - ✓ 12+ char passwords enforced
   - ✓ Email confirmation required
   - ✓ MFA available
   - ✓ JWT verified locally (fast!)

2. **API Protection**
   - ✓ Rate limiting (10-100 req/min)
   - ✓ CSRF protection (Origin + headers)
   - ✓ Input validation (50KB max)
   - ✓ Auth required for all APIs

3. **Injection Prevention**
   - ✓ SSRF blocks private IPs
   - ✓ SSRF allows only trusted domains
   - ✓ XSS prevented (safe DOM)
   - ✓ SQL injection protected (RLS)

4. **Configuration**
   - ✓ No debug endpoints
   - ✓ No exposed API keys
   - ✓ Security headers (10+)
   - ✓ No source maps in production
   - ✓ Deprecated headers removed

### Application Features (5)

1. **User Management**
   - ✓ Registration
   - ✓ Login
   - ✓ Session management

2. **Job Parsing**
   - ✓ URL parsing
   - ✓ Manual text parsing

3. **Kanban Board**
   - ✓ Create cards
   - ✓ Drag & drop
   - ✓ Edit & delete

---

## ✅ Expected Test Results

### Automated Tests
```
========================================
Security Testing Suite
========================================

Test 1: Empty request rejected... PASS
Test 2: Short text rejected... PASS
Test 3: Missing X-Requested-With rejected... PASS
Test 4: Wrong origin rejected... PASS
Test 5: Localhost URL rejected... PASS
Test 6: Private IP rejected... PASS
Test 7: Untrusted domain rejected... PASS
Test 8: CSP header present... PASS
Test 9: X-Content-Type-Options present... PASS
Test 10: X-Frame-Options present... PASS
Test 11: X-XSS-Protection absent... PASS
Test 12: Rate limiting enforced... PASS (10 requests before limit)

========================================
Test Summary
========================================
Total Tests: 12
Passed: 12
Failed: 0

✓ All tests passed!
```

### Manual Tests
- ✅ Weak password rejected: "Password must be at least 12 characters"
- ✅ Strong password accepted: Account created
- ✅ Job parsing works: Details extracted
- ✅ Kanban board works: Cards move smoothly
- ✅ XSS prevented: Script tags escaped
- ✅ SSRF blocked: localhost rejected

---

## 🐛 Common Issues & Fixes

### "Worker not responding"
```bash
# Check if worker is running
lsof -i :8787

# If not, start it
cd app/workers && bun run dev
```

### "SUPABASE_JWT_SECRET not configured"
```bash
cd app/workers
wrangler secret put SUPABASE_JWT_SECRET
# Get value from: Supabase Dashboard > Settings > API > JWT Secret
```

### "Rate limiting not working"
- Ensure JWT_TOKEN is set
- Check user is authenticated
- Wait 60 seconds between test runs

### "SSRF allows bad domains"
- Check `app/workers/src/utils/ssrf-protection.ts`
- Verify TRUSTED_JOB_DOMAINS includes only job sites

### "Application broken after fixes"
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`
- Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Win)

---

## 📝 Reporting Results

Use the template: `.ai_security_context/test_results_template.md`

**Document:**
- Date and time
- All test results (pass/fail)
- Issues found
- Performance metrics
- Final approval/rejection

---

## ✨ Success Checklist

Before marking testing as complete:

- [ ] All automated tests pass (test-security.sh)
- [ ] All manual security tests pass
- [ ] All core features working
- [ ] No console errors
- [ ] Performance acceptable (< 500ms API)
- [ ] Cross-browser tested
- [ ] Mobile responsive verified
- [ ] Test results documented
- [ ] Issues logged (if any)
- [ ] Sign-off obtained

---

## 🎉 After Testing

### If All Tests Pass ✅
1. Document results in test_results_template.md
2. Get approval sign-off
3. Deploy to production
4. Monitor for 24 hours
5. Schedule next security review (30 days)

### If Tests Fail ❌
1. Document failures in detail
2. Fix critical issues immediately
3. Re-test after fixes
4. Don't deploy until all tests pass

---

## 🔗 Quick Links

- **What was fixed?** → `.ai_security_context/SECURITY_FIXES_COMPLETE.md`
- **How to test?** → `TESTING_QUICKSTART.md`
- **Test strategies?** → `.ai_security_context/TESTING_SUMMARY.md`
- **Detailed tests?** → `.ai_security_context/test_execution_guide.md`
- **Document results?** → `.ai_security_context/test_results_template.md`

---

## 💡 Pro Tips

1. **Use Chrome DevTools extensively**
   - Network tab: Check headers
   - Console: Watch for errors
   - Application: Inspect localStorage

2. **Test in order**
   - Security features first
   - Then functionality
   - Then performance

3. **Document everything**
   - Screenshot failures
   - Copy error messages
   - Note unexpected behavior

4. **Take breaks**
   - Testing is thorough work
   - Don't rush
   - Fresh eyes catch more issues

---

## 🎬 Ready to Start?

```bash
# The fastest path to confidence:
cd /Users/user/Documents/cari-kerja
./quick-test.sh        # Health check
# Register & login
export JWT_TOKEN="..."
./test-security.sh     # Full auto tests
# Test UI features manually
# ✓ Done!
```

**Good luck! May all your tests be green! 🟢**
