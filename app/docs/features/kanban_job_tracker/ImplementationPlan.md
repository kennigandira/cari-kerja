# Implementation Plan: Kanban Job Application Tracker

**Version:** 1.0 Solo Developer Edition
**Date:** 2025-10-05
**Priority:** P1 (High)
**Estimated Timeline:** 2-3 weeks (10-15 hours/week)
**Author:** Product Owner

---

## 1. Overview

### 1.1 Context

**Developer Profile:**
- Solo full-stack engineer
- Part-time availability: 10-15 hours/week
- Active job search requiring immediate value
- Must ship incrementally to maintain momentum

**Business Driver:**
User is actively job searching and needs visual tracking of 30+ applications across stages.

**Current Pain Points:**
- Applications tracked in filesystem (`04_Applications/`)
- No visual pipeline of application status
- Manual updates to markdown tracking files
- Difficult to see bottlenecks or next actions

### 1.2 Architecture

**Stack:**
- **Frontend:** Vue 3.5.22 (Composition API), TypeScript
- **Drag & Drop:** vuedraggable (Vue 3 wrapper for SortableJS)
- **Backend:** Supabase PostgreSQL + Realtime
- **Deployment:** Cloudflare Pages (static frontend) + Supabase cloud

### 1.3 Timeline

| Phase | Duration | Hours | Deliverable |
|-------|----------|-------|-------------|
| Phase 1: Core Kanban | Week 1 | 10-12h | Working drag-drop board with 5-10 cards |
| Phase 2: Real-time + Polish | Week 2 | 8-10h | Mobile responsive + data migration |
| Phase 3: Optional Enhancements | Week 3+ | 6-8h | Analytics, bulk ops (if time permits) |

---

## 2. MVP-First Approach

### 2.1 Phase 1: Core Kanban (Week 1, 10-12 hours)

**Goal:** Ship a working Kanban board with drag-drop functionality.

**Tasks:**

| Task | Hours | Definition of Done |
|------|-------|-------------------|
| 1. Database migration `004_create_kanban_structure.sql` | 2h | Tables created, RPC functions working, migration runs cleanly |
| 2. PostgreSQL RPC functions | 2h | Atomic card movement functions tested |
| 3. KanbanBoard.vue component | 2h | Renders columns from DB, handles loading/error states |
| 4. KanbanColumn.vue component | 2h | Renders cards via vuedraggable, emits events |
| 5. ApplicationCard.vue component | 1h | Displays company, role, applied date |
| 6. vuedraggable integration + state | 2h | Drag-drop works, optimistic UI, calls RPC on drop |
| 7. Manual testing | 1h | Drag cards between columns, verify DB updates |

**Deliverable:** Working Kanban board at `/kanban` route with 6 default columns and drag-drop functionality.

### 2.2 Phase 2: Real-time + Polish (Week 2, 8-10 hours)

**Tasks:**

| Task | Hours | Definition of Done |
|------|-------|-------------------|
| 1. Supabase Realtime subscription | 2h | Multi-tab sync working |
| 2. Optimistic UI updates | 1.5h | Instant card movement with rollback |
| 3. Mobile responsive layout | 2h | Horizontal scroll on mobile, touch-friendly |
| 4. Activity log component | 1.5h | Display card movement history |
| 5. Data migration script | 2h | Import from `04_Applications/` |
| 6. Mobile testing | 1h | Test on iPhone Safari and Android Chrome |

**Deliverable:** Production-ready Kanban with real-time sync and mobile support.

---

## 3. Database Implementation

### 3.1 Migration: 004_create_kanban_structure.sql

**File Location:** `/Users/user/Documents/cari-kerja/app/supabase/migrations/004_create_kanban_structure.sql`

