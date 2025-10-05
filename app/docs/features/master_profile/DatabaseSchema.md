# Database Schema - Master Profile Tables

**Version:** 1.0
**Migration:** 003_add_master_profiles
**Dependencies:** 001_initial_schema.sql (jobs table)
**Migration File:** `/Users/user/Documents/cari-kerja/app/supabase/migrations/003_add_master_profiles_up.sql`

---

## Schema Overview

**Total Tables:** 8 new tables
**Relationships:** 7 child tables referencing master_profiles
**Indexes:** 15 performance indexes
**Functions:** 2 stored procedures (create_profile_atomic, ensure_single_default_profile)
**Triggers:** 3 automated triggers (update timestamps, ensure single default)
**RLS Policies:** 32 policies (4 per table × 8 tables)

---

## Entity Relationship Diagram

```
master_profiles (1) ──┬──► work_experiences (N)
                      │         └──► achievements (N)
                      ├──► skills (N)
                      ├──► education (N)
                      ├──► certifications (N)
                      ├──► languages (N)
                      └──► profile_versions (N)

jobs (N) ───────────────────► profile_versions (1)
```

---

## Table Descriptions

### master_profiles

**Purpose:** Core profile data - contact info, summary, file references

**Key Design Decisions:**
- `profile_name`: User-defined name to distinguish multiple profiles (e.g., "Senior Frontend", "Leadership Role")
- `is_default`: Only ONE profile per user can be default (enforced by trigger + partial index)
- `version`: INTEGER for optimistic locking (not BIGINT to save space - unlikely >2B updates per profile)
- `professional_summary`: Limited to 100-2000 chars to enforce concise writing and prevent UI overflow
- `user_id`: NULLABLE to support pre-auth profile creation, becomes required when auth implemented
- Soft delete via `deleted_at` + `is_active` to preserve referential integrity with job applications

**Critical Constraints:**
```sql
CONSTRAINT unique_profile_name_per_user UNIQUE NULLS NOT DISTINCT (user_id, profile_name)
-- Prevents duplicate profile names per user
-- NULLS NOT DISTINCT means only ONE profile with NULL user_id allowed (pre-auth users)

CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
-- Basic email validation (full validation done in application layer)
```

**Indexes:**
- `idx_profiles_user_id`: Fast lookup of user's profiles
- `idx_profiles_user_default` (partial): Fast default profile lookup (only indexes is_default = true)
- `idx_profiles_active` (partial): Fast active profile queries (excludes deleted)

---

### work_experiences

**Purpose:** Employment history with start/end dates and descriptions

**Key Design Decisions:**
- `is_current`: Boolean flag for current employment (mutually exclusive with `end_date`)
- `display_order`: User-controlled ordering (0 = most recent, typically)
- `version`: Optimistic locking at experience level (allows concurrent edits to different experiences)

**Critical Constraints:**
```sql
CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
-- Prevents invalid date ranges

CONSTRAINT current_no_end_date CHECK (NOT (is_current = true AND end_date IS NOT NULL))
-- Current positions cannot have end dates
```

**Why separate table?** Normalization - users have 3-10 experiences typically, each with multiple fields.

---

### achievements

**Purpose:** Measurable accomplishments within work experiences

**Key Design Decisions:**
- Nested under `work_experiences` (not direct to profile) for better organization
- `metric_type`: ENUM for structured data (enables future analytics/aggregation)
- `metric_value`: NUMERIC(15,2) for precision (supports large numbers like $1,234,567.89)
- `timeframe`: Free text (Q3 2023, first year, etc.) for flexibility

**Why separate table?** Each experience can have 0-10 achievements. Denormalizing would bloat work_experiences table.

---

### skills

**Purpose:** Technical and professional skills with proficiency levels

**Key Design Decisions:**
- `category`: Free text (could be ENUM but skills categories evolve, better as lookup table in future)
- `proficiency_level`: ENUM for consistency (Expert, Advanced, Intermediate, Beginner)
- `years_of_experience`: INTEGER (nullable - user may not know exact years)

