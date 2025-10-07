# Implementation Plan
# CV & Cover Letter Generator - Background Processing

**Version:** 1.0
**Last Updated:** October 7, 2025
**Status:** Planning

---

## Executive Summary

**Total Effort:** 5-8 weeks (37-63 story points)
- Phase 1 MVP: 3-4 weeks (37 points)
- Phase 2 Enhanced: 2-3 weeks (26 points)

**Team:** 1 full-stack developer
**Dependencies:** Master profile feature must be deployed first

---

## Table of Contents

1. [Phase 1: MVP](#phase-1-mvp-3-4-weeks)
2. [Phase 2: Enhanced Features](#phase-2-enhanced-features-2-3-weeks)
3. [Sprint Breakdown](#sprint-breakdown)
4. [Risk Mitigation](#risk-mitigation)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Plan](#deployment-plan)
7. [Success Criteria](#success-criteria)

---

## Phase 1: MVP (3-4 weeks)

### Goal
Enable async CV and cover letter generation with PDF output, removing the availability constraint from the current CLI workflow.

### Scope

**In Scope:**
- ✅ Background task queue processing
- ✅ CV markdown generation (single-stage)
- ✅ Cover letter markdown generation
- ✅ LaTeX → PDF compilation (external service)
- ✅ File storage in Supabase
- ✅ Notification system
- ✅ Download from kanban card

**Out of Scope (deferred to Phase 2):**
- ❌ Multi-stage review (optimistic/skeptical/manager)
- ❌ Version comparison UI
- ❌ Bulk generation
- ❌ Custom templates per job

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| CV generation time | < 3 minutes | Worker execution logs |
| Success rate | ≥ 95% | Task completion rate |
| Quality score | ≥ 4/5 | cv-skeptical-reviewer |
| Offline generations | ≥ 30% | Timestamp analysis |
| Applications per month | 20+ | Manual tracking |

---

## Sprint Breakdown

### Sprint 0: Preparation (1 week)

**Goal:** Technical spike and environment setup

**Tasks:**

1. **Deploy Render.com Tectonic Service** (1 day)
   - Create GitHub repo: `latex-compiler-service`
   - Create Dockerfile with tectonic (see LATEX_SERVICE.md)
   - Create Node.js HTTP server (server.js)
   - Deploy to Render.com free tier
   - Test compilation endpoint
   - **Decision:** Render.com + tectonic (FREE, same quality as local)

2. **Environment Setup** (1 day)
   - Create Supabase Storage bucket: `applications`
   - Configure bucket policies (private access)
   - Set up Cloudflare Worker secrets:
     ```bash
     wrangler secret put SUPABASE_SERVICE_ROLE_KEY
     wrangler secret put ANTHROPIC_API_KEY
     wrangler secret put RENDER_LATEX_API_URL
     ```
   - Note Render.com URL: `https://latex-compiler-[your-app].onrender.com`

3. **Prompt Engineering** (2 days)
   - Adapt cv_letsgo.md prompt for single-stage
   - Test with Claude API (5 sample CVs)
   - Validate quality with cv-skeptical-reviewer
   - Document final prompt

4. **Documentation** (1 day)
   - Review PRD, Architecture, User Stories
   - Create development guide
   - Set up project board (GitHub Projects or Jira)

**Exit Criteria:**
- [ ] LaTeX service selected and tested
- [ ] Environment configured
- [ ] Prompt validated (4+/5 quality score)
- [ ] Sprint 1 stories ready

---

### Sprint 1: Task Queue & Basic Generation (2 weeks)

**Goal:** Users can queue CV generation and worker generates markdown

**Stories:**
- US-1.1: Queue CV generation from kanban card (5 points)
- US-1.2: Worker generates CV markdown (8 points)

**Week 1: Frontend Integration**

**Day 1-2: Kanban Card UI (US-1.1 - part 1)**
- Modify `JobCardDetailView.vue`:
  - Add "Generate CV" button
  - Add status indicator (badge)
  - Add loading states
- Create `CVGenerationStatus.vue` component:
  - Display task status (pending/processing/completed)
  - Show progress spinner
  - Show error messages

**Day 3-4: Composable & Task Creation (US-1.1 - part 2)**
- Create `useCVGenerator.ts` composable:
  - `generateCV()` function
  - Task creation logic
  - Status polling (every 5 seconds)
  - Error handling
- Integration with Supabase:
  - Insert task into `processing_queue_tasks`
  - Query task status

**Day 5: Testing & Polish**
- Unit tests for composable
- Integration tests (create task → polling)
- Accessibility review (keyboard navigation)
- Code review

**Week 2: Worker Implementation**

**Day 1-2: Worker Setup (US-1.2 - part 1)**
- Set up worker file structure:
  ```
  app/workers/src/
  ├── tasks/generate-cv.ts
  ├── services/claude-api.ts
  ├── services/supabase-client.ts
  └── utils/markdown-helpers.ts
  ```
- Implement cron trigger (every 30 seconds)
- Implement task polling logic
- Update task status: pending → processing

**Day 3-4: CV Generation (US-1.2 - part 2)**
- Implement `generateCVMarkdown()`:
  - Fetch master profile
  - Fetch job description
  - Call Claude API
  - Validate markdown output
- Store markdown in Supabase Storage
- Update task status: processing → completed

**Day 5: Error Handling & Testing**
- Implement retry logic (up to 3 attempts)
- Handle API errors (rate limits, timeouts)
- Unit tests (mock Claude API)
- Integration tests on staging
- Manual test: create 10 CVs

**Exit Criteria:**
- [ ] Users can trigger CV generation from UI
- [ ] Worker generates markdown successfully
- [ ] Task status updates correctly
- [ ] 95%+ success rate in tests

---

### Sprint 2: PDF Generation & Cover Letters (2 weeks)

**Goal:** Generate PDFs and cover letters, store in Supabase

**Stories:**
- US-1.3: Worker generates cover letter (5 points)
- US-1.4: PDF compilation via external service (8 points)

**Week 1: Cover Letter Generation**

**Day 1-2: Cover Letter Logic (US-1.3)**
- Create `generateCoverLetterMarkdown()`:
  - Adapt cover letter prompt
  - Call Claude API
  - Validate word count (300-350)
  - Store in Supabase Storage
- Update task payload to include `generate_cover_letter` option
- Integration tests

**Day 3-5: LaTeX Conversion (US-1.4 - part 1)**
- Implement `markdownToLaTeX()`:
  - Parse markdown
  - Apply LaTeX template
  - Handle special characters
  - Support bold, italic, lists
- Create LaTeX templates:
  - CV template (from `03_CV_Templates/master_cv.tex`)
  - Cover letter template
- Unit tests for conversion logic

**Week 2: PDF Compilation**

**Day 1-2: Render.com Integration (US-1.4 - part 2)**
- Implement `RenderLaTeX` service:
  - POST LaTeX string to Render.com
  - Receive PDF binary
  - Validate PDF (file size > 10KB)
  - Handle errors (timeout: 60s for free tier)
- Store PDF in Supabase Storage:
  - `cv-generated-docs/{job_id}/final-cv.pdf`
  - `cv-generated-docs/{job_id}/final-cover-letter.pdf`

**Day 3-4: Quality Validation**
- Generate 10 test CVs
- Compare with CLI output (side-by-side)
- Check formatting, page breaks, text selection
- Adjust LaTeX templates as needed

**Day 5: Fallback Mechanism**
- Implement fallback if compilation fails:
  - Store markdown and LaTeX only
  - Update task result with warning
  - User can download LaTeX and compile locally
- Test fallback flow
- Documentation

**Exit Criteria:**
- [ ] Cover letters generated successfully
- [ ] PDFs compile correctly
- [ ] PDF quality approved
- [ ] Fallback mechanism works

---

### Sprint 3: Notifications & Polish (1 week)

**Goal:** Complete MVP with notifications and download functionality

**Stories:**
- US-1.5: Notification system (5 points)
- US-1.6: Download generated CV (3 points)

**Day 1-2: Notification System (US-1.5)**
- Create notification table (if not exists):
  ```sql
  CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID,
    title TEXT,
    message TEXT,
    type TEXT,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- Worker creates notifications on completion/failure
- Frontend notification UI:
  - Bell icon in header
  - Dropdown with notification list
  - Mark as read functionality
- Polling for new notifications (every 30 seconds)

**Day 3: Download Functionality (US-1.6)**
- Add "Download CV" button to kanban card
- Implement signed URL generation:
  ```typescript
  const { data } = await supabase.storage
    .from('applications')
    .createSignedUrl(path, 3600)
  ```
- Download button opens PDF in new tab
- "Download All" button (generates .zip with CV + CL)

**Day 4-5: Testing & Bug Fixes**
- End-to-end testing (full flow):
  1. Trigger generation
  2. Wait for completion
  3. Receive notification
  4. Download PDF
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile testing (iOS, Android)
- Bug fixes and polish

**Exit Criteria:**
- [ ] Notifications received reliably
- [ ] Download works on all browsers
- [ ] Mobile experience is smooth
- [ ] All MVP acceptance criteria met

---

### Sprint 4: MVP Launch (1 week buffer)

**Goal:** Deploy to production and monitor

**Week 1: Deployment & Monitoring**

**Day 1: Staging Deployment**
- Deploy worker to Cloudflare Workers (staging)
- Deploy frontend to Cloudflare Pages (staging)
- Run smoke tests on staging
- Load test: 20 concurrent CV generations

**Day 2: Production Deployment**
- Deploy worker to production
- Deploy frontend to production
- Run smoke tests on production
- Monitor for errors (1 hour observation)

**Day 3-5: Monitoring & Iteration**
- Monitor metrics:
  - Task success rate
  - Generation time
  - API costs
  - Error types
- Fix critical bugs (if any)
- Gather user feedback
- Iterate on UX improvements

**Exit Criteria:**
- [ ] Deployed to production
- [ ] 95%+ success rate over 20 real CVs
- [ ] No critical bugs
- [ ] User satisfied with quality

---

## Phase 2: Enhanced Features (2-3 weeks)

### Sprint 5: Multi-Stage Reviews (2 weeks)

**Goal:** Implement 3-stage review process (optimistic → skeptical → manager)

**Story:**
- US-2.1: Multi-stage review process (13 points)

**Week 1: Task Chaining**
- Design task chaining architecture:
  ```
  Task 1: Generate draft CV
      ↓ On complete, create Task 2
  Task 2: Optimistic review
      ↓ On complete, create Task 3
  Task 3: Skeptical review
      ↓ On complete, create Task 4
  Task 4: Manager synthesis
  ```
- Implement task chaining logic
- Store intermediate versions in Storage

**Week 2: Review Implementations**
- Implement optimistic review:
  - Use cv-optimistic-reviewer prompt
  - Amplify achievements
  - Store: `optimistic-{company}-cv.md`
- Implement skeptical review:
  - Use cv-skeptical-reviewer prompt
  - Temper exaggerations
  - Store: `skeptical-{company}-cv.md`
- Implement manager synthesis:
  - Use cv-reviewer-manager prompt
  - Balance impact + credibility
  - Store: `final-{company}-cv.md`
- Testing: full 4-stage pipeline

**Exit Criteria:**
- [ ] All 4 versions generated successfully
- [ ] Quality matches CLI output
- [ ] Total time < 10 minutes

---

### Sprint 6: Version Management (1 week)

**Goal:** UI for comparing and selecting versions

**Stories:**
- US-2.2: Version comparison UI (8 points)
- US-2.3: Bulk generation (5 points)

**Day 1-3: Version Comparison UI (US-2.2)**
- Create `CVVersionList.vue`:
  - List all versions (draft, optimistic, skeptical, final)
  - Preview button for each
  - Download button for each
- Create `CVVersionComparison.vue`:
  - Modal with 2-column layout
  - Side-by-side markdown rendering
  - Highlight differences
- Mark preferred version (star icon)

**Day 4-5: Bulk Generation (US-2.3)**
- Add checkbox to kanban cards
- "Generate CVs" bulk action button
- Create multiple tasks at once
- Batch progress indicator
- Batch notification when all complete
- Load test: queue 10 jobs simultaneously

**Exit Criteria:**
- [ ] Version comparison works
- [ ] Bulk generation works
- [ ] Phase 2 complete

---

## Risk Mitigation

### Technical Risks

**Risk 1: Render.com Free Tier Limitations**
- **Probability:** Low
- **Impact:** Medium (slower compilation, cold starts)
- **Mitigation:**
  - Accept cold starts (~30s on first request)
  - Use UptimeRobot to keep service warm (ping every 5 min)
  - Upgrade to paid tier ($7/month) if needed
  - Free tier: 750 hrs/month = 24/7 uptime

**Risk 2: Claude API Costs Exceed Budget**
- **Probability:** Low
- **Impact:** Medium
- **Mitigation:**
  - Set budget alerts ($20/month)
  - Monitor cost per CV (target: $0.25)
  - Optimize prompts to reduce tokens
  - Consider caching common sections

**Risk 3: Worker Timeouts (60s limit)**
- **Probability:** Low
- **Impact:** High
- **Mitigation:**
  - Split long tasks into multiple sub-tasks
  - Measure average execution time (target: <3 min)
  - Optimize Claude API calls (parallel where possible)

**Risk 4: PDF Quality Mismatch**
- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Extensive testing (20 sample CVs)
  - Side-by-side comparison with CLI output
  - Refine LaTeX templates iteratively
  - Get user approval before launch

### Product Risks

**Risk 5: Users Prefer CLI**
- **Probability:** Low
- **Impact:** High
- **Mitigation:**
  - Dog food cloud version for 2 weeks
  - Compare quality side-by-side
  - Keep CLI as fallback option
  - Iterate on UX based on feedback

**Risk 6: Feature Complexity Creep**
- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Stick to MVP scope (no enhancements in Phase 1)
  - Defer Phase 2 until MVP proves value
  - Clear communication with stakeholders

---

## Testing Strategy

### Unit Tests

**Coverage Target:** ≥80%

**Components to Test:**
- `useCVGenerator.ts` composable
- Worker task handlers
- Claude API client
- LaTeX conversion utilities
- Supabase client wrappers

**Tools:**
- Vitest for Vue components
- Jest for Node.js code
- Mock Supabase and Claude API

### Integration Tests

**Scenarios:**
1. **Happy Path:**
   - User triggers CV generation
   - Worker processes task
   - PDF generated and stored
   - User downloads PDF

2. **Error Handling:**
   - Claude API rate limit → retry
   - LaTeX compilation fails → fallback to markdown
   - Network timeout → retry with exponential backoff

3. **Concurrent Processing:**
   - Queue 10 tasks simultaneously
   - All complete successfully
   - No race conditions

**Tools:**
- Playwright for E2E tests
- Postman for API testing

### Manual Testing

**Test Matrix:**

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | ✅ | ✅ | |
| Firefox | ✅ | ❌ | |
| Safari | ✅ | ✅ | |
| Edge | ✅ | ❌ | |

**Test Cases:**
1. Generate CV from kanban card
2. Download PDF (opens in new tab)
3. Notification received on completion
4. Error notification on failure
5. Retry after failure
6. Bulk generation (5 jobs)

### Load Testing

**Scenario:** 20 concurrent CV generations

**Tools:** k6 or Artillery

**Metrics to Monitor:**
- Task completion time
- Success rate
- Cloudflare Worker CPU usage
- Supabase database response time
- Storage upload/download speed

---

## Deployment Plan

### Staging Environment

**Components:**
- Cloudflare Workers (staging project)
- Supabase (staging instance)
- Cloudflare Pages (preview branch)

**Deployment Steps:**
1. Deploy worker:
   ```bash
   cd app/workers
   wrangler deploy --env staging
   ```
2. Deploy frontend:
   ```bash
   cd app/frontend
   bun run build
   wrangler pages deploy dist --project-name=cari-kerja-staging
   ```
3. Run smoke tests
4. Load test (20 concurrent requests)

### Production Environment

**Pre-Deployment Checklist:**
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Secrets configured in Cloudflare
- [ ] Storage bucket created in Supabase
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

**Deployment Steps:**
1. Tag release: `git tag v1.0.0-cv-generator`
2. Deploy worker:
   ```bash
   wrangler deploy --env production
   ```
3. Deploy frontend:
   ```bash
   wrangler pages deploy dist --project-name=cari-kerja
   ```
4. Smoke tests on production
5. Monitor for 1 hour (watch error logs)

**Rollback Plan:**
If critical bug found:
1. Revert Cloudflare Pages deployment (1-click rollback)
2. Disable worker cron trigger:
   ```bash
   wrangler crons disable
   ```
3. Fix bug on separate branch
4. Re-deploy after fix validated

---

## Success Criteria

### MVP Launch Criteria

**Go/No-Go Decision: End of Sprint 3**

**GO if ALL criteria met:**
- ✅ CV generation works end-to-end
- ✅ Success rate ≥ 95% over 20 test runs
- ✅ PDF quality matches CLI output
- ✅ Notifications received reliably
- ✅ Download works on Chrome, Safari, Firefox
- ✅ No critical bugs
- ✅ Claude API costs < $10/month

**NO-GO if ANY criteria failed:**
- ❌ Success rate < 90%
- ❌ PDF quality below acceptable (missing formatting, unreadable)
- ❌ Critical bug (data loss, security issue)
- ❌ Cost projection > $20/month

**No-Go Action Plan:**
1. Extend Sprint 3 by 1 week
2. Fix critical issues
3. Re-evaluate success criteria
4. Re-test

### Phase 2 Decision Criteria

**Evaluate after 1 month of MVP usage**

**Proceed to Phase 2 if:**
- ✅ MVP used for 15+ CVs successfully
- ✅ User satisfaction ≥ 4/5
- ✅ Clear need for multi-stage reviews
- ✅ Cost per CV < $0.50

**Skip Phase 2 if:**
- ❌ Single-stage CVs are sufficient
- ❌ No quality issues reported
- ❌ Cost concerns

---

## Timeline Summary

```
Sprint 0: Preparation                [1 week]
Sprint 1: Task Queue & Generation    [2 weeks]
Sprint 2: PDF & Cover Letters        [2 weeks]
Sprint 3: Notifications & Polish     [1 week]
Sprint 4: MVP Launch (buffer)        [1 week]
                                     ─────────
Phase 1 Total                        [7 weeks]

Sprint 5: Multi-Stage Reviews        [2 weeks]
Sprint 6: Version Management         [1 week]
                                     ─────────
Phase 2 Total                        [3 weeks]

                                     ═════════
Grand Total                          [10 weeks]
```

**Critical Path:**
Sprint 0 → Sprint 1 → Sprint 2 → Sprint 3

**Parallel Tracks (if multiple developers):**
- Track 1: Frontend (Sprints 1-3)
- Track 2: Worker (Sprints 1-2)
- Track 3: LaTeX spike (Sprint 0)

**Contingency:**
- +1 week buffer in Sprint 4
- +1 week if LaTeX spike requires Gotenberg setup

---

## Cost Estimation

### Development Cost
- 1 developer × 10 weeks × $80/hour × 40 hours/week = $32,000

### Operational Cost (Monthly)
| Service | Free Tier | Estimated Usage | Cost |
|---------|-----------|-----------------|------|
| Cloudflare Workers | 100k req/day | 60 req/month | $0 |
| Anthropic Claude API | $18 free credit | 20 CVs × $0.25 | $5 |
| Supabase Storage | 1GB free | 40MB/month | $0 |
| Render.com (Tectonic) | 750 hrs/month | 720 hrs (24/7) | $0 |
| **Total** | | | **$5/month** |

### ROI Analysis
- Time saved: 2 hours/week × 52 weeks = 104 hours/year
- Value: 104 hours × $80/hour = $8,320/year
- **ROI:** $8,320 / $32,000 = 26% first year
- Break-even: 4 months

---

## Next Steps

1. ✅ Review implementation plan with team
2. ⏳ Get stakeholder approval
3. ⏳ Assign resources (1 developer)
4. ⏳ Kickoff Sprint 0 (preparation)
5. ⏳ Set up project tracking (GitHub Projects)

---

## Related Documents

- **PRD:** [PRD.md](./PRD.md) - Product requirements
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical design
- **User Stories:** [USER_STORIES.md](./USER_STORIES.md) - Sprint-ready stories
- **README:** [README.md](./README.md) - Feature overview
