# Enhanced Kanban Card Detail View

**Status:** 📋 Planning Complete | 🚧 Ready for Implementation
**Priority:** P1 (High)
**Timeline:** 3 weeks (Oct 7-27, 2025)
**Parent Feature:** [Kanban Job Application Tracker](../README.md)

---

## 🎯 Overview

Transform kanban cards from simple status indicators to comprehensive job management workspaces with:
- **Full job details** in clickable modal
- **Status-specific fields** for each application stage
- **AI-powered insights** (interview prep + salary analysis)
- **Learning system** (retrospectives on rejections)

---

## 📊 Quick Stats

| Metric | Value |
|--------|-------|
| **New DB Fields** | 10 |
| **New Components** | 7 (1 modal + 6 status fields) |
| **New AI Tasks** | 2 (interview prep + salary analysis) |
| **Migration Number** | 014 |
| **Estimated Hours** | 35-43h over 3 weeks |

---

## 🏗️ Architecture

### Component Hierarchy

```
JobDetailModal.vue
├── JobDetailHeader.vue
├── JobInfoSection.vue
├── MatchAnalysisSection.vue
├── JobDescriptionSection.vue
├── StatusSwitcher.vue
│
└── Status-Specific Components:
    ├── ToSubmitFields.vue
    ├── WaitingForCallFields.vue
    ├── InterviewingFields.vue
    ├── OfferFields.vue
    ├── NotNowFields.vue
    └── AcceptedFields.vue
```

### Database Changes

**Migration 014** adds:
- Interview tracking (phase_total, phase_current, prep_suggestions)
- Offer analysis (salary_amount, currency, benefits, ai_analysis)
- Retrospective (reason, learnings)
- Analytics (status_history)

### AI Integration

Two new worker tasks:
1. **generate_interview_prep** - AI generates 5-7 interview topics
2. **analyze_salary_offer** - AI compares offer to market data

---

## 🚀 Implementation Phases

### Phase 1: MVP (Week 1) ✅
- Database migration 014
- JobDetailModal component
- 6 status-specific field components
- Basic CRUD operations
- Mobile responsive

**Deliverable:** Clickable cards with full details

### Phase 2: AI Integration (Week 2) 🔄
- Interview prep AI worker
- Salary analysis AI worker
- Task polling system
- Display AI results in UI

**Deliverable:** AI-powered insights

### Phase 3: Comments (Week 3) ⏳
- job_comments table
- Tiptap rich text editor
- Comment thread UI
- CRUD operations

**Deliverable:** Rich text comments (optional)

---

## 📝 Status-Specific Fields

### To Submit
- ✓ CV readiness indicator
- ✓ Cover letter readiness
- 🚀 "Apply!" CTA button

### Waiting for Call
- 📅 Submitted X days ago
- 📚 AI interview prep suggestions (checklist)

### Interviewing
- 📊 Phase tracker (e.g., "2/3")
- ▰▰▱ Progress bar

### Offer
- 💰 Salary input + currency dropdown
- 📋 Benefits textarea
- ✨ AI competitiveness analysis
- ✓ Accept / Decline CTAs

### Not Now
- 🔍 Retrospective reason dropdown
- 📝 Learnings textarea
- 💡 Future improvement tracking

### Accepted
- 🎉 Congratulations UI
- 📦 Archive button

---

## 🛠️ Tech Stack

- **Frontend:** Vue 3.5.22, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + RLS)
- **AI:** Claude API (Haiku for cost efficiency)
- **Workers:** Cloudflare Workers (cron processing)
- **Testing:** Vitest, Playwright
- **Deployment:** Cloudflare Pages

---

## 📚 Documentation Index

### Core Documents
1. **[PRD.md](./PRD.md)** - Product Requirements (PM/PO evaluation, user stories)
2. **[DatabaseSchema.md](./DatabaseSchema.md)** - Migration 014 specification
3. **[APISpecification.md](./APISpecification.md)** - API endpoints, RPC functions, worker tasks
4. **[FrontendComponents.md](./FrontendComponents.md)** - Component specs, props, events
5. **[ImplementationPlan.md](./ImplementationPlan.md)** - 3-phase rollout, task breakdown
6. **[TestingStrategy.md](./TestingStrategy.md)** - Unit, integration, E2E tests
7. **[status.md](./status.md)** - Implementation progress tracking