```sql
-- Kanban columns table
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  color TEXT DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_column_position UNIQUE (user_id, position),
  CONSTRAINT unique_user_column_name UNIQUE (user_id, name),
  CONSTRAINT valid_hex_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Kanban cards table
CREATE TABLE kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  column_id UUID REFERENCES kanban_columns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low') OR priority IS NULL),
  tags TEXT[] DEFAULT '{}',
  deadline DATE,
  application_folder_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,

  CONSTRAINT unique_column_card_position
    UNIQUE (column_id, position)
    WHERE archived_at IS NULL
);

-- Activity log table
CREATE TABLE kanban_card_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (
    activity_type IN ('card_created', 'card_moved', 'card_archived', 'card_restored', 'field_updated')
  ),
  from_column_id UUID REFERENCES kanban_columns(id),
  to_column_id UUID REFERENCES kanban_columns(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC Function: Move card between columns
CREATE OR REPLACE FUNCTION move_card_between_columns(
  p_card_id UUID,
  p_target_column_id UUID,
  p_target_position INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_current_position INTEGER;
  v_current_column_id UUID;
  v_user_id UUID;
BEGIN
  SELECT position, column_id, user_id
  INTO v_current_position, v_current_column_id, v_user_id
  FROM kanban_cards
  WHERE id = p_card_id AND archived_at IS NULL
  FOR UPDATE;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update positions atomically
  UPDATE kanban_cards SET position = position - 1
  WHERE column_id = v_current_column_id AND position > v_current_position;

  UPDATE kanban_cards SET position = position + 1
  WHERE column_id = p_target_column_id AND position >= p_target_position;

  UPDATE kanban_cards
  SET column_id = p_target_column_id, position = p_target_position
  WHERE id = p_card_id;

  -- Log activity
  INSERT INTO kanban_card_activities (card_id, user_id, activity_type, from_column_id, to_column_id)
  VALUES (p_card_id, auth.uid(), 'card_moved', v_current_column_id, p_target_column_id);
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_card_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own columns" ON kanban_columns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cards" ON kanban_cards
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 4. Frontend Implementation

### 4.1 Component Files

```
app/frontend/src/
├── views/
│   └── KanbanView.vue
├── components/
│   └── kanban/
│       ├── KanbanBoard.vue
│       ├── KanbanColumn.vue
│       ├── ApplicationCard.vue
│       └── KanbanSkeleton.vue
├── stores/
│   └── kanban.ts
└── composables/
    └── useRealtimeSync.ts
```

---

## 5. Data Migration

### 5.1 Migration Script

**File:** `app/scripts/migrate-applications-to-kanban.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const APPLICATIONS_DIR = '/Users/user/Documents/cari-kerja/04_Applications'

async function migrateApplications() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const folders = await fs.readdir(APPLICATIONS_DIR)

  for (const folder of folders) {
    const match = folder.match(/^(.+?)_(.+?)_(\d{4}-\d{2}-\d{2})$/)
    if (!match) continue

    const [, company, position, date] = match

    await supabase.from('kanban_cards').insert({
      title: `${position} at ${company}`,
      application_folder_path: folder,
      // ... other fields
    })
  }
}
```

---

## 6. Testing Strategy

### Manual Testing Checklist

**Phase 1:**
- [ ] Drag card within column (reorder)
- [ ] Drag card to different column (status change)
- [ ] Verify position updates in database
- [ ] Test with empty columns

**Phase 2:**
- [ ] Open two tabs, verify real-time sync
- [ ] Test on mobile (horizontal scroll, touch drag)
- [ ] Verify activity log shows movements

---

## 7. Deployment Plan

### 7.1 Supabase Deployment

```bash
# Push migration to production
cd app
supabase db push

# Run data migration
npx tsx scripts/migrate-applications-to-kanban.ts
```

### 7.2 Frontend Deployment

```bash
# Build and deploy (auto-deploys via git)
git add .
git commit -m "feat: kanban board implementation"
git push origin main
```

---

**Complete Implementation Plan**

For full task breakdowns, detailed timelines, testing checkpoints, and deployment procedures, refer to the complete Product Owner assessment in the project documentation.

---

**Last Updated:** October 5, 2025
