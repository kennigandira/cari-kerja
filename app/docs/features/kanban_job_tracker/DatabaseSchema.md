# Database Schema Documentation - Kanban Job Application Tracker

**Version:** 1.0
**Migration:** 004_create_kanban_structure.sql
**Dependencies:** 001_create_jobs_table.sql, 002_add_rls_policies.sql, 003_seed_jobs.sql
**Migration File:** `/Users/user/Documents/cari-kerja/app/supabase/migrations/004_create_kanban_structure.sql`

---

## Schema Overview

The Kanban Job Application Tracker extends the existing `jobs` table with a visual, drag-and-drop interface for managing job applications through different stages. The schema implements a three-table architecture optimized for real-time updates, atomic positioning, and comprehensive activity tracking.

###Tables
- **kanban_columns** - Customizable workflow stages (e.g., "Applied", "Interview", "Offer")
- **kanban_cards** - Visual cards representing job applications with metadata
- **kanban_card_activities** - Complete audit trail of card movements and changes

### Key Design Decisions
1. **Separate kanban_cards from jobs** - Cards are presentation layer; jobs are data layer. This allows:
   - Multiple cards per job (reapplications)
   - Archiving cards without deleting jobs
   - UI-specific metadata (position, tags, priority) separated from core job data

2. **Integer-based positioning** - Cards use integer `position` field for O(1) drag-and-drop reordering with gap-based insertion strategy

3. **Activity log as separate table** - Enables comprehensive analytics, undo functionality, and audit compliance without bloating card table

4. **JSONB metadata in activities** - Flexible storage for activity-specific data (field changes, notes, timestamps) without schema changes

### Functions
- `reorder_cards_in_column()` - Atomic card repositioning within a column
- `move_card_between_columns()` - Transactional cross-column card moves with activity logging

### Triggers
- `update_kanban_columns_updated_at` - Automatic timestamp on column updates
- `update_kanban_cards_updated_at` - Automatic timestamp on card updates
- `log_card_column_change` - Auto-create activity log on column moves

### Indexes
- `idx_kanban_cards_job_id` - Fast job → card lookup
- `idx_kanban_cards_column_position` - Optimized column rendering and reordering
- `idx_kanban_card_activities_card_created` - Activity timeline queries
- `idx_kanban_cards_archived_at` - Efficient archived card filtering

### RLS Policies
All tables use Row Level Security with `auth.uid()` matching pattern:
- Authenticated users can only access their own data
- Service role bypasses RLS for admin operations
- No anonymous access (anon key restricted)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         jobs (existing table)                               │
│─────────────────────────────────────────────────────────────────────────────│
│ • id (uuid, PK)                                                             │
│ • user_id (uuid, FK → auth.users) [RLS anchor]                             │
│ • company_name (text)                                                       │
│ • position (text)                                                           │
│ • location (text)                                                           │
│ • application_date (date)                                                   │
│ • status (text)                                                             │
│ • notes (text)                                                              │
│ • created_at (timestamptz)                                                  │
│ • updated_at (timestamptz)                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N (one job can have multiple cards)
                                    │ (e.g., reapplication, archived attempts)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            kanban_cards                                     │
│─────────────────────────────────────────────────────────────────────────────│
│ • id (uuid, PK)                                                             │
│ • job_id (uuid, FK → jobs.id, ON DELETE CASCADE)                           │
│ • column_id (uuid, FK → kanban_columns.id, ON DELETE SET NULL)             │
│ • user_id (uuid, FK → auth.users) [RLS anchor, denormalized]               │
│ • position (integer, NOT NULL) [for drag-and-drop ordering]                │
│ • title (text, NOT NULL) [derived from company + position]                 │
│ • description (text) [job summary, notes]                                  │
│ • priority (text) [high, medium, low, null]                                │
│ • tags (text[]) [skills, remote, visa-sponsor, etc.]                       │
│ • deadline (date) [application deadline or interview date]                 │
│ • application_folder_path (text) [link to 04_Applications/...]             │
│ • created_at (timestamptz, default now())                                  │
│ • updated_at (timestamptz, default now())                                  │
│ • archived_at (timestamptz, nullable) [soft delete for history]            │
│─────────────────────────────────────────────────────────────────────────────│
│ UNIQUE (column_id, position) WHERE archived_at IS NULL                     │
│ CHECK (priority IN ('high', 'medium', 'low') OR priority IS NULL)          │
└─────────────────────────────────────────────────────────────────────────────┘
                │                                       │
                │                                       │
                │ N:1                                   │ 1:N
                ▼                                       ▼
┌─────────────────────────────┐     ┌──────────────────────────────────────────┐
│    kanban_columns           │     │    kanban_card_activities                │
│─────────────────────────────│     │──────────────────────────────────────────│
│ • id (uuid, PK)             │     │ • id (uuid, PK)                          │
│ • user_id (uuid, FK)        │     │ • card_id (uuid, FK → kanban_cards.id)   │
│ • name (text, NOT NULL)     │     │ • user_id (uuid, FK) [denormalized]      │
│ • position (integer)        │     │ • activity_type (text, NOT NULL)         │
│ • color (text) [hex code]   │     │   - card_created                         │
│ • is_default (boolean)      │     │   - card_moved                           │
│ • created_at (timestamptz)  │     │   - card_archived                        │
│ • updated_at (timestamptz)  │     │   - card_restored                        │
│─────────────────────────────│     │   - field_updated                        │
│ UNIQUE (user_id, position)  │     │ • from_column_id (uuid, nullable)        │
│ UNIQUE (user_id, name)      │     │ • to_column_id (uuid, nullable)          │
└─────────────────────────────┘     │ • metadata (jsonb) [flexible data]       │
                                    │   - previous_value                       │
                                    │   - new_value                            │
                                    │   - field_name                           │
                                    │   - notes                                │
                                    │ • created_at (timestamptz, default now())│
                                    │──────────────────────────────────────────│
                                    │ CHECK (activity_type IN (                │
                                    │   'card_created', 'card_moved',          │
                                    │   'card_archived', 'card_restored',      │
                                    │   'field_updated'))                      │
                                    └──────────────────────────────────────────┘

Relationships:
• kanban_cards.job_id → jobs.id (CASCADE DELETE: deleting job removes its cards)
• kanban_cards.column_id → kanban_columns.id (SET NULL: deleting column orphans cards)
• kanban_card_activities.card_id → kanban_cards.id (CASCADE DELETE: deleting card removes its activity log)
• All tables have user_id → auth.users for RLS enforcement

Design Pattern: Denormalized user_id in kanban_cards and kanban_card_activities
• Rationale: Simplifies RLS policies (avoid JOINs in policy checks)
• Trade-off: Slight redundancy for O(1) RLS policy evaluation
• Performance: Enables index-only scans for auth checks
```

*[The full Database Schema content from Foreman's output continues with detailed table descriptions, stored procedures, triggers, indexes, RLS policies, and migration scripts - approximately 1500+ lines total]*

**End of Database Schema Documentation**

---

**Last Updated:** October 5, 2025
**Author:** Backend Specialist (Foreman)
