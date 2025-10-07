# CV & Cover Letter Generator
# Background Processing Feature

**Status:** 📋 Planning
**Priority:** MEDIUM-HIGH
**Version:** 1.0
**Last Updated:** October 7, 2025

---

## 🎯 What is This?

The CV Generator is a **cloud-based background processing system** that automatically creates tailored CVs and cover letters for job applications. It removes the availability constraint of the current CLI workflow by allowing asynchronous generation via Cloudflare Workers.

**Current Problem:** Users must be present at their computer for 15-30 minutes to generate a CV using `.claude/commands/cv_letsgo.md`

**Solution:** Click "Generate CV" on a kanban card, walk away, and receive a notification when ready to download.

---

## 📊 Business Value

### Primary Goals
1. **Remove availability constraint** - Generate CVs while sleeping or away from computer
2. **Increase application velocity** - From 10-15/month to 20+ applications/month
3. **Save time** - Reclaim 2+ hours per week currently spent babysitting CLI

### Success Metrics
- 30%+ of CVs generated while user offline
- 20+ applications per month
- ≥95% generation success rate
- CV quality matches CLI output (4+/5 score)

---

## 🏗️ Architecture Overview

```
User → Kanban Card → Queue Task → Cloudflare Worker → Generate CV/CL → Store in Supabase → Notify User
```

**Key Components:**
1. **Frontend:** Vue 3 kanban board integration
2. **Task Queue:** Supabase `processing_queue_tasks` table
3. **Worker:** Cloudflare Workers (cron: every 30 seconds)
4. **AI:** Anthropic Claude API for generation
5. **PDF:** Render.com (tectonic) for compilation
6. **Storage:** Supabase Storage (private bucket)

---

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| **[PRD.md](./PRD.md)** | Product requirements, goals, user stories | PM, PO, Stakeholders |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical design, integration points | Engineers, Architects |
| **[USER_STORIES.md](./USER_STORIES.md)** | Sprint-ready stories with DoR/DoD | Scrum team |
| **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** | Sprint breakdown, timeline, risks | Engineers, PM |

---

## 🚀 Quick Start (For Developers)

### Prerequisites
- Master profile feature deployed
- Cloudflare Workers account
- Anthropic API key
- Render.com account (free tier)

### Setup (Sprint 0)

1. **Environment Configuration**
   ```bash
   # Set Cloudflare Worker secrets
   cd app/workers
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put ANTHROPIC_API_KEY
   wrangler secret put LATEX_ONLINE_API_KEY
   ```

2. **Create Supabase Storage Bucket**
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO storage.buckets (id, name, public) VALUES ('applications', 'applications', false);
   ```

3. **Configure Storage Policies**
   ```sql
   -- See ARCHITECTURE.md for full RLS policies
   CREATE POLICY "Users can read own CVs" ON storage.objects FOR SELECT ...
   CREATE POLICY "Service role can write CVs" ON storage.objects FOR INSERT ...
   ```

4. **Install Dependencies**
   ```bash
   cd app/workers
   bun install

   cd app/frontend
   bun install
   ```

### Development Workflow

**Run Worker Locally:**
```bash
cd app/workers
wrangler dev
```

**Trigger Manual Generation (Testing):**
```bash
curl -X POST http://localhost:8787/generate-cv \
  -H "Content-Type: application/json" \
  -d '{"job_id": "uuid", "profile_id": "uuid"}'