---

## 🎯 Success Criteria

### MVP (Phase 1)
- ✅ Cards are clickable
- ✅ Modal shows full job details
- ✅ All 6 status fields render correctly
- ✅ Edit/delete works
- ✅ Mobile responsive

### AI Integration (Phase 2)
- ✅ Interview prep generates 5-7 topics
- ✅ Salary analysis cites 2+ sources
- ✅ Results in <15 seconds
- ✅ Error handling graceful

### Comments (Phase 3)
- ✅ Bold, italic, color formatting
- ✅ Edit/delete own comments
- ✅ Chronological thread

---

## 🔗 Quick Links

### Development
- **Migration File:** `/app/supabase/migrations/014_add_enhanced_kanban_fields.sql`
- **Components:** `/app/frontend/src/components/JobDetail*.vue`
- **Workers:** `/app/workers/src/tasks/{generate-interview-prep,analyze-salary-offer}.ts`
- **API Client:** `/app/frontend/src/services/kanban-api.ts`

### Testing
- **Unit Tests:** `/app/frontend/src/components/__tests__/`
- **E2E Tests:** `/app/frontend/e2e/job-detail-modal.spec.ts`
- **Run Tests:** `cd app/frontend && bun test`

---

## 🚦 Getting Started

### For Developers

1. **Read the PRD**
   ```bash
   open app/docs/features/kanban_job_tracker/kanban_card/PRD.md
   ```

2. **Review Database Schema**
   ```bash
   open app/docs/features/kanban_job_tracker/kanban_card/DatabaseSchema.md
   ```

3. **Check Implementation Plan**
   ```bash
   open app/docs/features/kanban_job_tracker/kanban_card/ImplementationPlan.md
   ```

4. **Run Migration Locally**
   ```bash
   cd app/supabase
   supabase db reset
   ```

5. **Start Frontend Dev Server**
   ```bash
   cd app/frontend
   bun run dev
   ```

### For QA

1. **Review Test Strategy**
   ```bash
   open app/docs/features/kanban_job_tracker/kanban_card/TestingStrategy.md
   ```

2. **Run Unit Tests**
   ```bash
   cd app/frontend
   bun test
   ```

3. **Run E2E Tests**
   ```bash
   bunx playwright test
   ```

---

## 💡 Key Decisions

### Why JSONB for AI Data?
- Flexible schema for AI response formats
- No migration needed when AI output changes
- Fast queries with GIN indexes

### Why No Real-time for Comments?
- Single-user system, no collaboration needed
- Optimistic UI updates provide instant feedback
- Saves complexity and cost

### Why Claude Haiku for AI?
- Cost-efficient (~$0.0002 per request)
- Fast response (<10s typically)
- Good quality for this use case

### Why Phased Rollout?
- MVP delivers value immediately (week 1)
- AI can be refined based on real usage (week 2)
- Comments optional, can defer if needed (week 3)

---

## 🐛 Known Issues / Limitations

### Current Limitations
- No multi-user support (single-user system)
- AI insights require internet (no offline mode)
- Comments limited to basic formatting (no images/attachments)
- No email notifications (manual check only)

### Future Enhancements
- Retrospective analytics dashboard
- Custom status workflows
- Bulk operations
- Email integration
- Interview scheduling sync

---

## 📞 Support & Contact

### Questions About...

**Product/Features:**
- See [PRD.md](./PRD.md)
- Contact: Product Manager

**Technical Implementation:**
- See [ImplementationPlan.md](./ImplementationPlan.md)
- Contact: Tech Lead

**Database/API:**
- See [DatabaseSchema.md](./DatabaseSchema.md) or [APISpecification.md](./APISpecification.md)
- Contact: Backend Engineer

**Frontend/UI:**
- See [FrontendComponents.md](./FrontendComponents.md)
- Contact: Frontend Engineer

**Testing/QA:**
- See [TestingStrategy.md](./TestingStrategy.md)
- Contact: QA Engineer

---

## 📈 Progress Tracking

Track implementation progress in [status.md](./status.md)

**Last Updated:** October 6, 2025
