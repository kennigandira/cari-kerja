# Decision Log - CV Upload & Extraction Feature

**Purpose:** Record all major decisions made during feature planning
**Date Range:** October 6, 2025
**Decision Makers:** Product Owner, Product Manager, Software Architect

---

## Decision 1: DEFER TO PHASE 3

**ID:** DEC-001
**Date:** October 6, 2025
**Status:** ✅ **APPROVED**
**Type:** Strategic - Feature Prioritization

### Context

CV Upload & Extraction feature proposed to reduce profile creation time from 30 minutes (manual entry) to <5 minutes (upload + review).

**Complexity:** 30-35 hours implementation
**ROI (Solo User):** 20 minutes saved one-time vs weeks of development = **Negative ROI**

### Decision

**DEFER implementation to Phase 3** (after master profile MVP launched and validated)

**Build ONLY if these conditions met:**
1. ✅ Master profile MVP launched
2. ✅ Users actively creating profiles (10+ profiles created)
3. ✅ User feedback explicitly requests CV upload
4. ✅ P0 blockers resolved (CB-1, CB-2, CB-3, CB-9) ← **COMPLETE as of Oct 6**

### Rationale

**Product Owner Perspective:**
- 4-5 week timeline too long before validating core workflow
- Sprint 0 spike required before committing (adds 1 week)
- 22 story points (MVP) + 8 points (post-MVP) = significant effort
- Risk: AI accuracy <80% could invalidate entire feature

**Product Manager Perspective:**
- ROI negative for solo user: $3,000 dev cost vs $33 time savings
- This is an "activation barrier reducer" not a time-saver
- Strategic value exists but only for future scenarios (multiple profiles, team use)
- Recommendation: Build only if excited about AI learning opportunity

**Software Architect Perspective:**
- 20-30 hours complexity vs 15-20 hours for entire master profile MVP
- Introduces 8+ new architectural problems:
  - File upload/storage infrastructure
  - AI API integration and cost management
  - Async job processing and status tracking
  - Complex state management for multi-step flow
  - Security for uploaded files
  - Recovery patterns for partial failures
- Should validate core workflow before adding complexity
- **Key principle:** "Complexity should follow demand, not precede it"

### Alternatives Considered

**Alternative 1:** Build simplified version (upload only, no AI)
- **Rejected:** Still 10+ hours without core value (extraction)

**Alternative 2:** Build now, launch with master profile MVP
- **Rejected:** Doubles MVP complexity, delays launch

**Alternative 3:** Build AI extraction client-side (no backend)
- **Rejected:** Critical security risk (API key exposed)

**Alternative 4:** Don't build, don't document
- **Rejected:** Valuable to preserve specialist insights for future

### Participants

- **Product Owner:** Recommends spike first, then decide
- **Product Manager:** Recommends defer unless strategic value clear
- **Software Architect:** Strongly recommends defer to Phase 3
- **Consensus:** DEFER ✅

### Impact

- ✅ Master profile MVP can launch faster (no 30-hour detour)
- ✅ Core workflow validated before AI complexity added
- ✅ Documentation preserved for future reference
- ⚠️ Users still face 30-minute manual entry (acceptable for MVP)

### Next Review

**When:** After master profile MVP launch + 1 month of usage

**Criteria to Revisit:**
- User feedback explicitly requests CV upload
- Creating multiple profiles becomes common
- 30-minute manual entry proves to be real friction point

---

## Decision 2: Architecture - Async Job Queue

**ID:** DEC-002
**Date:** October 6, 2025
**Status:** ✅ **APPROVED** (conditional on DEC-001 reversal)
**Type:** Technical - System Architecture

### Context

If CV extraction is built, need to choose processing architecture.

**Constraint:** AI extraction takes 10-28 seconds (too long for synchronous request)

### Decision

**Use async job queue pattern (Option D)** with background worker processing.

