# Implementation Plan - Master Profile Feature
**Version:** 3.0 (Revised after Technical Review)
**Date:** October 5, 2025
**Status:** Ready for Development
**Based On:** PRD v1.0, TechnicalDiscussion.md, UserStories.md v2.0

**⚠️ REVISED:** This plan incorporates feedback from architect, backend, and frontend specialists. MVP scope reduced to 15-20 hours (Phase 1 only).

---

## Table of Contents

1. [Overview](#1-overview)
2. [MVP-First Approach](#2-mvp-first-approach)
3. [Database Implementation](#3-database-implementation)
4. [Frontend Implementation](#4-frontend-implementation)
5. [Optional: AI Extraction](#5-optional-ai-extraction)
6. [Testing Strategy](#6-testing-strategy)
7. [Deployment Plan](#7-deployment-plan)

---

## 1. Overview

### 1.1 Project Context

**What We're Building:**
- Database-backed master profile system to replace static `01_Profile/master_profile.md`
- Web UI for creating and editing professional profiles with **single-page form**
- **NO** AI-assisted CV extraction in MVP (moved to Phase 3)

**Current Architecture:**
```
Frontend (Vue 3) → Supabase Client (direct, RLS protected)
                 ↓
             PostgreSQL Database (with RPC functions)

Worker (Cloudflare) → Cron tasks ONLY (no REST API)
```

**Key Architectural Decision:** Frontend talks **directly to Supabase**, BUT uses **PostgreSQL stored procedures (RPC functions)** for all mutations to ensure transaction safety.

**Critical Changes from Original Plan:**
1. ✅ Use RPC functions for atomic transactions (CB-1 fix)
2. ✅ Single-page form instead of multi-step wizard
3. ✅ Session-based pre-auth security (CB-9 fix)
4. ✅ Soft deletes for data recovery (CB-3 fix)
5. ❌ NO multiple profiles in MVP (deferred to Phase 2)
6. ❌ NO AI extraction in MVP (deferred to Phase 3)

### 1.2 Revised Timeline (Post Technical Review)

| Phase | Duration | Focus | Deliverable |
|-------|----------|-------|-------------|
| **Phase 1: MVP** | Week 1-2 (15-20 hours) | Database + Form + Migration | Can create/edit profile, import/export markdown |
| **Phase 2: Enhancements** | Week 3-4 (optional) | Multiple profiles, advanced features | Profile management |
| **Phase 3: AI Extraction** | Week 5-6 (optional) | CV upload + extraction | Automated profile creation |

**MVP Estimate:** 15-20 hours over 2 weeks (10 hours/week)

**CRITICAL CHANGE:** Original plan was 40-55 hours. After technical review, **MVP reduced to 15-20 hours** by descoping multi-step wizard, multiple profiles, and AI extraction.

**Decision Point After Phase 1:** Evaluate if Phase 1 MVP meets needs before investing in Phase 2/3.

---

## 2. MVP-First Approach (Revised)

### Why MVP-First?

After technical review, we're shipping the **absolute minimum** that provides value:

1. **Phase 1 MVP (Week 1-2)**: Database + Single-Page Form + Migration
   - ✅ Fix all 4 critical blockers (CB-1, CB-2, CB-9, CB-3)
   - ✅ Basic profile CRUD (create, read, update, delete)
   - ✅ Import from markdown (migration)
   - ✅ Export to markdown (backward compatibility)
   - ✅ Auto-save (prevent data loss)

2. **Phase 2 (Optional)**: Advanced Features
   - Multiple profiles per user
   - Profile duplication
   - Enhanced validation

3. **Phase 3 (Optional)**: AI Extraction
   - CV upload
   - AI extraction
   - Faster initial profile creation

### Sprint 1 (Week 1) - Database Foundation

**Goal:** Fix critical blockers + create database foundation

**Total Effort:** 10-12 hours

**Tasks:**

#### 1. Critical Blocker Fixes (6-8 hours)

**CB-1: Transaction Integrity** (3-4 hours)
- [ ] Create `004_profile_transactions.sql` migration
- [ ] Implement `create_master_profile()` RPC function
  - Parameters: `p_profile JSONB`, `p_experiences JSONB`, `p_skills JSONB`
  - Returns: `UUID` (profile_id)
  - Logic: BEGIN transaction → INSERT profile → INSERT experiences → INSERT skills → COMMIT
  - Error handling: EXCEPTION → ROLLBACK
- [ ] Implement `update_master_profile()` RPC function
  - Parameters: `p_profile_id UUID`, `p_expected_version INT`, `p_updates JSONB`
  - Returns: `JSONB` (success, current_version, error_message)
  - Logic: Lock row → Check version → Update → Increment version
- [ ] Grant EXECUTE permissions to authenticated + anon roles
- [ ] Test RPC functions in Supabase SQL Editor

**CB-9: RLS Security Hole** (2 hours)
- [ ] Create `005_security_locking.sql` migration
- [ ] Add `session_id TEXT` column to `master_profiles`
- [ ] Update RLS policies to check session_id for pre-auth profiles
- [ ] Implement `claim_profile()` RPC function (transfer ownership on login)
- [ ] Test: User A cannot see User B's profiles (even with NULL user_id)

**CB-3: Soft Deletes** (1 hour)
- [ ] Add `deleted_at TIMESTAMPTZ` to master_profiles, work_experiences, skills
- [ ] Implement `soft_delete_profile()` RPC function
- [ ] Update RLS policies to exclude soft-deleted records
- [ ] Test: Deleted profile hidden from lists but data retained

**CB-2: Optimistic Locking** (1 hour)
- [ ] Create `check_version_conflict()` trigger function
- [ ] Apply trigger to master_profiles and work_experiences
- [ ] Test: Concurrent update raises ERRCODE 40001

#### 2. Database Schema (2-3 hours)

- [ ] Run migrations in order: 004 → 005 → 006
- [ ] Verify tables created in Supabase Table Editor
- [ ] Insert test data manually
- [ ] Verify RLS policies (SET ROLE authenticated, test queries)
- [ ] Document any schema changes in TechnicalDiscussion.md

**Exit Criteria:**
- ✅ All 4 critical blockers resolved
- ✅ RPC functions working
- ✅ RLS policies tested (no unauthorized access)
- ✅ Soft deletes functional

---

### Sprint 2 (Week 2) - Frontend + Migration

**Goal:** Build single-page form + import/export

**Total Effort:** 8-10 hours

**Tasks:**

#### 3. Frontend Components (6-8 hours)

**US-1.1: Create Profile Manually** (4 hours)
- [ ] Create `ProfileForm.vue` component
  - Single-page form with collapsible sections
  - Sections: Basic Info, Summary, Work Experience, Skills
  - Zod schema for validation (match database constraints)
  - VeeValidate for form handling
- [ ] Create `useProfilesStore` Pinia store
  - Action: `createProfile()` → Call `create_master_profile()` RPC
  - Action: `fetchProfile()` → SELECT with nested data
  - Optimistic UI pattern (immediate feedback, rollback on error)
- [ ] Create `useAutoSave()` composable
  - localStorage auto-save every 30 seconds
  - Draft restoration on page load
  - Clear draft on successful save
- [ ] Error translation layer
  - Map Supabase error codes to user-friendly messages
  - Display in toast notifications

**US-1.2: View Profile** (1 hour)
- [ ] Create `ProfileView.vue` component
  - Display all profile sections
  - "Edit" button → Navigate to ProfileForm
  - Semantic HTML for accessibility

**US-2.1: Edit Profile** (2 hours)
- [ ] Reuse `ProfileForm.vue` with `:is-editing="true"` prop
  - Pre-fill form with existing data
  - Call `update_master_profile()` RPC with version checking
  - Handle version conflicts (show "Profile was modified" message)
- [ ] Optimistic UI for updates

**US-2.2: Delete Profile** (1 hour)
- [ ] Add "Delete" button with confirmation modal
  - Call `soft_delete_profile()` RPC
  - Redirect to home page
  - Success message

#### 4. Migration Scripts (2-3 hours)

**US-3.1: Import from Markdown** (2 hours)
- [ ] Create `migrate_to_db.py` script
  - Parse `01_Profile/master_profile.md`
  - Extract: basic info, summary, experiences, skills
  - Map to database schema
  - `--dry-run` flag for preview
  - Call `create_master_profile()` RPC
  - Backup original file
- [ ] Test with actual master_profile.md
- [ ] Validate imported data matches source

**US-3.2: Export to Markdown** (1 hour)
- [ ] Implement `export_profile_markdown()` RPC function (migration 006)
  - Generate markdown from database
  - Match exact format of current master_profile.md
- [ ] Add "Export" button in frontend
  - Call RPC function
  - Download as .md file

**Exit Criteria:**
- ✅ Can create profile via web form (<5 min)
- ✅ Can edit and delete profiles
- ✅ Auto-save prevents data loss
- ✅ Import markdown → database works
- ✅ Export database → markdown works
- ✅ Backward compatibility verified (CV scripts still work)

---

### Phase 1 MVP Deliverable

**What You'll Have After 2 Weeks:**

1. **Working Database**
   - RLS-secured master_profiles, work_experiences, skills tables
   - Atomic transaction RPC functions
   - Soft deletes with 30-day recovery
   - Session-based pre-auth security

2. **Functional Web UI**
   - Single-page profile form (create/edit)
   - View profile details
   - Delete profile with confirmation
   - Auto-save to localStorage
   - User-friendly error messages

3. **Migration Tools**
   - Import existing markdown profile
   - Export database profile to markdown
   - Backward compatibility maintained

4. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support

**What You WON'T Have (Deferred to Phase 2/3):**
- ❌ Multiple profiles per user
- ❌ Multi-step wizard
- ❌ CV upload + AI extraction
- ❌ Profile versioning / history
- ❌ Analytics dashboard

---

## 3. Phase 2 & 3 (Deferred / Optional)

### Phase 2: Enhanced Features (Week 3-4, OPTIONAL)

**Status:** ⏳ Deferred - Only proceed if Phase 1 MVP proves insufficient

**Potential Features:**
- Multiple profiles per user
- Profile duplication / templates
- Advanced validation (complex business rules)
- Enhanced skill management (autocomplete, suggestions)
- Profile comparison view
- Additional tables: education, certifications, languages, achievements

**Decision Criteria:**
- Phase 1 used for 1+ month
- User actively requests multiple profiles
- Clear pain points identified

---

### Phase 3: AI CV Extraction (Week 5-6, OPTIONAL)

**Status:** ⏳ Deferred - Nice-to-have, not critical

**Goal:** Automated profile creation from CV upload

**Architecture:** Client-side extraction (pdf.js + Anthropic API)

**Features:**
- CV file upload (PDF, DOCX)
- AI extraction with Claude API
- Pre-filled form with confidence scoring
- User review and correction

**Decision Criteria:**
- Profile creation time still >5 minutes after Phase 1
- Multiple new profiles needed frequently
- Clear ROI for development effort

---

## 4. Database Implementation

### 4.1 Migration Strategy

**Three separate migration files** (004, 005, 006) for logical separation:

1. **004_profile_transactions.sql** - Core tables + RPC functions for transactions
2. **005_security_locking.sql** - Security fixes + soft deletes + optimistic locking
3. **006_indexes_export.sql** - Performance indexes + markdown export

**Why 3 migrations?**
- Easier to review and test separately
- Can rollback specific changes if needed
- Matches critical blocker fixes (CB-1, CB-9, CB-3)

---

### 4.2 Migration Files

**Note:** Actual SQL files will be created in separate task. See:
- `app/supabase/migrations/004_profile_transactions.sql`
- `app/supabase/migrations/005_security_locking.sql`
- `app/supabase/migrations/006_indexes_export.sql`

**Migration 004: Core Tables + Transactions**
```sql
-- Tables: master_profiles, work_experiences, skills
-- RPC Functions:
--   - create_master_profile(p_profile, p_experiences, p_skills) → UUID
--   - update_master_profile(p_profile_id, p_expected_version, p_updates) → JSONB
--   - soft_delete_profile(p_profile_id) → VOID
-- Permissions: GRANT EXECUTE to authenticated, anon
```

**Migration 005: Security + Locking**
```sql
-- Columns: session_id, deleted_at
-- Triggers: check_version_conflict() on UPDATE
-- RPC Function: claim_profile(p_session_id) → UUID
-- Updated RLS policies: Fix NULL user_id security hole
```

**Migration 006: Performance + Export**
```sql
-- Indexes: Composite indexes for RLS queries
-- RPC Function: export_profile_markdown(p_profile_id) → TEXT
```

---

### 4.3 Running Migrations

**Step 1: Run in Supabase Dashboard**
1. Open Supabase Dashboard → SQL Editor
2. Run migrations in order: 004 → 005 → 006
3. Verify success in Table Editor

**Step 2: Verify Tables Created**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('master_profiles', 'work_experiences', 'skills');

-- Expected: 3 rows
```

**Step 3: Verify RPC Functions**
```sql
-- List all RPC functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%profile%';

-- Expected:
-- create_master_profile, FUNCTION
-- update_master_profile, FUNCTION
-- soft_delete_profile, FUNCTION
-- claim_profile, FUNCTION
-- export_profile_markdown, FUNCTION
```

**Step 4: Test RLS Policies**
```sql
-- Simulate authenticated user
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'test-user-uuid';

-- Try to create profile (should succeed)
SELECT create_master_profile(
  '{"profile_name": "Test", "full_name": "Test User", "email": "test@example.com", "location": "Bangkok", "professional_summary": "Test summary with more than 50 characters to pass validation"}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
);

-- Reset role
RESET ROLE;
```

---

### 4.4 Rollback Strategy

**If migration fails or needs rollback:**

```sql
BEGIN;

-- Drop in reverse order
DROP FUNCTION IF EXISTS export_profile_markdown CASCADE;
DROP FUNCTION IF EXISTS claim_profile CASCADE;
DROP FUNCTION IF EXISTS soft_delete_profile CASCADE;
DROP FUNCTION IF EXISTS update_master_profile CASCADE;
DROP FUNCTION IF EXISTS create_master_profile CASCADE;
DROP FUNCTION IF EXISTS check_version_conflict CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS work_experiences CASCADE;
DROP TABLE IF EXISTS master_profiles CASCADE;

COMMIT;
```

**Note:** This deletes all profile data. Only use if migration completely failed.

---

## 4. Frontend Implementation

### 4.1 Architecture Pattern

**Direct Supabase Client:**

```typescript
// NO worker API calls needed!
// Frontend uses Supabase client directly

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create profile
const { data, error } = await supabase
  .from('master_profiles')
  .insert({
    profile_name: 'My Profile',
    full_name: 'John Doe',
    email: 'john@example.com',
    // ...
  })
  .select()
  .single();

// RLS policies automatically enforce user_id matching
```

**No REST API handlers in workers!** Everything goes through Supabase client with RLS protection.

### 4.2 Phase 1 Components

**File Structure:**

```
/Users/user/Documents/cari-kerja/app/frontend/src/
├── views/
│   ├── ProfilesView.vue           # List profiles
│   └── ProfileCreateView.vue      # Create/edit form
├── components/
│   └── profile/
│       ├── ProfileForm.vue        # Basic form (Phase 1)
│       └── ProfileCard.vue        # Display card
├── stores/
│   └── profiles.ts                # Pinia store
└── composables/
    └── useSupabase.ts             # Supabase client wrapper
```

**Implementation:**

```typescript
// stores/profiles.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export const useProfilesStore = defineStore('profiles', () => {
  const profiles = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function createProfile(profileData) {
    loading.value = true;
    error.value = null;

    try {
      // Insert profile
      const { data: profile, error: profileError } = await supabase
        .from('master_profiles')
        .insert({
          profile_name: profileData.profile_name,
          full_name: profileData.full_name,
          email: profileData.email,
          location: profileData.location,
          professional_summary: profileData.professional_summary,
          years_of_experience: profileData.years_of_experience,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Insert work experiences
      if (profileData.work_experiences?.length > 0) {
        const experiences = profileData.work_experiences.map((exp, idx) => ({
          profile_id: profile.id,
          ...exp,
          display_order: idx,
        }));

        const { error: expError } = await supabase
          .from('work_experiences')
          .insert(experiences);

        if (expError) throw expError;
      }

      // Insert skills
      if (profileData.skills?.length > 0) {
        const skills = profileData.skills.map((skill, idx) => ({
          profile_id: profile.id,
          ...skill,
          display_order: idx,
        }));

        const { error: skillError } = await supabase
          .from('skills')
          .insert(skills);

        if (skillError) throw skillError;
      }

      return profile;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfiles() {
    loading.value = true;

    const { data, error: fetchError } = await supabase
      .from('master_profiles')
      .select(`
        *,
        work_experiences (*),
        skills (*)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      error.value = fetchError.message;
    } else {
      profiles.value = data;
    }

    loading.value = false;
  }

  return { profiles, loading, error, createProfile, fetchProfiles };
});
```

---

## 5. Optional: AI Extraction

### 5.1 Client-Side Approach (Recommended)

**Why client-side?**
- No Cloudflare Workers Node.js compatibility issues
- Faster feedback (no polling)
- Simpler architecture
- Free (no worker execution costs)

**Implementation:**

```typescript
// composables/useCVExtraction.ts
import { ref } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import Anthropic from '@anthropic-ai/sdk';

export function useCVExtraction() {
  const extracting = ref(false);
  const progress = ref(0);
  const error = ref(null);

  async function extractFromPDF(file: File) {
    extracting.value = true;
    progress.value = 0;
    error.value = null;

    try {
      // Step 1: Extract text from PDF (10% progress)
      progress.value = 10;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
        progress.value = 10 + (i / pdf.numPages) * 30; // 10-40%
      }

      // Step 2: Call Anthropic API (40% progress)
      progress.value = 40;
      const anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `Extract structured profile data from this CV. Return JSON only.

CV Text:
${fullText}

Extract:
{
  "full_name": "string",
  "email": "string",
  "phone_primary": "string",
  "location": "string",
  "professional_summary": "string (2-3 sentences)",
  "years_of_experience": number,
  "work_experiences": [
    {
      "company_name": "string",
      "position_title": "string",
      "location": "string",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD or null",
      "is_current": boolean,
      "description": "string"
    }
  ],
  "skills": [
    {
      "skill_name": "string",
      "category": "string",
      "proficiency_level": "Expert|Advanced|Intermediate|Beginner"
    }
  ]
}`,
          },
        ],
      });

      progress.value = 80;

      // Step 3: Parse response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to extract JSON from AI response');

      const extractedData = JSON.parse(jsonMatch[0]);
      progress.value = 100;

      return extractedData;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      extracting.value = false;
    }
  }

  return { extracting, progress, error, extractFromPDF };
}
```

**Usage in Component:**

```vue
<script setup>
import { ref } from 'vue';
import { useCVExtraction } from '@/composables/useCVExtraction';

const { extracting, progress, extractFromPDF } = useCVExtraction();
const formData = ref({});

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const extracted = await extractFromPDF(file);
    formData.value = extracted; // Pre-fill form
  } catch (error) {
    console.error('Extraction failed:', error);
    // Show error toast
  }
}
</script>

<template>
  <div>
    <input
      type="file"
      accept=".pdf"
      @change="handleFileUpload"
      :disabled="extracting"
    />
    <div v-if="extracting">
      Analyzing CV... {{ progress }}%
    </div>
  </div>
</template>
```

---

## 6. Testing Strategy

### 6.1 Manual Testing (MVP)

**Phase 1 Testing Checklist:**

- [ ] **Profile Creation**
  - Create profile with all required fields
  - Verify appears in Supabase Table Editor
  - Check timestamps are correct

- [ ] **RLS Policies**
  - Open browser DevTools → Application → Local Storage
  - Copy Supabase auth token
  - Try accessing with different user_id → should fail

- [ ] **Work Experiences**
  - Add 3 work experiences
  - Verify `display_order` is correct
  - Test date validation (end_date >= start_date)

- [ ] **Skills**
  - Add 10 skills with categories
  - Try adding duplicate skill → should fail (unique constraint)

- [ ] **Update Profile**
  - Edit profile name
  - Verify `updated_at` timestamp changes
  - Check `version` increments (optimistic locking)

**No automated tests needed for MVP.** Add later if the feature grows complex.

### 6.2 Future Testing (Phase 2+)

If you want automated tests later:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

```typescript
// stores/__tests__/profiles.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useProfilesStore } from '../profiles';

describe('ProfilesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('creates a profile', async () => {
    const store = useProfilesStore();
    // Mock Supabase client
    // ... test create logic
  });
});
```

But for now, **manual testing is fine** for a solo MVP.

---

## 7. Deployment Plan

### 7.1 Current Setup

**Infrastructure:**
- **Frontend:** Cloudflare Pages (`cari-kerja.pages.dev`)
- **Worker:** Cloudflare Workers (`job-kanban-worker`)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (for future CV uploads)

**No staging environment.** Deploy directly to production (acceptable for solo project).

### 7.2 Deployment Steps

**Step 1: Database Migration**

```bash
# Option A: Supabase Dashboard (easiest)
1. Open https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Paste migration SQL from Section 3.1
3. Click "Run"
4. Verify tables in Table Editor

# Option B: Supabase CLI (if you prefer)
cd /Users/user/Documents/cari-kerja/app/supabase
supabase db push
```

**Step 2: Deploy Frontend**

```bash
cd /Users/user/Documents/cari-kerja/app/frontend

# Build
bun run build

# Deploy (auto-deploys if connected to git)
git add .
git commit -m "feat: add master profile creation UI"
git push origin main

# Cloudflare Pages auto-deploys from git
# Wait 2-3 minutes, then visit: https://cari-kerja.pages.dev
```

**Step 3: Verify**

- Visit your app
- Try creating a profile
- Check Supabase Dashboard → Table Editor → `master_profiles` → should see your profile

**No worker deployment needed** (unless you added Phase 3 AI extraction as background task).

### 7.3 Rollback

If something breaks:

```sql
-- In Supabase SQL Editor, run:
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS work_experiences CASCADE;
DROP TABLE IF EXISTS master_profiles CASCADE;
```

Then re-deploy previous frontend version via git revert.

---

## Implementation Checklist

### Phase 1: Manual Entry MVP
- [ ] Create migration `004_add_master_profiles.sql`
- [ ] Run migration in Supabase Dashboard
- [ ] Verify tables created
- [ ] Create Pinia store (`stores/profiles.ts`)
- [ ] Create basic profile form component
- [ ] Test profile creation
- [ ] Test RLS policies
- [ ] Deploy to production

### Phase 2: Full Wizard
- [ ] Create migration `005_add_profile_details.sql` (education, certs, etc.)
- [ ] Build multi-step wizard component
- [ ] Add Zod validation schemas
- [ ] Implement auto-save composable
- [ ] Add form validation with VeeValidate
- [ ] Test complete workflow
- [ ] Deploy

### Phase 3: AI Extraction (Optional)
- [ ] Install `pdfjs-dist` and `@anthropic-ai/sdk`
- [ ] Create file upload component
- [ ] Implement PDF text extraction
- [ ] Create AI extraction composable
- [ ] Add extraction progress UI
- [ ] Test with real CVs
- [ ] Deploy

---

## Key Differences from Original Plan

| Original Plan | This Plan | Reason |
|---------------|-----------|--------|
| 5-person team, 6 weeks | Solo developer, 4-6 weeks part-time | Reality check |
| REST API in worker | Direct Supabase client | Actual architecture |
| Node.js Buffer API for PDF | Web APIs (pdfjs-dist) | Cloudflare Workers compatibility |
| Complex migration runbook | Simple Supabase Dashboard SQL | Solo project, no downtime concerns |
| Playwright E2E tests | Manual testing | MVP priority |
| Staging environment | Direct to production | No staging exists yet |
| ProfileService class | Direct Supabase calls | Simpler, fewer abstractions |
| Monitoring & observability | Use Supabase built-in metrics | No need for custom monitoring yet |

---

**Ready to start!** 🚀

Begin with Phase 1, get it working, then decide if you want Phase 2 and 3 based on actual usage.

---

**Last Updated:** October 5, 2025
**Version:** 2.0 (Solo Developer Edition)
