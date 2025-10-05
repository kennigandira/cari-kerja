# Kanban Job Application Tracker - Documentation Index

**Feature:** Kanban Job Application Tracker
**Status:** In Development
**Version:** 1.0
**Priority:** P1 (High)

---

## 📚 Documentation Overview

This folder contains all documentation for the Kanban Job Application Tracker feature, organized by audience and purpose.

---

## Documents by Audience

### For Product Managers
- **[PRD_KanbanJobApplicationTracker.md](./PRD_KanbanJobApplicationTracker.md)** - Product Requirements Document
  - User stories and acceptance criteria
  - Success metrics (time to status check <5s, 20+ applications managed)
  - Feature specifications (drag-drop, real-time sync, mobile UX)
  - Out of scope and open questions

### For Architects & Tech Leads
- **[../../technical-decisions/TD004_Kanban_Architecture.md](../../technical-decisions/TD004_Kanban_Architecture.md)** - Technical Architecture
  - System architecture overview (Vue 3 + Supabase + vuedraggable)
  - Key architectural decisions (AD-011 through AD-015)
  - Technology stack choices
  - Critical blockers and trade-offs

### For Frontend Engineers
- **[FrontendComponents.md](./FrontendComponents.md)** - Component Specifications
  - Vue 3 Composition API components (KanbanBoard, KanbanColumn, ApplicationCard)
  - Pinia store (useKanbanStore)
  - Composables (useRealtimeSync, useOptimisticUpdate, useKeyboardDrag)
  - Styling guidelines (Tailwind CSS)
  - Accessibility requirements (WCAG 2.1 AA)
  - vuedraggable integration patterns

- **[APISpecification.md](./APISpecification.md)** - API Integration
  - Supabase client operations (direct database access)
  - Real-time subscription patterns
  - PostgreSQL RPC function calls
  - Error handling and type definitions

### For Backend Engineers
- **[DatabaseSchema.md](./DatabaseSchema.md)** - Database Schema
  - Full schema with constraints (kanban_columns, kanban_cards, kanban_card_activities)
  - PostgreSQL RPC functions (move_card_between_columns, reorder_cards_in_column)
  - Triggers and indexes
  - Row-Level Security policies
  - Migration scripts (004_create_kanban_structure.sql)
  - Data migration strategy from filesystem

### For All Engineers
- **[ImplementationPlan.md](./ImplementationPlan.md)** - Implementation Plan
  - Sprint breakdown (2-3 weeks for MVP)
  - Phase 1: Core Kanban (Week 1, 10-12 hours)
  - Phase 2: Real-time + Polish (Week 2, 8-10 hours)
  - Phase 3: Optional Enhancements (Week 3+, 6-8 hours)
  - Task assignments and testing strategy
  - Deployment plan (Supabase + Cloudflare Pages)

### For QA Engineers
- **[TestingStrategy.md](./TestingStrategy.md)** - Testing Strategy
  - Unit test requirements (Vitest, 70%+ coverage)
  - Integration test scenarios (Supabase RPC functions, real-time sync)
  - E2E test scripts (Playwright - manual priority)
  - Accessibility testing (axe-core, keyboard navigation, screen readers)
  - Performance benchmarks (drag-drop <100ms, 60fps)

---

## Quick Start for Developers

