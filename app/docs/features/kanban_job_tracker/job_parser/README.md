# AI-Powered Job Parser - Documentation Index

**Feature:** AI-Powered Job Parser with URL Scraping & Manual Fallback
**Status:** Approved - Ready for Implementation
**Version:** 1.0
**Priority:** P0 (Critical - Blocking feature for product-market fit)

---

## 📚 Documentation Overview

This folder contains all documentation for the AI-Powered Job Parser feature, which automates job post extraction from URLs or manual paste.

---

## Documents by Audience

### For Product Managers
- **[PRD.md](./PRD.md)** - Product Requirements Document
  - PM/PO collaborative evaluation (strategic fit, business value, user impact)
  - Feature request analysis (Add Job Target button with AI parsing)
  - Success metrics (95%+ automated extraction, <30s time to add job)
  - Decision: ✅ Approved - P0 Critical Priority

### For Architects & Tech Leads
- **[TechnicalArchitecture.md](./TechnicalArchitecture.md)** - System Architecture
  - Jina AI Reader for URL scraping (handles JS-heavy sites)
  - Claude Sonnet 4.5 for structured extraction (~$0.014/job)
  - Edge Function architecture (Deno runtime)
  - Cost analysis and model comparison (Haiku vs Sonnet 4.5)

### For Frontend Engineers
- **[FrontendComponents.md](./FrontendComponents.md)** - Component Specifications
  - JobParserModal.vue component (dropdown + conditional inputs)
  - Two-step flow: Parse → Preview → Confirm
  - Loading states, error handling, validation
  - Integration with KanbanBoard.vue

### For Backend Engineers
- **[DatabaseSchema.md](./DatabaseSchema.md)** - Database Schema
  - Migration 023: Add parsing metadata fields
  - New columns: parsing_source, parsing_confidence, parsing_model, raw_content
  - Index strategy for analytics

- **[APISpecification.md](./APISpecification.md)** - API Specifications
  - Edge Function: parse-job-post
  - Input: {url?, text?}
  - Output: Parsed job JSON with confidence score
  - Error handling and fallback strategy

### For All Engineers
- **[ImplementationPlan.md](./ImplementationPlan.md)** - Implementation Plan
  - 6-day sprint breakdown (Oct 7-12)
  - Phase 1: Database + Edge Function (Oct 7)
  - Phase 2: Frontend modal (Oct 8)
  - Phase 3: Integration (Oct 9)
  - Phase 4: Testing + Docs (Oct 10-12)

### For QA Engineers
- **[TestingStrategy.md](./TestingStrategy.md)** - Testing Strategy
  - Test with 20 real job URLs (LinkedIn, Indeed, company sites)
  - Success rate targets: 85%+ Jina AI, 95%+ total
  - Confidence score validation
  - Performance benchmarks (<5s end-to-end)

---

## Quick Start for Developers

### 1. Understand the Feature

**What:** "Add Job Target" button on kanban board that parses job URLs or manual paste.

**Why:** Currently, adding jobs requires manual data entry (5+ minutes). This automates extraction to <30 seconds.

**How:**
1. User pastes job URL or description
2. Jina AI Reader fetches clean markdown (if URL)
3. Claude Sonnet 4.5 extracts structured JSON
4. User previews and confirms parsed data
5. Job inserted into database + kanban card created

**Read in this order:**
1. **PRD** (understand business value and user stories)
2. **TechnicalArchitecture** (understand system design)
3. **ImplementationPlan** (understand tasks and timeline)

### 2. Backend Development

**Prerequisites:**
- Supabase CLI installed
- Anthropic API key in `.env`

**First Tasks:**
```bash
# 1. Create database migration
cd app/supabase/migrations
# See DatabaseSchema.md for migration SQL

# 2. Create Edge Function
cd ../functions
mkdir parse-job-post
# See APISpecification.md for implementation

# 3. Test locally
supabase functions serve parse-job-post
```

### 3. Frontend Development

**Prerequisites:**
- Vue 3 project setup
- Existing KanbanBoard.vue component

**First Tasks:**
```bash
cd app/frontend

# 1. Create modal component
mkdir -p src/components
# See FrontendComponents.md for JobParserModal.vue spec

# 2. Add button to KanbanBoard
# Update KanbanBoard.vue header with "Add Job Target" button

# 3. Test integration
npm run dev
```

### 4. Before Merging

**Checklist:**
- [ ] Database migration tested locally
- [ ] Edge Function deployed and tested with 5 sample URLs
- [ ] Frontend modal tested with URL + paste flows
- [ ] Error handling tested (invalid URL, low confidence)
- [ ] 20 real job URLs tested (see TestingStrategy.md)
- [ ] Success rate ≥95% documented
- [ ] Documentation updated

---

## Feature Summary

### Business Context

**Problem:** Manual job entry is slow (5+ minutes) and error-prone. Users need to track 20-50+ applications efficiently.

**Solution:** Automated job parsing from URLs or manual paste with AI-powered extraction.