**Architecture:**
```
Browser → Upload API (instant) → Job Queue → Worker → AI API
                ↓                                       ↓
          Return task_id                     Update task status
                                                        ↓
         Frontend ← Poll every 2s ← Database ← Results
```

### Rationale

**Compared Alternatives:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| Client-side AI | Simple | Security risk (API key exposed) | ❌ Rejected |
| Cloudflare Worker | Auto-scaling | New infrastructure, timeout | ⚠️ Feasible |
| Supabase Edge Func | Fits stack | Timeout issues | 🟡 Second choice |
| **Async Job Queue** | **Proper pattern** | **Higher complexity** | ✅ **Chosen** |

**Why Async Job Queue:**
1. **No timeout issues:** Worker can take 60+ seconds
2. **Better UX:** Upload returns instantly, user not blocked
3. **Retry logic:** Failed extractions auto-retry
4. **Scalable:** Can process 100s of CVs concurrently
5. **Testable:** Extraction logic decoupled from upload

**Trade-offs Accepted:**
- Higher implementation complexity (20-30 hours vs 10-14 hours)
- Polling overhead (frontend polls every 2 seconds)
- More failure modes (queue, worker, polling)

### Alternatives Considered

**Synchronous Edge Function:**
- Simpler (10-14 hours implementation)
- Risk: Timeout for large CVs (10+ pages)
- Would need to split into chunks (complexity returns)