**Critical Constraints:**
```sql
CONSTRAINT unique_skill_per_profile UNIQUE (profile_id, skill_name)
-- Prevents duplicate skills like "React.js" appearing twice
```

**Indexes:**
- `idx_skills_profile`: Fast profile skills lookup
- `idx_skills_category`: Support filtering/grouping by category (for UI display)

---

### education, certifications, languages

**Purpose:** Educational background, professional certifications, language proficiency

**Design Pattern:** All follow same structure as skills:
- Normalized child tables
- CASCADE DELETE (removing profile removes all related data)
- `display_order` for user-controlled sorting
- Unique constraints where applicable

**Why separate tables?** Different field requirements:
- Education needs `degree`, `field_of_study`, `start_year`, `end_year`
- Certifications need `credential_id`, `credential_url`, `expiry_date`
- Languages need `proficiency_level` (Native, Professional, Conversational, Basic)

---

### profile_versions

**Purpose:** Audit trail - snapshot of profile at each save for history/rollback

**Key Design Decisions:**
- `snapshot_data`: JSONB (full profile + all children serialized)
- `version_number`: Matches `master_profiles.version` for lookup
- `change_summary`: Optional user-provided description of changes

**Why JSONB?** Flexible schema, supports querying nested data, compressed automatically by Postgres.

**Storage impact:** ~5KB per version, 100 versions = 500KB. Acceptable for MVP.

**Future enhancement:** Implement version retention policy (keep last 10 versions, or versions from last 6 months).

---

## Stored Procedures

### create_profile_atomic()

**Purpose:** Atomically create profile with all related data in single transaction

**Parameters:**
- `p_user_id UUID` - User ID (nullable for pre-auth)
- `p_profile_data JSONB` - Master profile fields
- `p_work_experiences JSONB[]` - Array of work experiences (each with nested achievements)
- `p_skills JSONB[]` - Array of skills
- `p_education JSONB[]` - Array of education records
- `p_certifications JSONB[]` - Array of certifications
- `p_languages JSONB[]` - Array of languages

**Returns:** JSONB with created profile summary

**Why stored procedure?**
1. **Atomicity:** All-or-nothing transaction (if achievements insert fails, profile is rolled back)
2. **Performance:** Single database round-trip instead of 8+ separate inserts
3. **Consistency:** Guaranteed to create profile version snapshot
4. **Security:** Business logic in database, harder to bypass

**Error handling:** Explicit EXCEPTION block - returns descriptive error message on failure

---

### ensure_single_default_profile()

**Purpose:** Trigger function to guarantee only ONE default profile per user

**How it works:**
1. Before INSERT/UPDATE on `master_profiles` where `is_default = true`
2. Acquire advisory lock based on `user_id` hash (prevents race conditions)
3. Set ALL other profiles for this user to `is_default = false`
4. Return NEW row (allows INSERT/UPDATE to proceed)

**Why advisory lock?** Without it, two concurrent "set default" requests could both succeed, violating constraint.

---

## Performance Indexes

| Index Name | Table | Columns | Type | Purpose |
|-----------|-------|---------|------|---------|
| `idx_profiles_user_id` | master_profiles | user_id | B-tree | Fast user profile lookup |
| `idx_profiles_user_default` | master_profiles | user_id, is_default | Partial (is_default=true) | Fast default profile lookup |
| `idx_profiles_active` | master_profiles | user_id | Partial (is_active=true) | Exclude deleted profiles |
| `idx_experiences_profile` | work_experiences | profile_id, display_order | B-tree | Ordered experience listing |
| `idx_experiences_dates` | work_experiences | profile_id, start_date DESC, end_date DESC | B-tree | Date-ordered queries |
| `idx_achievements_experience` | achievements | experience_id, display_order | B-tree | Ordered achievements per experience |
| `idx_skills_profile` | skills | profile_id, category, display_order | B-tree | Categorized skill listing |
| `idx_skills_category` | skills | category | B-tree | Filter/group by category |
| `idx_education_profile` | education | profile_id, display_order | B-tree | Ordered education listing |
| `idx_certifications_profile` | certifications | profile_id, display_order | B-tree | Ordered certification listing |
| `idx_languages_profile` | languages | profile_id, display_order | B-tree | Ordered language listing |
| `idx_profile_versions_profile` | profile_versions | profile_id, version_number DESC | B-tree | Version history lookup (newest first) |

