# TD-004: Kanban Job Application Tracker - Technical Architecture Review

**Status:** Approved
**Date:** 2025-10-05
**Reviewers:** Master Software Architect, Frontend Specialist (Chase), Backend Specialist (Foreman)
**Architectural Impact:** High
**Author:** Master Architect

---

## 1. Architecture Overview

### 1.1 System Context

The Kanban Job Application Tracker is a Vue 3 SPA that provides drag-and-drop visualization of job applications across their lifecycle stages. The system maintains a hybrid data architecture where PostgreSQL (Supabase) serves as the source of truth for kanban metadata while the filesystem preserves document artifacts (CVs, cover letters, PDFs).

### 1.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ KanbanBoard  │  │ JobCard      │  │ QuickEdit    │          │
│  │ Component    │──│ Component    │──│ Modal        │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│  ┌──────▼──────────────────▼──────────────────▼───────┐          │
│  │           Vue Composable Layer                      │          │
│  │   useKanban()  │  useJobMutations()  │ useRealtime()│         │
│  └──────┬──────────────────┬──────────────────┬────────┘         │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────────────┐
│                    Supabase Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ REST API     │  │ Realtime     │  │ PostgreSQL   │          │
│  │ (CRUD ops)   │  │ Subscriptions│  │ RPC calls    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────────────┐
│                    Supabase Backend (PostgreSQL)                  │
│  ┌───────────────────────────────────────────────────────┐       │
│  │  kanban_columns, kanban_cards, kanban_card_activities │       │
│  │  RPC Functions (Atomic Operations)                    │       │
│  │  Row-Level Security Policies                          │       │
│  │  Realtime Publication                                 │       │
│  └───────────────────────────────────────────────────────┘       │
└───────────────────────────────────────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────────────────────────┐
│                    Filesystem Layer (Read-Only)                 │
│  04_Applications/CompanyName_Position_Date/                    │
│  ├── job-spec.md                                               │
│  ├── company-position-cv.pdf                                   │
│  └── company-cover-letter-position-Kenni.pdf                   │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Architectural Decisions

### AD-011: Database as Kanban Source of Truth

**Decision:** PostgreSQL (Supabase) stores all kanban metadata (stage, order, tags, scores). Filesystem stores immutable document artifacts.

**Rationale:**
- Queryability: Enables filtering by date, company, tags without parsing filesystem
- Real-time Sync: Supabase Realtime provides WebSocket subscriptions out-of-the-box
- ACID Guarantees: Atomic position updates prevent race conditions
- Scalability: Supports future multi-user features without architectural rewrite

**Trade-offs:**
- Migration Cost: Requires one-time sync script
- Dual Maintenance: Updates must sync between DB and filesystem

**Status:** ✅ Approved

---

### AD-012: Atomic Position Updates via PostgreSQL RPC

**Decision:** Use PostgreSQL stored procedures (RPC functions) for all drag-drop position updates instead of application-level transactions.

**Rationale:**
- Atomicity: Single RPC call wraps multiple UPDATEs in BEGIN/COMMIT transaction
- Race Condition Prevention: Database-level locking prevents concurrent drag conflicts
- Network Efficiency: 1 RPC call vs. 3-5 REST API calls
- Consistency: Order recalculation logic centralized in database

**Status:** ✅ Approved - Critical Blocker CB-11

---

### AD-013: vuedraggable Over Custom Implementation

**Decision:** Use vuedraggable v4.1.0 (next branch) for drag-and-drop functionality.

**Rationale:**
- Battle-tested: 19K+ GitHub stars, production-proven
- Vue 3 Native: Built on Composition API, supports `<script setup>`
- Accessibility: ARIA roles, keyboard navigation built-in
- Bundle Size: 12KB gzipped
- Mobile Support: Touch events with ghost element rendering

**Status:** ✅ Approved

---

### AD-014: Supabase Realtime for Multi-tab Sync

**Decision:** Use Supabase's built-in Realtime subscriptions for cross-tab synchronization.

**Rationale:**
- Zero Infrastructure Cost: Included in Supabase free tier
- Proven Reliability: Phoenix Channels (Elixir), 99.9% uptime
- Automatic Reconnection: Handles network interruptions
- RLS Integration: Realtime respects Row-Level Security policies

