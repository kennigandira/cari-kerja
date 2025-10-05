# Frontend Implementation Guide - Master Profile Feature
**Version:** 1.0
**Date:** October 5, 2025
**Based On:** Chase (Frontend Specialist) Technical Review
**Status:** Ready for Development

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Structure](#2-component-structure)
3. [State Management (Pinia)](#3-state-management-pinia)
4. [Form Implementation](#4-form-implementation)
5. [Composables](#5-composables)
6. [Error Handling](#6-error-handling)
7. [Accessibility](#7-accessibility)
8. [Performance Optimization](#8-performance-optimization)
9. [Code Examples](#9-code-examples)

---

## 1. Architecture Overview

### 1.1 Frontend Stack

```
Vue 3 (Composition API)
  ├── Pinia (State Management)
  ├── Vue Router (Navigation)
  ├── Zod (Schema Validation)
  ├── VeeValidate (Form Handling)
  ├── Supabase Client (Direct Database Access)
  └── TailwindCSS (Styling)
```

### 1.2 Data Flow Pattern

```
User Action
    ↓
Component Event
    ↓
Pinia Store Action
    ↓
Supabase RPC Function (Atomic Transaction)
    ↓
Optimistic UI Update
    ↓
Server Response → Confirm or Rollback
    ↓
User Feedback (Success/Error Toast)
```

### 1.3 Key Architectural Decisions

**✅ Single-Page Form (NOT Multi-Step Wizard)**
- All 30-40 fields visible with collapsible sections
- Faster development, better editing UX
- Simpler state management

**✅ Direct Supabase Client Access**
- Frontend calls RPC functions directly (no worker API)
- RLS policies enforce security
- Optimistic UI with rollback pattern

**✅ Auto-Save to localStorage (NOT Database)**
- Debounced 30-second auto-save
- Prevents data loss on browser crash
- No network calls for drafts

**✅ Optimistic UI Pattern**
- Immediate user feedback
- Rollback on server error
- Loading states for transparency

---

## 2. Component Structure

### 2.1 File Organization

```
frontend/src/
├── views/
│   ├── ProfilesView.vue           # List all profiles
│   ├── ProfileCreateView.vue      # Create profile (uses ProfileForm)
│   └── ProfileEditView.vue        # Edit profile (uses ProfileForm)
├── components/
│   └── profile/
│       ├── ProfileForm.vue        # Main form component (single-page)
│       ├── ProfileView.vue        # Read-only profile display
│       ├── FormSection.vue        # Collapsible section wrapper
│       ├── WorkExperienceList.vue # Repeatable work experience inputs
│       ├── SkillManager.vue       # Skill input with lazy rendering
│       └── ConfirmModal.vue       # Delete confirmation
├── stores/
│   └── profiles.ts                # Pinia store
├── composables/
│   ├── useSupabase.ts             # Supabase client wrapper
│   ├── useAutoSave.ts             # Auto-save to localStorage
│   └── useToast.ts                # Toast notifications
└── utils/
    └── errorMessages.ts           # Error translation layer
```

### 2.2 Component Hierarchy

```
ProfileCreateView.vue
    └── ProfileForm.vue
        ├── FormSection (Basic Info)
        │   └── FormInput × 8
        ├── FormSection (Professional Summary)
        │   └── FormTextarea × 1
        ├── FormSection (Work Experience)
        │   └── WorkExperienceList
        │       └── WorkExperienceItem × N
        └── FormSection (Skills)
            └── SkillManager
                └── SkillInput × N (lazy rendered)
```

---

## 3. State Management (Pinia)

### 3.1 Profiles Store

**File:** `frontend/src/stores/profiles.ts`

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import { translateSupabaseError } from '@/utils/errorMessages';
import type { MasterProfile, WorkExperience, Skill } from '@/types';

export const useProfilesStore = defineStore('profiles', () => {
  // State
  const profiles = ref<MasterProfile[]>([]);
  const currentProfile = ref<MasterProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Actions
  async function createProfile(profileData: any) {
    loading.value = true;
    error.value = null;

    // Optimistic update: Add to local state immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticProfile = {
      id: tempId,
      ...profileData,
      _isPending: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profiles.value.unshift(optimisticProfile);

    try {
      // Call RPC function for atomic transaction
      const { data, error: rpcError } = await supabase.rpc('create_master_profile', {
        p_profile: {
          profile_name: profileData.profile_name,
          full_name: profileData.full_name,
          email: profileData.email,
          phone_primary: profileData.phone_primary,
          phone_secondary: profileData.phone_secondary,
          linkedin_url: profileData.linkedin_url,
          github_url: profileData.github_url,
          portfolio_url: profileData.portfolio_url,
          location: profileData.location,
          professional_summary: profileData.professional_summary,
          years_of_experience: profileData.years_of_experience,
          current_position: profileData.current_position,
          session_id: localStorage.getItem('session_id'), // Pre-auth support
        },
        p_experiences: profileData.work_experiences || [],
        p_skills: profileData.skills || [],
      });

      if (rpcError) throw rpcError;

      // Replace optimistic profile with real data
      const idx = profiles.value.findIndex(p => p.id === tempId);
      if (idx !== -1) {
        profiles.value[idx] = {
          id: data as string,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return data;
    } catch (err: any) {
      // Rollback optimistic update
      profiles.value = profiles.value.filter(p => p.id !== tempId);
      error.value = translateSupabaseError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfiles() {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('master_profiles')
        .select(`
          *,
          work_experiences (*),
          skills (*)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      profiles.value = data || [];
    } catch (err: any) {
      error.value = translateSupabaseError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfile(profileId: string) {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('master_profiles')
        .select(`
          *,
          work_experiences (*),
          skills (*)
        `)
        .eq('id', profileId)
        .single();

      if (fetchError) throw fetchError;

      currentProfile.value = data;
      return data;
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(profileId: string, updates: any, expectedVersion: number) {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: rpcError } = await supabase.rpc('update_master_profile', {
        p_profile_id: profileId,
        p_expected_version: expectedVersion,
        p_updates: updates,
      });

      if (rpcError) throw rpcError;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result.success) {
        if (result.error_message?.includes('conflict')) {
          throw new Error('CONFLICT:' + result.error_message);
        }
        throw new Error(result.error_message);
      }

      // Update local state
      if (currentProfile.value?.id === profileId) {
        currentProfile.value = {
          ...currentProfile.value,
          ...updates,
          version: result.current_version,
          updated_at: new Date().toISOString(),
        };
      }

      return result;
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProfile(profileId: string) {
    loading.value = true;
    error.value = null;

    try {
      const { error: rpcError } = await supabase.rpc('soft_delete_profile', {
        p_profile_id: profileId,
      });

      if (rpcError) throw rpcError;

      // Remove from local state
      profiles.value = profiles.value.filter(p => p.id !== profileId);
      if (currentProfile.value?.id === profileId) {
        currentProfile.value = null;
      }
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function exportToMarkdown(profileId: string) {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: rpcError } = await supabase.rpc('export_profile_markdown', {
        p_profile_id: profileId,
      });

      if (rpcError) throw rpcError;

      // Download as file
      const blob = new Blob([data as string], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `master_profile_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);

      return data;
    } catch (err: any) {
      error.value = translateSupabaseError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    profiles,
    currentProfile,
    loading,
    error,
    // Actions
    createProfile,
    fetchProfiles,
    fetchProfile,
    updateProfile,
    deleteProfile,
    exportToMarkdown,
  };
});
```

---

## 4. Form Implementation

### 4.1 ProfileForm.vue (Single-Page Form)

**File:** `frontend/src/components/profile/ProfileForm.vue`

```vue
<template>
  <form @submit.prevent="handleSubmit" class="max-w-4xl mx-auto p-6 space-y-8">
    <!-- Auto-save status -->
    <div v-if="autoSaveStatus" class="text-sm text-gray-500 text-right">
      {{ autoSaveStatus }}
    </div>

    <!-- Section 1: Basic Information -->
    <FormSection title="Basic Information" :is-open="true">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          v-model="formData.profile_name"
          label="Profile Name"
          name="profile_name"
          required
          :error="errors.profile_name"
          placeholder="e.g., Main Profile"
        />
        <FormInput
          v-model="formData.full_name"
          label="Full Name"
          name="full_name"
          required
          :error="errors.full_name"
        />
        <FormInput
          v-model="formData.email"
          label="Email"
          name="email"
          type="email"
          required
          :error="errors.email"
        />
        <FormInput
          v-model="formData.phone_primary"
          label="Phone (Primary)"
          name="phone_primary"
          type="tel"
          :error="errors.phone_primary"
        />
        <FormInput
          v-model="formData.linkedin_url"
          label="LinkedIn URL"
          name="linkedin_url"
          type="url"
          :error="errors.linkedin_url"
        />
        <FormInput
          v-model="formData.github_url"
          label="GitHub URL"
          name="github_url"
          type="url"
          :error="errors.github_url"
        />
        <FormInput
          v-model="formData.portfolio_url"
          label="Portfolio URL"
          name="portfolio_url"
          type="url"
          :error="errors.portfolio_url"
        />
        <FormInput
          v-model="formData.location"
          label="Location"
          name="location"
          required
          :error="errors.location"
          placeholder="e.g., Bangkok, Thailand"
        />
      </div>
    </FormSection>

    <!-- Section 2: Professional Summary -->
    <FormSection title="Professional Summary" :is-open="openSections.summary">
      <FormTextarea
        v-model="formData.professional_summary"
        label="Professional Summary"
        name="professional_summary"
        required
        rows="6"
        :error="errors.professional_summary"
        placeholder="Brief summary of your professional background (50-2000 characters)"
      />
      <div class="grid grid-cols-2 gap-4 mt-4">
        <FormInput
          v-model.number="formData.years_of_experience"
          label="Years of Experience"
          name="years_of_experience"
          type="number"
          min="0"
          max="50"
          :error="errors.years_of_experience"
        />
        <FormInput
          v-model="formData.current_position"
          label="Current Position"
          name="current_position"
          :error="errors.current_position"
        />
      </div>
    </FormSection>

    <!-- Section 3: Work Experience -->
    <FormSection title="Work Experience" :is-open="openSections.experience">
      <WorkExperienceList
        v-model="formData.work_experiences"
        :errors="errors.work_experiences"
      />
    </FormSection>

    <!-- Section 4: Skills -->
    <FormSection title="Skills" :is-open="openSections.skills">
      <SkillManager
        v-model="formData.skills"
        :errors="errors.skills"
      />
    </FormSection>

    <!-- Form Actions (Sticky Footer) -->
    <div class="sticky bottom-0 bg-white border-t p-4 flex justify-between items-center">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn-secondary"
      >
        Cancel
      </button>

      <div class="flex gap-2 items-center">
        <span v-if="loading" class="text-sm text-gray-500">
          Saving...
        </span>
        <button
          type="submit"
          :disabled="loading"
          class="btn-primary"
        >
          {{ isEditing ? 'Update Profile' : 'Create Profile' }}
        </button>
      </div>
    </div>

    <!-- Error Summary (Accessibility) -->
    <div
      v-if="Object.keys(errors).length > 0"
      role="alert"
      aria-live="assertive"
      class="sr-only"
    >
      Form has {{ Object.keys(errors).length }} error(s)
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProfilesStore } from '@/stores/profiles';
import { useAutoSave } from '@/composables/useAutoSave';
import { useToast } from '@/composables/useToast';
import { z } from 'zod';
import FormSection from './FormSection.vue';
import FormInput from '@/components/shared/FormInput.vue';
import FormTextarea from '@/components/shared/FormTextarea.vue';
import WorkExperienceList from './WorkExperienceList.vue';
import SkillManager from './SkillManager.vue';

const props = defineProps<{
  initialData?: any;
  isEditing?: boolean;
}>();

const emit = defineEmits(['submit', 'cancel']);

const router = useRouter();
const route = useRoute();
const profilesStore = useProfilesStore();
const { showToast } = useToast();

// Form state
const formData = reactive({
  profile_name: '',
  full_name: '',
  email: '',
  phone_primary: '',
  phone_secondary: '',
  linkedin_url: '',
  github_url: '',
  portfolio_url: '',
  location: '',
  professional_summary: '',
  years_of_experience: null,
  current_position: '',
  work_experiences: [],
  skills: [],
});

const errors = ref<Record<string, string>>({});
const loading = ref(false);

// Section toggle state
const openSections = reactive({
  summary: true,
  experience: true,
  skills: true,
});

// Validation schema (matches database constraints)
const profileSchema = z.object({
  profile_name: z.string().min(1, 'Profile name is required').max(255),
  full_name: z.string().min(1, 'Full name is required').max(255),
  email: z.string().email('Invalid email format').max(255),
  phone_primary: z.string().max(50).optional(),
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  github_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  location: z.string().min(1, 'Location is required').max(255),
  professional_summary: z.string()
    .min(50, 'Summary must be at least 50 characters')
    .max(2000, 'Summary must not exceed 2000 characters'),
  years_of_experience: z.number().min(0).max(50).optional().nullable(),
  current_position: z.string().max(255).optional(),
  work_experiences: z.array(z.any()).optional(),
  skills: z.array(z.any()).optional(),
});

// Auto-save to localStorage
const { autoSaveStatus, restoreDraft, clearDraft } = useAutoSave(formData, {
  storageKey: `profile-draft-${route.params.id || 'new'}`,
  delay: 30000, // 30 seconds
});

// Initialize form data
onMounted(() => {
  if (props.initialData) {
    Object.assign(formData, props.initialData);
  } else {
    // Try to restore draft
    const draft = restoreDraft();
    if (draft) {
      if (confirm('A draft was found. Would you like to restore it?')) {
        Object.assign(formData, draft);
      } else {
        clearDraft();
      }
    }
  }

  // Generate session_id for pre-auth profiles
  if (!localStorage.getItem('session_id')) {
    localStorage.setItem('session_id', crypto.randomUUID());
  }
});

async function handleSubmit() {
  loading.value = true;
  errors.value = {};

  try {
    // Validate with Zod
    const validated = profileSchema.parse(formData);

    // Submit to store
    if (props.isEditing && props.initialData?.id) {
      await profilesStore.updateProfile(
        props.initialData.id,
        validated,
        props.initialData.version
      );
      showToast('Profile updated successfully', 'success');
    } else {
      const profileId = await profilesStore.createProfile(validated);
      showToast('Profile created successfully', 'success');
      clearDraft();
      router.push(`/profiles/${profileId}`);
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      // Map Zod errors to form fields
      err.errors.forEach(error => {
        const path = error.path.join('.');
        errors.value[path] = error.message;
      });
      showToast('Please fix the errors in the form', 'error');
    } else if (err.message?.includes('CONFLICT')) {
      showToast('Profile was modified by another session. Please refresh and try again.', 'error');
    } else {
      showToast(err.message || 'Failed to save profile', 'error');
    }
  } finally {
    loading.value = false;
  }
}
</script>
```

---

## 5. Composables

### 5.1 useAutoSave

**File:** `frontend/src/composables/useAutoSave.ts`

```typescript
import { watch, ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

export function useAutoSave(formData: any, options: {
  storageKey: string;
  delay?: number;
} = { storageKey: 'draft', delay: 30000 }) {
  const { storageKey, delay = 30000 } = options;
  const autoSaveStatus = ref('');

  // Debounced save function
  const debouncedSave = useDebounceFn(() => {
    try {
      const dataToSave = JSON.parse(JSON.stringify(formData));
      localStorage.setItem(storageKey, JSON.stringify({
        data: dataToSave,
        savedAt: new Date().toISOString(),
      }));
      autoSaveStatus.value = `Draft saved at ${new Date().toLocaleTimeString()}`;

      // Clear status after 3 seconds
      setTimeout(() => {
        autoSaveStatus.value = '';
      }, 3000);
    } catch (err) {
      console.error('Auto-save failed:', err);
      autoSaveStatus.value = 'Auto-save failed (quota exceeded?)';
    }
  }, delay);

  // Watch for changes
  watch(formData, debouncedSave, { deep: true });

  // Restore draft
  function restoreDraft() {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;

    try {
      const { data, savedAt } = JSON.parse(saved);
      const savedDate = new Date(savedAt);
      const daysSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Discard drafts older than 7 days
      if (daysSince > 7) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to restore draft:', err);
      localStorage.removeItem(storageKey);
      return null;
    }
  }

  // Clear draft
  function clearDraft() {
    localStorage.removeItem(storageKey);
    autoSaveStatus.value = '';
  }

  return { autoSaveStatus, restoreDraft, clearDraft };
}
```

### 5.2 useToast

**File:** `frontend/src/composables/useToast.ts`

```typescript
import { ref } from 'vue';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const toasts = ref<Toast[]>([]);

export function useToast() {
  function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    const id = `toast-${Date.now()}`;
    toasts.value.push({ id, message, type });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id);
    }, 5000);
  }

  function dismissToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return { toasts, showToast, dismissToast };
}
```

---

## 6. Error Handling

### 6.1 Error Translation Layer

**File:** `frontend/src/utils/errorMessages.ts`

```typescript
export function translateSupabaseError(error: any): string {
  const errorMap: Record<string, string> = {
    // Auth errors
    'Invalid login credentials': 'Email or password is incorrect. Please try again.',
    'Email not confirmed': 'Please verify your email before logging in.',

    // Database constraint errors
    '23505': 'This profile name already exists. Please choose a different name.',
    '23503': 'Cannot delete this profile because it\'s linked to other data.',
    '23514': 'Invalid data format. Please check your input.',
    '42501': 'You don\'t have permission to perform this action.',

    // RLS errors
    'PGRST116': 'Data not found. It may have been deleted.',
    'PGRST301': 'Permission denied. You can only access your own data.',

    // Network errors
    'Failed to fetch': 'Network error. Please check your connection and try again.',
    'NetworkError': 'Network error. Please check your connection and try again.',

    // Optimistic locking
    '40001': 'Profile was modified by another session. Please refresh and try again.',
    'Version conflict': 'Profile was modified by another session. Please refresh and try again.',
  };

  // Check error code first
  if (error.code && errorMap[error.code]) {
    return errorMap[error.code];
  }

  // Check error message
  const message = error.message || error.toString();
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return value;
    }
  }

  // Fallback to generic message
  return 'Something went wrong. Please try again or contact support.';
}
```

---

## 7. Accessibility

### 7.1 WCAG 2.1 AA Checklist

**Required for MVP Launch:**

- [x] All form inputs have associated `<label>` elements
- [x] Error messages linked with `aria-describedby`
- [x] Invalid fields marked with `aria-invalid="true"`
- [x] Required fields marked with `aria-required="true"`
- [x] Collapsible sections use `aria-expanded` and `aria-controls`
- [x] Icon-only buttons have `aria-label`
- [x] Live region for form submission status
- [x] Keyboard navigation works for all interactive elements
- [x] Focus visible on all focusable elements
- [x] Color contrast ratio ≥ 4.5:1 (WCAG AA)
- [x] Skip link to main content

### 7.2 FormSection Component (Accessible)

**File:** `frontend/src/components/profile/FormSection.vue`

```vue
<template>
  <section
    :aria-labelledby="`section-${id}`"
    class="border rounded-lg p-4"
  >
    <button
      :id="`section-${id}`"
      type="button"
      @click="toggleOpen"
      :aria-expanded="isOpen"
      :aria-controls="`section-content-${id}`"
      class="w-full flex justify-between items-center text-left font-semibold text-lg"
    >
      <h2>{{ title }}</h2>
      <svg
        :class="{ 'rotate-180': isOpen }"
        class="w-5 h-5 transition-transform"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-show="isOpen"
      :id="`section-content-${id}`"
      role="region"
      :aria-labelledby="`section-${id}`"
      class="mt-4"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  isOpen?: boolean;
}>();

const id = Math.random().toString(36).substr(2, 9);
const isOpen = ref(props.isOpen ?? false);

function toggleOpen() {
  isOpen.value = !isOpen.value;
}
</script>
```

---

## 8. Performance Optimization

### 8.1 Lazy Rendering for Skills

**File:** `frontend/src/components/profile/SkillManager.vue`

```vue
<template>
  <div class="space-y-4">
    <!-- Search/Filter -->
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search skills..."
      class="w-full px-3 py-2 border rounded"
    />

    <!-- Skills List (lazy rendered) -->
    <TransitionGroup name="list" tag="div" class="space-y-2">
      <SkillInput
        v-for="skill in visibleSkills"
        :key="skill.id"
        v-model="skill"
        @remove="removeSkill(skill.id)"
      />
    </TransitionGroup>

    <!-- Load More Button -->
    <button
      v-if="hasMoreSkills"
      @click="loadMoreSkills"
      type="button"
      class="w-full btn-secondary"
    >
      Show {{ remainingSkillsCount }} more skills
    </button>

    <!-- Add Skill Button -->
    <button
      @click="addSkill"
      type="button"
      class="w-full btn-primary"
    >
      + Add Skill
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SkillInput from './SkillInput.vue';

const props = defineProps<{
  modelValue: any[];
}>();

const emit = defineEmits(['update:modelValue']);

const searchQuery = ref('');
const visibleCount = ref(20); // Show 20 initially

// Filter + paginate
const filteredSkills = computed(() => {
  if (!searchQuery.value) return props.modelValue;

  const query = searchQuery.value.toLowerCase();
  return props.modelValue.filter(skill =>
    skill.skill_name?.toLowerCase().includes(query) ||
    skill.category?.toLowerCase().includes(query)
  );
});

const visibleSkills = computed(() =>
  filteredSkills.value.slice(0, visibleCount.value)
);

const hasMoreSkills = computed(() =>
  filteredSkills.value.length > visibleCount.value
);

const remainingSkillsCount = computed(() =>
  filteredSkills.value.length - visibleCount.value
);

function loadMoreSkills() {
  visibleCount.value += 20;
}

function addSkill() {
  const newSkill = {
    id: `temp-${Date.now()}`,
    skill_name: '',
    category: 'Technical',
    proficiency_level: 'Intermediate',
    display_order: props.modelValue.length,
  };
  emit('update:modelValue', [...props.modelValue, newSkill]);
}

function removeSkill(id: string) {
  emit('update:modelValue', props.modelValue.filter(s => s.id !== id));
}
</script>
```

---

## 9. Code Examples

### 9.1 Complete Profile Creation Flow

```typescript
// 1. User fills form in ProfileForm.vue
// 2. User clicks "Create Profile"
// 3. Form validates with Zod
// 4. Pinia store createProfile() action called
// 5. Optimistic update: Add to local state
// 6. Call Supabase RPC: create_master_profile()
// 7. RPC function: BEGIN transaction
// 8. RPC function: INSERT profile, experiences, skills
// 9. RPC function: COMMIT transaction
// 10. Response: profile_id
// 11. Replace optimistic profile with real data
// 12. Show success toast
// 13. Clear localStorage draft
// 14. Navigate to profile view
```

### 9.2 Session-Based Pre-Auth

```typescript
// Before auth (user not logged in)
// 1. Generate session_id on first form load
const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();
localStorage.setItem('session_id', sessionId);

// 2. Include session_id when creating profile
await supabase.rpc('create_master_profile', {
  p_profile: {
    // ... profile data
    session_id: sessionId, // Pre-auth ownership
  },
});

// 3. After user logs in, claim the profile
await supabase.rpc('claim_profile', {
  p_session_id: sessionId,
});

// 4. Clean up
localStorage.removeItem('session_id');
```

### 9.3 Optimistic Locking Conflict Resolution

```typescript
async function handleConflict(profileId: string, updates: any) {
  try {
    // Attempt update with current version
    const result = await profilesStore.updateProfile(
      profileId,
      updates,
      currentVersion.value
    );
    showToast('Profile updated', 'success');
  } catch (err: any) {
    if (err.message?.includes('CONFLICT')) {
      // Fetch latest version
      const latest = await profilesStore.fetchProfile(profileId);

      // Show conflict resolution UI
      const choice = await showConflictDialog({
        current: formData,
        server: latest,
      });

      if (choice === 'overwrite') {
        // Force update with latest version
        await profilesStore.updateProfile(profileId, updates, latest.version);
      } else if (choice === 'merge') {
        // Merge changes (user chooses which fields to keep)
        const merged = await showMergeDialog(formData, latest);
        await profilesStore.updateProfile(profileId, merged, latest.version);
      }
    }
  }
}
```

---

## Next Steps

1. **Create Components** - Build Vue components following this guide
2. **Test Accessibility** - Run axe DevTools scan on all forms
3. **Manual Testing** - Test create → edit → delete flow
4. **Performance Testing** - Test with 100+ skills, measure render time
5. **Cross-Browser Testing** - Chrome, Firefox, Safari

---

**Document Version:** 1.0
**Last Updated:** October 5, 2025
**Next Review:** After Phase 1 MVP completion