**Query Performance Targets:**
- Fetch profile with all children: < 50ms
- List user's profiles: < 10ms
- Create profile: < 200ms (includes AI extraction not counted)

---

## Row Level Security (RLS)

**Pattern:** All tables check ownership via `user_id` (direct or via JOIN to master_profiles)

**Key Policy:**
```sql
CREATE POLICY "Users can view own profiles"
  ON master_profiles FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
```

**Why `user_id IS NULL`?** Allows pre-authentication profile creation. Once auth implemented, `user_id` becomes required.

**Security Note:** RLS policies use `EXISTS` subqueries for child tables, which Postgres optimizes well (uses semi-join).

---

## Migration Procedure

**See:** `/Users/user/Documents/cari-kerja/app/docs/features/master_profile/ImplementationPlan.md` (Migration Runbook section)

**Critical steps:**
1. Backup database before migration
2. Test migration on local/staging first
3. Verify table count = 8, function count = 2 after migration
4. Test basic CRUD operations before deploying app code
5. Have rollback script ready

**Rollback:** Execute `003_add_master_profiles_down.sql` - drops all tables in reverse dependency order

---

## Common Queries

**Get profile with all related data:**
```sql
SELECT
  p.*,
  json_agg(DISTINCT we.*) FILTER (WHERE we.id IS NOT NULL) as work_experiences,
  json_agg(DISTINCT s.*) FILTER (WHERE s.id IS NOT NULL) as skills,
  json_agg(DISTINCT e.*) FILTER (WHERE e.id IS NOT NULL) as education,
  json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) as certifications,
  json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL) as languages
FROM master_profiles p
LEFT JOIN work_experiences we ON we.profile_id = p.id
LEFT JOIN skills s ON s.profile_id = p.id
LEFT JOIN education e ON e.profile_id = p.id
LEFT JOIN certifications c ON c.profile_id = p.id
LEFT JOIN languages l ON l.profile_id = p.id
WHERE p.id = $1
GROUP BY p.id;
```

**Get default profile for user:**
```sql
SELECT * FROM master_profiles
WHERE user_id = $1
  AND is_default = true
  AND is_active = true
  AND deleted_at IS NULL;
```

**Get profile version history:**
```sql
SELECT
  version_number,
  change_summary,
  created_at,
  jsonb_pretty(snapshot_data) as snapshot
FROM profile_versions
WHERE profile_id = $1
ORDER BY version_number DESC
LIMIT 10;
```

---

## Database Size Estimates

**Assumptions:**
- 1000 users
- Average 3 profiles per user
- Average 5 work experiences per profile
- Average 2 achievements per experience
- Average 20 skills per profile
- Average 2 education records
- Average 2 certifications
- Average 2 languages
- Average 10 versions per profile

**Row counts:**
- master_profiles: 3,000
- work_experiences: 15,000
- achievements: 30,000
- skills: 60,000
- education: 6,000
- certifications: 6,000
- languages: 6,000
- profile_versions: 30,000

**Storage estimate:** ~500MB for 1000 users (including indexes)

**Growth:** Linear with users. 10,000 users ≈ 5GB.

---

**For full migration SQL, see:** `/Users/user/Documents/cari-kerja/app/supabase/migrations/003_add_master_profiles_up.sql`