**Cloudflare Durable Objects:**
- Most robust (built-in state management)
- Requires Cloudflare Workers infrastructure (don't have it)
- Overkill for this use case

### Participants

- **Software Architect:** Strongly recommends async pattern
- **Product Owner:** Concerned about 20-30 hour estimate
- **Consensus:** Async is proper architecture if building

### Impact

- Effort: 20-30 hours (vs 10-14 synchronous)
- Quality: Reliable, scalable, proper pattern
- Maintenance: More complex but less brittle

---

## Decision 3: AI Provider - Claude 3.5 Sonnet

**ID:** DEC-003
**Date:** October 6, 2025
**Status:** ✅ **RECOMMENDED** (pending spike validation)
**Type:** Technical - Vendor Selection

### Context

Need AI model capable of extracting structured data from CV documents.

### Decision

**Use Anthropic Claude 3.5 Sonnet** for CV extraction

**Model:** claude-3-5-sonnet-20241022
**API:** Anthropic Messages API
**Cost:** $3 input / $15 output per million tokens

### Rationale

**Strengths:**
- ✅ **Best document understanding:** Designed for document analysis
- ✅ **Structured output:** Native JSON output support
- ✅ **Context window:** 200K tokens (can handle long CVs)
- ✅ **Accuracy:** Expected >85% based on benchmarks

**Cost Analysis:**
- Typical CV: ~2,000 input tokens, ~500 output tokens
- Cost per extraction: ~$0.02-0.05
- Monthly (1 user): $0.10
- Monthly (1,000 users × 5 uploads): $250

### Alternatives Considered

**OpenAI GPT-4:**
- Similar capability and cost
- Slightly better at code understanding
- Slightly worse at document structure
- **Verdict:** Equal choice, went with Claude for document focus

**Claude 3 Haiku:**
- 80% cheaper ($0.25/$1.25 per million tokens)
- Lower accuracy (estimated 70-75%)
- **Verdict:** Cost savings not worth accuracy loss for MVP

**Local Model (Llama, Mistral):**
- Zero API costs
- Requires hosting (Cloudflare AI, own server)
- Lower accuracy (60-70% estimated)
- **Verdict:** Not suitable for production quality

### Validation Required

**Sprint 0 Spike Must Confirm:**
- [ ] Extraction accuracy >80% on test dataset
- [ ] Extraction time <30 seconds (95th percentile)
- [ ] Cost per extraction <$0.15
- [ ] Claude handles PDF/DOCX formats well

**If spike FAILS:** Consider OpenAI GPT-4 as fallback

### Participants

- **Software Architect:** Recommends Claude for document parsing
- **Product Manager:** Concerned about cost at scale ($250/month)
- **Consensus:** Claude for MVP, optimize costs in Phase 4

### Impact

- Cost: $0.10/month (solo) to $250/month (1,000 users)
- Quality: Expected >85% extraction accuracy
- Maintenance: Simple API integration, easy to replace if needed

---

## Decision 4: Phased Approach Mandatory

**ID:** DEC-004
**Date:** October 6, 2025
**Status:** ✅ **MANDATORY** (if proceeding with build)
**Type:** Strategic - Risk Mitigation

### Context

CV extraction is high-complexity feature with uncertain user demand.

### Decision

**MUST implement in 3 phases** (cannot skip phases)

**Phase 3.1:** File upload only (8 hours)
**Decision Point:** Does upload provide value?

**Phase 3.2:** Manual reference (4 hours)
**Decision Point:** Do users want auto-extraction?

**Phase 3.3:** AI extraction (18 hours)
**Decision Point:** Launch or iterate?

### Rationale

**Why Mandatory Phasing:**

1. **Risk Mitigation:** Validate each step before investing more
   - If Phase 3.1 shows low upload rate → Stop (saved 22 hours)
   - If Phase 3.2 shows users happy manually copying → Stop (saved 18 hours)

2. **Learn from User Behavior:** Observe actual usage, not assumptions
   - Do users actually upload CVs?
   - Do they complete profiles after upload?
   - Is manual reference sufficient?

3. **Cost Control:** Avoid building AI if upload alone provides value
   - Phase 3.1 cost: ~$0 (just storage)
   - Phase 3.2 cost: ~$0 (no AI)
   - Phase 3.3 cost: $150-250/month (AI)

4. **Flexibility:** Can pivot based on findings
   - Example: Users upload CVs but want different extraction (OCR for scanned PDFs)
   - Example: Users upload but don't want AI (privacy concerns)

### Alternatives Considered

**Build Everything at Once:**
- Risk: Waste 30 hours if feature not used
- Can't pivot based on learnings
- **Rejected**

**Skip to Phase 3.3 Directly:**
- Saves planning time (2 weeks)
- Loses validation opportunities
- Higher risk of failure
- **Rejected**

### Participants

- **All Specialists:** Unanimous agreement
- Phasing is industry best practice for high-risk features

### Impact

- Timeline: Slower (4-5 weeks vs 3 weeks all-at-once)
- Risk: Lower (can stop early if invalidated)
- Learning: Higher (understand user behavior at each step)

### Success Criteria (Phase Progression)

**Phase 3.1 → 3.2:** If >50% of profile creations include upload
**Phase 3.2 → 3.3:** If >70% of users request auto-extraction
**Phase 3.3 → Launch:** If extraction accuracy >85% and success rate >90%

---

## Decision 5: Support PDF and DOCX Only

**ID:** DEC-005
**Date:** October 6, 2025
**Status:** ✅ **APPROVED**
**Type:** Technical - Scope Definition

### Context

Users may have CVs in various formats: PDF, DOCX, DOC, TXT, RTF, ODT.

### Decision

**MVP supports PDF and DOCX only**

### Rationale

**Coverage:**
- PDF + DOCX = 95%+ of modern CVs
- DOC (old Word format) = 3-4%
- TXT/RTF/ODT = <2%

**Complexity:**
- PDF: Well-supported libraries (pdf-parse)
- DOCX: Well-supported (mammoth.js)
- DOC: Requires separate parser (complex)
- TXT: Trivial but low value (no formatting)
- RTF: Rare format, complex parser

**Quality:**
- PDF/DOCX: Best extraction reliability
- Other formats: Lower quality, more edge cases

### Future Consideration

**Phase 4 (if users request):**
- Add DOC support (estimated 3 hours)
- Add TXT support (estimated 1 hour)
- Keep RTF/ODT out of scope (too rare)

### Participants

- **Software Architect:** Recommends PDF/DOCX only
- **Product Owner:** Agrees, minimize scope
- **Consensus:** Approved

---

## Decision 6: 10MB File Size Limit

**ID:** DEC-006
**Date:** October 6, 2025
**Status:** ✅ **APPROVED**
**Type:** Technical - Constraint Definition

### Context

Need to balance user convenience with storage/processing costs.

### Decision

**Maximum CV file size: 10MB**

### Rationale

**User Coverage:**
- Text-based PDF (2 pages): 100-500KB
- Image-heavy PDF (2 pages): 1-5MB
- Detailed 10-page CV: <10MB
- **Coverage:** 99%+ of CVs are <10MB

**Technical:**
- Supabase Storage: No issues with 10MB files
- Upload time: 3-8 seconds on decent connection (acceptable)
- Processing: 10MB PDF = 10-15 seconds extraction time

**Cost:**
- Storage: $0.021/GB/month = $0.0002/file/month (negligible)
- API: 10MB PDF ≈ 5,000 tokens input = $0.015 cost

**Security:**
- Limits abuse: Prevents users uploading 100MB files
- Reduces malware risk: Smaller files = less attack surface

### Alternatives Considered

**5MB Limit:**
- Covers 95% of CVs
- Risk: Rejects some legitimate long CVs
- **Rejected:** Too restrictive

**50MB Limit:**
- Covers 99.9% of CVs
- Risk: Storage costs, processing time
- **Rejected:** Unnecessary for MVP

### Participants

- **Software Architect:** Recommends 10MB
- **Product Owner:** Agrees
- **Consensus:** Approved

---

## Decision 7: Rate Limiting - 5 Uploads Per Hour

**ID:** DEC-007
**Date:** October 6, 2025
**Status:** ✅ **APPROVED**
**Type:** Security - Abuse Prevention

### Context

Need to prevent:
- Accidental API cost overruns
- Malicious abuse (uploading 1000s of files)
- Server overload

### Decision

**Rate limit: 5 uploads per user per hour** (rolling window)

### Rationale

**Usage Pattern:**
- Solo user: Typically uploads 1-2 CVs when creating profiles
- Power user: Might upload 3-5 while experimenting
- Malicious: Would try 100+ uploads

**Limit Justification:**
- 5 uploads = enough for legitimate use
- 5 uploads = limits abuse to $0.25/hour ($6/day max)
- 1-hour window = resets quickly for legitimate users

**Cost Protection:**
- Max daily cost: $6 (if someone hits limit all day)
- Realistic abuse: $0.25-0.50 before user gives up
- Anthropic budget alert at $50/month catches this

### Alternatives Considered

**3 Uploads Per Hour:**
- More restrictive
- Might frustrate users testing feature
- **Rejected:** Too strict for MVP

**10 Uploads Per Hour:**
- More permissive
- Higher abuse risk ($1/hour = $24/day)
- **Rejected:** Too lenient

**No Limit:**
- Simplest
- Risk: Cost overrun ($100+ in one day possible)
- **Rejected:** Unacceptable security risk

### Participants

- **Software Architect:** Recommends 5/hour
- **Product Manager:** Concerned about costs, approves limit
- **Consensus:** Approved

### Monitoring

```sql
-- Daily rate limit violations
SELECT COUNT(*) FROM cv_upload_rate_limits
WHERE upload_count >= 5
  AND window_start > NOW() - INTERVAL '1 day';
```

If violations >10/day → Consider reducing limit to 3/hour

---

## Decision 8: Data Retention - 30 Days

**ID:** DEC-008
**Date:** October 6, 2025
**Status:** ✅ **APPROVED**
**Type:** Privacy - Data Retention Policy

### Context

Uploaded CVs contain PII. Need retention policy for GDPR compliance.

### Decision

**Delete uploaded CV files after 30 days** (soft delete)
**Hard delete after 90 days** (if not linked to profile)

**If profile created:** Keep CV until profile deleted
**If profile NOT created:** Delete CV after 30 days

### Rationale

**User Benefit:**
- 30-day recovery window (accidental deletion)
- Access to original CV for reference

**Privacy:**
- Limits PII exposure duration
- Complies with data minimization principle

**Cost:**
- Storage: Minimal ($0.021/GB/month)
- Most CVs <5MB, deleted within 30 days

### Alternatives Considered

**7-Day Deletion:**
- More aggressive privacy
- Risk: User might want to reference after 1 week
- **Rejected:** Too short for good UX

**Indefinite Storage:**
- User always has CV available
- Risk: Accumulating PII, GDPR issues
- **Rejected:** Privacy concerns

**Immediate Deletion After Extraction:**
- Maximum privacy
- Risk: Cannot retry extraction if failed
- **Rejected:** Poor UX for errors

### Participants

- **Product Manager:** Recommends 30 days
- **Software Architect:** Agrees, standard practice
- **Consensus:** Approved

### Implementation

```sql
-- Automated cleanup (runs daily)
SELECT cron.schedule(
  'cleanup-cv-uploads',
  '0 2 * * *',
  $$SELECT cleanup_old_cv_data()$$
);
```

---

## Decision 9: No Malware Scanning in MVP

**ID:** DEC-009
**Date:** October 6, 2025
**Status:** ⚠️ **APPROVED WITH CONDITIONS**
**Type:** Security - Risk Acceptance

### Context

PDF/DOCX files can contain malware. Should we scan uploads?

### Decision

**Skip malware scanning for MVP**

**Conditions:**
1. Limit uploads to authenticated users only (no anonymous)
2. Implement file validation (MIME type + magic number)
3. Daily manual audit of uploaded files
4. Add malware scanning in Phase 4 if user base >100

### Rationale

**Why Skip:**
- **Cost:** VirusTotal API = $50/month after 500 scans
- **Complexity:** ClamAV requires separate service (10+ hours setup)
- **Low Risk:** Authenticated users only, private storage
- **Solo User:** Risk minimal for single-user project

**Mitigations:**
- MIME type + magic number validation (prevents obvious fakes)
- RLS policies prevent file sharing between users
- Files auto-deleted after 30 days (limits exposure)
- Manual audit once/week for suspicious files

**Risk Accepted:** Malware could be uploaded to user's own Storage
**Impact:** Limited to user's own account (isolated)

### Alternatives Considered

**VirusTotal API:**
- Pros: Industry-standard, accurate
- Cons: $50/month cost, 500 req/day limit
- **Deferred to Phase 4** (if scaling)

**ClamAV Open Source:**
- Pros: Free, comprehensive
- Cons: Requires separate service, 10+ hours setup
- **Deferred to Phase 4**

**AWS S3 Malware Scanning:**
- Pros: Managed service
- Cons: Requires AWS migration (not applicable)
- **Rejected**

### Participants

- **Software Architect:** Acceptable risk for MVP
- **Product Manager:** Prefers lower costs for solo use
- **Consensus:** Skip for MVP, add if scaling

### Review Trigger

**Add malware scanning if:**
- User base exceeds 100 active users
- Any malware incident reported
- Enterprise customers require it

---

## Decision 10: Polling Over WebSockets

**ID:** DEC-010
**Date:** October 6, 2025
**Status:** ✅ **APPROVED**
**Type:** Technical - Status Update Mechanism

### Context

Frontend needs to know when background extraction completes.

**Options:**
1. Polling (check status every 2 seconds)
2. WebSockets (Supabase Realtime)
3. Webhooks (server-to-client callback)

### Decision

**Use polling** (frontend queries task status every 2 seconds)

### Rationale

**Polling Pros:**
- ✅ Simple implementation (10 lines of code)
- ✅ No WebSocket complexity
- ✅ Works with existing Supabase setup
- ✅ Easy to debug and test

**Polling Cons:**
- ⚠️ Network overhead (30 requests for 60s extraction)
- ⚠️ Battery drain on mobile
- ⚠️ Slight delay (up to 2s) before showing results

**Why Not WebSockets:**
- Supabase Realtime adds complexity (connection management, reconnection logic)
- Overkill for ~30 second operation
- Only marginal UX improvement (saves <2s)

**Why Not Webhooks:**
- Requires client to expose endpoint (impossible for browser)
- Server-to-server only (not applicable)

### Alternatives Considered

**Exponential Backoff Polling:**
- Poll at 1s, then 2s, then 4s, then 8s...
- Reduces requests (better for battery)
- Slower UX (user waits longer)
- **Considered for Phase 4 optimization**

**Supabase Realtime:**
- Zero latency (instant updates)
- WebSocket overhead and complexity
- **Deferred to v2** (if user feedback demands it)

### Participants

- **Software Architect:** Recommends polling for MVP simplicity
- **Product Owner:** Agrees, optimize later if needed
- **Consensus:** Approved

### Impact

- Effort: 2 hours (vs 6 hours for Realtime)
- Network: ~30 requests per extraction (acceptable)
- UX: <2s delay (acceptable)

### Optimization Plan (Future)

If battery/network concerns arise:
1. Exponential backoff (1s → 2s → 4s → 8s)
2. Supabase Realtime (instant updates)
3. Server-sent events (SSE)

---

## Future Decisions Needed

### When Spike Completes (Sprint 0)

**DEC-011:** Final AI model selection (Claude vs OpenAI)
**DEC-012:** Extraction prompt template approval
**DEC-013:** Error handling strategy (retry counts, fallbacks)
**DEC-014:** Go/No-Go on full feature build

### When Phase 3.1 Completes

**DEC-015:** Proceed to Phase 3.2? (Based on upload rate)
**DEC-016:** Storage retention finalized (30 days confirmed?)

### When Phase 3.2 Completes

**DEC-017:** Proceed to Phase 3.3? (Based on user demand)
**DEC-018:** Budget approval for AI costs ($150-250/month at scale)

### When Phase 3.3 Completes

**DEC-019:** Launch to production? (Based on quality metrics)
**DEC-020:** Marketing/announcement strategy

---

## Decision Summary Table

| ID | Decision | Status | Impact | Reversible |
|----|----------|--------|--------|------------|
| DEC-001 | Defer to Phase 3 | ✅ Approved | High - Changes roadmap | Yes |
| DEC-002 | Async job queue architecture | ✅ Approved | High - 20-30h effort | No (if built) |
| DEC-003 | Claude 3.5 Sonnet | ✅ Recommended | Medium - $250/mo at scale | Yes (easy to swap) |
| DEC-004 | Phased approach mandatory | ✅ Approved | High - 4-5 week timeline | No |
| DEC-005 | PDF + DOCX only | ✅ Approved | Medium - Limits formats | Yes (can add more) |
| DEC-006 | 10MB file limit | ✅ Approved | Low - Affects <1% users | Yes (configurable) |
| DEC-007 | 5 uploads/hour limit | ✅ Approved | Low - Prevents abuse | Yes (configurable) |
| DEC-008 | 30-day retention | ✅ Approved | Medium - Privacy/cost | Yes (configurable) |
| DEC-009 | No malware scan (MVP) | ⚠️ Approved | High - Security risk | Yes (add later) |
| DEC-010 | Polling over WebSockets | ✅ Approved | Low - UX trade-off | Yes (can optimize) |

---

**Last Updated:** October 6, 2025
**Next Decision Review:** After master profile MVP launch
**Open Decisions:** 10 future decisions pending (see list above)