**Impact:**
- ✅ Time to add job: 5 min → <30 sec (90% reduction)
- ✅ Data quality: AI extracts company, position, description, salary
- ✅ Match analysis: Auto-calculates fit vs master profile
- ✅ Competitive parity: Huntr/Teal have this, now we do too

**Decision:** P0 Critical - Build immediately (Oct 7-12)

---

## Technical Stack

**AI:**
- **Jina AI Reader** - Free, handles JavaScript-heavy sites, returns clean markdown
- **Claude Sonnet 4.5** - $0.014/job, superior accuracy for Bangkok/Thailand job posts
- **Cost:** ~$1.40/month for 100 jobs (negligible)

**Backend:**
- **Supabase Edge Functions** (Deno runtime)
- **PostgreSQL** (jobs table with parsing metadata)

**Frontend:**
- **Vue 3 Composition API**
- **TypeScript**
- **Tailwind CSS**

**Deployment:**
- **Supabase Cloud** (Edge Functions + Database)
- **Cloudflare Pages** (Frontend)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend: KanbanBoard.vue                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [+ Add Job Target] Button                            │  │
│  │  → Opens JobParserModal.vue                          │  │
│  │     ├─ Dropdown: [URL | Paste Description]           │  │
│  │     ├─ Input (URL) or Textarea (Description)         │  │
│  │     └─ Submit → Parse → Preview → Confirm           │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Edge Function: parse-job-post                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ If URL:                                              │  │
│  │   1. Fetch via Jina AI Reader                       │  │
│  │      GET https://r.jina.ai/{url}                    │  │
│  │   2. Get clean markdown                             │  │
│  │                                                      │  │
│  │ If text:                                             │  │
│  │   1. Use text directly                              │  │
│  │                                                      │  │
│  │ Then:                                                │  │
│  │   3. Send to Claude Sonnet 4.5                      │  │
│  │   4. Extract structured JSON                        │  │
│  │   5. Validate (company + position required)         │  │
│  │   6. Return with confidence score                   │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Database: jobs table                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Existing: company_name, position_title, description  │  │
│  │ New: parsing_source, parsing_confidence,            │  │
│  │      parsing_model, raw_content                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Automated Extraction Rate | ≥95% | 20 test URLs |
| Time to Add Job | <30s | Manual timing |
| Parsing Confidence | ≥80% avg | Database analytics |
| User Adoption | >90% use parser vs manual | Usage tracking |
| Data Quality | 100% company+position | Validation logic |

---

## Critical Path

**Week 1 (Oct 7-12):**

| Day | Phase | Deliverable |
|-----|-------|-------------|
| Oct 7 AM | Database | Migration 023 deployed |
| Oct 7 PM | Backend | Edge Function deployed + tested |
| Oct 8 | Frontend | JobParserModal.vue implemented |
| Oct 9 | Integration | Button added to KanbanBoard |
| Oct 10-11 | Testing | 20 URLs tested, success rate measured |
| Oct 12 | Docs | User guide + testing results |

**Total Effort:** 6 days, ~24 hours

---

## Decision Log

| ID | Decision | Rationale | Status |
|----|----------|-----------|--------|
| AD-001 | Use Jina AI Reader vs direct fetch | Handles JS sites, free, reliable | ✅ Approved |
| AD-002 | Use Sonnet 4.5 vs Haiku | $1.40/mo cost negligible, superior accuracy | ✅ Approved |
| AD-003 | Manual paste as first-class feature | 5-10% of sites will fail scraping | ✅ Approved |
| AD-004 | Preview before save | User confirms AI extraction accuracy | ✅ Approved |
| AD-005 | Store raw_content for re-parsing | Enable future prompt improvements | ✅ Approved |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Jina AI downtime | Low | High | Fallback to manual paste |
| AI extraction errors | Medium | High | Confidence score + user preview |
| Cost overrun | Low | Low | $1.40/mo max, cap at 200 jobs/mo |
| Site blocking | Medium | Medium | Manual paste always available |

---

## Out of Scope (Future Enhancements)

**NOT included in MVP:**
- ❌ Browser extension for one-click save
- ❌ Bulk import from LinkedIn/CSV
- ❌ Automatic job board monitoring
- ❌ Email parsing from job alerts
- ❌ Multi-language support (focus on English/Thai)

**Consider for Phase 2:**
- ⏳ Job description summarization
- ⏳ Skills gap analysis vs master profile
- ⏳ Salary range normalization (USD/THB/EUR)
- ⏳ Company research auto-fetch (Glassdoor, LinkedIn)

---

## Contact & Questions

**Feature Owner:** Product Manager & Product Owner (collaborative)

**Development Timeline:**
- **Oct 7:** Database + Edge Function
- **Oct 8:** Frontend modal
- **Oct 9:** Integration
- **Oct 10-12:** Testing + docs

**Questions?**
- Check PRD.md for business context
- Check TechnicalArchitecture.md for design decisions
- Check ImplementationPlan.md for task breakdown

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-06 | Initial documentation from PM/PO feature request evaluation | PM/PO Team |

---

**Last Updated:** October 6, 2025
**Next Review:** October 13, 2025 (post-MVP launch)