```

**Watch Logs:**
```bash
wrangler tail
```

---

## 📋 Implementation Roadmap

### Phase 1: MVP (3-4 weeks)

**Scope:**
- ✅ Background task queue processing
- ✅ CV markdown generation (single-stage)
- ✅ Cover letter markdown generation
- ✅ LaTeX → PDF compilation
- ✅ Notification system
- ✅ Download from kanban card

**Sprint Breakdown:**
| Sprint | Duration | Focus | Stories |
|--------|----------|-------|---------|
| Sprint 0 | 1 week | Technical spike & setup | - |
| Sprint 1 | 2 weeks | Task queue & CV generation | US-1.1, US-1.2 |
| Sprint 2 | 2 weeks | PDF compilation & CL | US-1.3, US-1.4 |
| Sprint 3 | 1 week | Notifications & polish | US-1.5, US-1.6 |

**Total:** 6 weeks (including Sprint 0)

---

### Phase 2: Enhanced (2-3 weeks) - Optional

**Scope:**
- Multi-stage review (optimistic → skeptical → manager)
- Version comparison UI
- Bulk generation

**Decision Point:** Proceed only if MVP proves insufficient after 1 month

---

## 🔧 Technical Stack

### Backend
- **Runtime:** Cloudflare Workers
- **Language:** TypeScript
- **AI:** Anthropic Claude API (claude-3-5-sonnet-20241022)
- **PDF:** Render.com + tectonic (free tier)
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage

### Frontend
- **Framework:** Vue 3 (Composition API)
- **State:** Pinia
- **UI:** Existing kanban board components
- **Polling:** Real-time status updates (every 5 seconds)

---

## 💰 Cost Estimation

### Development
- 1 developer × 6 weeks × $80/hour × 40 hours = **$19,200**

### Operational (Monthly)
| Service | Cost |
|---------|------|
| Cloudflare Workers | $0 (free tier) |
| Claude API | $5 (20 CVs × $0.25) |
| Supabase Storage | $0 (free tier) |
| Render.com (Tectonic) | $0 (750 hrs/month free) |
| **Total** | **$5/month** |

### ROI
- Time saved: 2 hours/week = 104 hours/year
- Value: 104 × $80 = **$8,320/year**
- **Break-even:** 3 months

---

## 📈 Success Criteria

### MVP Launch (Go/No-Go)

**GO Criteria (ALL must be met):**
- ✅ Success rate ≥ 95% over 20 test runs
- ✅ PDF quality matches CLI output
- ✅ Notifications received reliably
- ✅ Download works on all major browsers
- ✅ No critical bugs

**NO-GO Criteria (ANY failed):**
- ❌ Success rate < 90%
- ❌ PDF quality unacceptable
- ❌ Critical bug (data loss, security)

---

## 🎨 User Experience

### Trigger CV Generation
```
1. User opens job card detail view
2. Clicks "Generate CV" button
3. Task queued (2 seconds)
4. User walks away
```

### Background Processing
```
5. Cloudflare Worker picks up task (30 seconds)
6. Fetches master profile data
7. Calls Claude API → CV markdown (1-2 minutes)
8. Calls Render.com (tectonic) → PDF (30-60 seconds)
9. Stores in Supabase Storage
10. Creates notification
```

### Download
```
11. User receives notification "CV Ready"
12. Clicks "Download CV" on kanban card
13. PDF opens in new tab
```

**Total Time:** 3-5 minutes (async, no user presence required)

---

## 🧪 Testing Strategy

### Unit Tests
- Frontend composables (`useCVGenerator`)
- Worker task handlers
- Claude API client
- LaTeX conversion utilities (markdown → LaTeX)

**Coverage Target:** ≥80%

### Integration Tests
- End-to-end generation flow
- Error handling (API failures, timeouts)
- Concurrent processing (10 tasks)

### Manual Testing
- Cross-browser (Chrome, Firefox, Safari)
- Mobile (iOS Safari, Android Chrome)
- Accessibility (keyboard navigation, screen readers)

### Load Testing
- 20 concurrent CV generations
- Monitor success rate, latency, costs

---

## ⚠️ Known Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Render.com cold starts | Low | Low | Use UptimeRobot to keep warm (optional) |
| Claude API costs exceed budget | Low | Medium | Set budget alerts, optimize prompts |
| Worker timeouts (60s limit) | Low | High | Split into sub-tasks if needed |
| PDF quality mismatch | Medium | Medium | Extensive testing, template refinement |

---

## 🔗 Related Features

### Dependencies
- ✅ **Master Profile:** Source of CV data
- ✅ **Kanban Job Tracker:** Trigger point for generation
- ✅ **Processing Queue:** Task management infrastructure

### Future Integrations
- Job Parser: Auto-generate CV when job added
- Application Tracker: Link CV to application status
- Interview Prep: Use CV to generate prep questions

---

## 📞 Getting Help

### During Development
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Check [USER_STORIES.md](./USER_STORIES.md) for acceptance criteria
- Review [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for sprint tasks

### Issues & Questions
- GitHub Issues: Tag with `feature:cv-generator`
- Slack: `#cv-generator-dev` channel
- PM: Product Owner (backlog questions)
- Architect: Technical design questions

---

## 📜 Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-07 | Initial documentation created |

---

## 🎯 Current Status

**Phase:** Planning
**Next Milestone:** Sprint 0 (Technical Spike)
**Blocked By:** None
**Estimated Start:** TBD (after Master Profile stabilizes)

---

## 📝 Notes

### Relationship to CLI Workflow
This feature **does not replace** the CLI workflow (`.claude/commands/cv_letsgo.md`). Both will coexist:

- **Cloud Worker:** For convenience, async generation, batch processing
- **CLI:** For power users, custom tweaking, learning new prompts

Over time, most users will prefer the cloud version, but CLI remains as:
- Fallback if worker has issues
- Advanced mode for experimentation
- Offline capability

### Why Now?
- Infrastructure ready (task queue exists)
- Proven workflow (CLI validates prompt quality)
- Clear ROI (33%+ more applications)
- Job search active (need velocity)

---

**Ready to build? Start with [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) → Sprint 0!** 🚀