### 1. Understand the Feature
Read in this order:
1. **PRD** (understand WHAT we're building and WHY)
2. **TD004 Architecture** (understand consensus decisions)
3. **Implementation Plan** (understand HOW and WHEN)

### 2. Backend Development
1. Read TD004 Kanban Architecture (architectural decisions)
2. Review DatabaseSchema.md (schema details, RPC functions)
3. Review APISpecification.md (Supabase client patterns)
4. Start with ImplementationPlan Phase 1 (database migrations)

**First Task:**
```bash
# Create database migration file
cd app/supabase/migrations
# Copy template from DatabaseSchema.md → 004_create_kanban_structure.sql
supabase db reset  # Test migration locally
```

### 3. Frontend Development
1. Read TD004 Kanban Architecture (Vue 3 + vuedraggable architecture)
2. Review FrontendComponents.md (component specs)
3. Review APISpecification.md (Supabase integration)
4. Start with ImplementationPlan Phase 1 (KanbanBoard component)

**First Task:**
```bash
# Install dependencies
cd app/frontend
npm install vuedraggable@next  # Vue 3 compatible version

# Create component files
mkdir -p src/components/kanban
# Implement KanbanBoard.vue following FrontendComponents.md
```

### 4. Before Merging
1. Check TestingStrategy.md (coverage requirements)
2. Run unit tests: `npm run test:unit -- --coverage`
3. Manual E2E testing (drag-drop checklist in TestingStrategy.md)
4. Accessibility audit: `npm run test:a11y`
5. Update documentation if needed

---

## Decision Log

| ID | Decision | Status | Document |
|----|----------|--------|----------|
| AD-011 | Database as Kanban source of truth | ✅ Approved | TD004 |
| AD-012 | Atomic position updates via PostgreSQL RPC | ✅ Approved | TD004 |
| AD-013 | vuedraggable over custom implementation | ✅ Approved | TD004 |
| AD-014 | Supabase Realtime for multi-tab sync | ✅ Approved | TD004 |
| AD-015 | Hybrid data migration strategy | ✅ Approved | TD004 |

---

## Critical Blockers (Must Fix Before MVP)

| ID | Issue | Status | Owner | Estimate |
|----|-------|--------|-------|----------|
| CB-11 | PostgreSQL RPC functions for atomic updates | 🔴 Not Started | Backend | 4h |
| CB-12 | Data migration script validation | 🔴 Not Started | Backend | 6h |
| CB-13 | Real-time subscription debouncing | 🔴 Not Started | Frontend | 2h |
| CB-14 | Mobile touch drag-drop UX testing | 🔴 Not Started | Frontend | 8h |

**Total Critical Path:** 20 hours to production-ready MVP

### CB-11: PostgreSQL RPC Functions
**Problem:** Concurrent drag operations can corrupt position sequences
**Solution:** Atomic transaction-based RPC functions
**File:** `DatabaseSchema.md` - Section "Stored Procedures/Functions"

### CB-12: Data Migration Script
**Problem:** 50+ existing applications in filesystem need import to database
**Solution:** Idempotent sync script with validation
**File:** `DatabaseSchema.md` - Section "Data Migration Plan"

### CB-13: Real-time Debouncing
**Problem:** Rapid drag operations trigger excessive UI re-renders
**Solution:** 150ms debounce window in useRealtimeSync composable
**File:** `FrontendComponents.md` - Section "Composables"

### CB-14: Mobile Touch UX
**Problem:** vuedraggable ghost element rendering issues on iOS Safari
**Solution:** Fallback config + long-press threshold tuning
**File:** `FrontendComponents.md` - Section "Accessibility"

---

## Technology Stack Summary

**Frontend:**
- Vue 3.5.22 (Composition API)
- vuedraggable v4.1.0 (drag-and-drop)
- Pinia 2.x (state management)
- Tailwind CSS 3.x (styling)
- TypeScript 5.x (type safety)

**Backend:**
- Supabase PostgreSQL (database)
- Supabase Realtime (WebSocket subscriptions)
- Row-Level Security (authorization)
- PostgreSQL RPC functions (atomic operations)

**Deployment:**
- Cloudflare Pages (frontend static hosting)
- Supabase Cloud (backend infrastructure)

---

## Data Architecture

```
Hybrid Model:
┌─────────────────────────────────────┐
│ PostgreSQL (Source of Truth)       │
│ - kanban_columns                    │
│ - kanban_cards                      │
│ - kanban_card_activities            │
└─────────────────────────────────────┘
              ↕ Sync Script
┌─────────────────────────────────────┐
│ Filesystem (Document Storage)       │
│ - 04_Applications/*/                │
│   ├── job-spec.md                   │
│   ├── final-*-cv.pdf                │
│   └── final-*-cover-letter.pdf      │
└─────────────────────────────────────┘
```

**Key Design:**
- Database stores: company, position, kanban_stage, kanban_order, tags, match_score
- Filesystem stores: CVs, cover letters, job descriptions (LaTeX/PDF)
- Sync script maintains bidirectional consistency

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load | <2s (50 cards) | Lighthouse Performance |
| Drag-Drop Latency | <100ms | Chrome DevTools Performance |
| Real-time Sync Delay | <2s | Manual multi-tab test |
| Frame Rate | 60fps during drag | Chrome FPS meter |
| Bundle Size | <100KB gzipped | Vite build output |

---

## Accessibility Compliance

**WCAG 2.1 Level AA Requirements:**
- ✅ Keyboard navigation (Tab, Enter, Arrow keys, Escape)
- ✅ Screen reader support (ARIA labels, live regions)
- ✅ Color contrast (4.5:1 text, 3:1 UI components)
- ✅ Touch targets (40x40px minimum on mobile)
- ✅ Focus indicators (visible 2px ring)

**Testing Tools:**
- axe-core (automated scans)
- VoiceOver (macOS screen reader)
- NVDA (Windows screen reader)
- Keyboard-only navigation testing

---

## Contact & Questions

For questions or clarifications about this feature:
- Review the relevant technical decision documents (TD004)
- Check the GitHub Issues for this repository
- Refer to the Implementation Plan for task ownership

**Development Timeline:**
- **Week 1 (Oct 7-13):** Phase 1 - Core Kanban functionality
- **Week 2 (Oct 14-20):** Phase 2 - Real-time sync + mobile UX
- **Week 3 (Oct 21+):** Phase 3 - Optional enhancements

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-05 | Initial documentation | Product Team (PM, PO, Architects, Engineers) |

---

**Last Updated:** October 5, 2025