**Status:** ✅ Approved - Critical Blocker CB-13

---

### AD-015: Hybrid Data Migration Strategy

**Decision:** Bidirectional sync script that imports filesystem metadata to PostgreSQL while preserving CVs/PDFs.

**Rationale:**
- Risk Mitigation: Preserves 50+ existing applications
- Gradual Adoption: Kanban UI can launch while filesystem workflow continues
- Rollback Path: If Supabase fails, filesystem data remains intact
- Idempotency: Script can re-run safely

**Status:** ✅ Approved - Critical Blocker CB-12

---

## 3. Critical Blockers

### CB-11: PostgreSQL RPC Functions for Atomic Updates

**Status:** Not Implemented
**Risk:** High - Core functionality blocker
**Estimate:** 4 hours

**Implementation:**
- `move_card_between_columns` RPC function
- `reorder_cards_in_column` RPC function
- PostgreSQL migration file

---

### CB-12: Data Migration Script Validation

**Status:** Partially Implemented
**Risk:** High - Data integrity risk
**Estimate:** 6 hours

**Implementation:**
- Dry-run mode
- Diff report generation
- Rollback SQL script
- Edge case testing

---

### CB-13: Real-time Subscription Debouncing

**Status:** Not Implemented
**Risk:** Medium - UX performance issue
**Estimate:** 2 hours

**Implementation:**
- 150ms debounce in `useRealtimeSync` composable
- Unit tests for debounce behavior

---

### CB-14: Mobile Touch Drag-Drop UX

**Status:** Not Tested
**Risk:** Medium - Accessibility blocker
**Estimate:** 8 hours

**Implementation:**
- Test on iOS Safari and Android Chrome
- Fix ghost element rendering
- Long-press (500ms) configuration
- Haptic feedback

---

## 4. Trade-offs & Alternatives

### 4.1 Database vs. Filesystem

**Chosen:** Database (PostgreSQL)

| Aspect | Database (Chosen) | Filesystem |
|--------|-------------------|------------|
| Query Performance | O(log n) with indexes | O(n) grep/find |
| Real-time Sync | Native | Requires file watchers |
| Data Integrity | ACID guarantees | No transaction support |
| Migration Cost | High (one-time) | Zero |

---

### 4.2 Optimistic UI Updates vs. Server Confirmation

**Chosen:** Optimistic Updates with Rollback

| Aspect | Optimistic (Chosen) | Wait for Server |
|--------|---------------------|-----------------|
| Perceived Latency | 0ms (instant) | 50-200ms delay |
| UX Quality | Excellent | Poor (noticeable lag) |
| Implementation Complexity | High | Low |

---

### 4.3 vuedraggable vs. Custom Implementation

**Chosen:** vuedraggable

| Aspect | vuedraggable | Custom |
|--------|--------------|--------|
| Development Time | 2 days | 2-3 weeks |
| Bundle Size | +12KB | +5KB |
| Accessibility | Built-in | Manual |
| Mobile Support | Battle-tested | Extensive testing needed |

---

## 5. Conclusion

**Architectural Review Status:** **Approved for Implementation**

**Critical Path to MVP:** 20 hours

**Key Strengths:**
1. Hybrid architecture leverages PostgreSQL for metadata, filesystem for documents
2. Real-time sync provides multi-tab updates with zero infrastructure
3. Atomic operations prevent race conditions
4. Battle-tested libraries reduce development time by 3 weeks
5. Security-first with RLS policies

**Next Steps:**
1. Implement CB-11 (RPC functions) - 4 hours
2. Validate CB-12 (migration script) - 6 hours
3. Fix CB-13 (realtime debouncing) - 2 hours
4. Test CB-14 (mobile touch UX) - 8 hours

---

**Complete Technical Architecture Review**

For full architectural decisions (AD-011 through AD-015), detailed data flow diagrams, performance characteristics, security architecture, and scalability analysis, refer to the complete Master Architect assessment in the project documentation.

---

**Last Updated:** October 5, 2025
