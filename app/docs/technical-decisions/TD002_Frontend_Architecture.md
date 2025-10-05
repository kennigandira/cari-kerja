# Technical Decision Document: TD002
# Frontend Architecture - Master Profile UI

**Version:** 1.0
**Date:** October 5, 2025
**Status:** Proposed
**Depends On:** TD001 (General Architecture)

---

## 1. Component Architecture

### Decision FE-001: Multi-Step Wizard for Profile Creation

**Status:** ✅ **APPROVED**

**Decision:** Use multi-step wizard for create, single-form for edit.

**Implementation:**

```
src/components/profile/
├── ProfileWizard.vue          # Wizard container (create flow)
├── steps/
│   ├── StepUploadCV.vue       # Step 1: Upload or manual choice
│   ├── StepBasicInfo.vue      # Step 2: Contact & summary
│   ├── StepWorkExperience.vue # Step 3: Jobs & achievements
│   ├── StepSkills.vue         # Step 4: Skills by category
│   ├── StepEducation.vue      # Step 5: Education & certs
│   └── StepPreview.vue        # Step 6: Review & submit
├── ProfileForm.vue            # Single-page form (edit flow)
├── sections/
│   ├── BasicInfoSection.vue
│   ├── WorkExperienceSection.vue
│   ├── SkillsSection.vue
│   ├── EducationSection.vue
│   └── CertificationsSection.vue
└── common/
    ├── FileUploader.vue
    ├── ExtractionStatus.vue
    ├── AchievementInput.vue
    └── SkillAutocomplete.vue
```

**Rationale:**
- **Create:** Wizard reduces overwhelm (100+ fields total)
- **Edit:** Single form faster for targeted changes
- **Reusable:** Sections shared between wizard and form

---

## 2. State Management

### Decision FE-002: Pinia Store Architecture

**Status:** ✅ **APPROVED**

**Implementation:**

```typescript
// src/stores/profiles.ts
export const useProfilesStore = defineStore('profiles', () => {
  const profiles = ref<MasterProfileWithDetails[]>([]);
  const currentProfile = ref<MasterProfileWithDetails | null>(null);
  const defaultProfileId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Draft state for wizard
  const draftProfile = ref<Partial<MasterProfileWithDetails> | null>(null);
  const wizardStep = ref(1);

  // Actions
  const fetchProfiles = async () => { /* ... */ };
  const createProfile = async (data: CreateMasterProfileRequest) => { /* ... */ };
  const updateProfile = async (id: string, data: UpdateMasterProfileRequest) => { /* ... */ };
  const deleteProfile = async (id: string) => { /* ... */ };
  const setDefaultProfile = async (id: string) => { /* ... */ };
  const duplicateProfile = async (id: string, newName: string) => { /* ... */ };

  // Draft management
  const saveDraft = (data: Partial<MasterProfileWithDetails>) => {
    draftProfile.value = data;
    localStorage.setItem('profile_draft', JSON.stringify(data));
  };
  const loadDraft = () => {
    const saved = localStorage.getItem('profile_draft');
    if (saved) draftProfile.value = JSON.parse(saved);
  };
  const clearDraft = () => {
    draftProfile.value = null;
    localStorage.removeItem('profile_draft');
  };

  // Computed
  const profilesByDefault = computed(() =>
    profiles.value.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
  );

  return {
    profiles, currentProfile, defaultProfileId, loading, error,
    draftProfile, wizardStep,
    fetchProfiles, createProfile, updateProfile, deleteProfile,
    setDefaultProfile, duplicateProfile,
    saveDraft, loadDraft, clearDraft,
    profilesByDefault
  };
});
```

**Auto-save Strategy:**
- Debounce 30 seconds
- Save to localStorage (draft)
- Show "Saved" indicator

---

## 3. Form Validation

### Decision FE-003: Zod Schema with VeeValidate

**Status:** ✅ **APPROVED**

**Implementation:**

```typescript
import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';

// Validation schema
const profileSchema = z.object({
  profile_name: z.string().min(1, 'Required').max(255),
  full_name: z.string().min(1, 'Required').max(255),
  email: z.string().email('Invalid email'),
  phone_primary: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone').optional(),
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  professional_summary: z.string().min(100, 'Min 100 chars').max(2000, 'Max 2000 chars'),
  // ... more fields
});

// In component
const {  values, errors, validate, handleSubmit } = useForm({
  validationSchema: toTypedSchema(profileSchema),
  initialValues: extractedData
});

const onSubmit = handleSubmit(async (values) => {
  await profilesStore.createProfile(values);
});
```

**Validation Rules:**
- Real-time on blur
- Show errors inline
- Highlight invalid fields
- Prevent submit if invalid

---

## 4. File Upload

### Decision FE-004: Progressive File Upload with Status

**Status:** ✅ **APPROVED**

**Component:** `FileUploader.vue`

```vue
<script setup lang="ts">
const uploading = ref(false);
const progress = ref(0);
const error = ref<string | null>(null);

const handleUpload = async (file: File) => {
  // Validate
  if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)) {
    error.value = 'Unsupported file type';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    error.value = 'File too large (max 5MB)';
    return;
  }

  uploading.value = true;
  try {
    // Upload to Supabase Storage with progress
    const { data, error: uploadError } = await supabase.storage
      .from('master-profile-cvs')
      .upload(`${userId}/${profileId}/${Date.now()}_${file.name}`, file, {
        onUploadProgress: (e) => {
          progress.value = (e.loaded / e.total) * 100;
        }
      });

    if (uploadError) throw uploadError;

    // Trigger extraction
    const extractionResponse = await fetch('/api/profiles/upload-cv', {
      method: 'POST',
      body: JSON.stringify({ file_path: data.path }),
    });
    const { extraction_task_id } = await extractionResponse.json();

    // Emit task ID for polling
    emit('extraction-started', extraction_task_id);
  } catch (err) {
    error.value = err.message;
  } finally {
    uploading.value = false;
  }
};
</script>

<template>
  <div class="file-uploader">
    <div v-if="!uploading" @drop.prevent="handleDrop" @dragover.prevent class="drop-zone">
      <input type="file" @change="handleFileSelect" accept=".pdf,.docx,.txt" />
      <p>Drag & drop or click to upload</p>
      <p class="text-sm text-gray-500">PDF, DOCX, TXT (max 5MB)</p>
    </div>

    <div v-else class="progress">
      <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
      <p>Uploading... {{ Math.round(progress) }}%</p>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
```

---

## 5. Extraction Status Polling

### Decision FE-005: Polling with Exponential Backoff

**Status:** ✅ **APPROVED**

```typescript
const pollExtractionStatus = async (taskId: string) => {
  let attempts = 0;
  const maxAttempts = 20; // Max 2 minutes (20 * 6s average)

  const poll = async () => {
    attempts++;
    const delay = Math.min(1000 * Math.pow(1.5, attempts), 10000); // Max 10s

    const response = await fetch(`/api/profiles/extraction/${taskId}`);
    const { status, result, error_message } = await response.json();

    if (status === 'completed') {
      // Pre-fill form with extracted data
      draftProfile.value = result;
      wizardStep.value = 2; // Go to basic info step
      return;
    }

    if (status === 'failed') {
      error.value = error_message || 'Extraction failed';
      // Show option to try again or enter manually
      return;
    }

    if (attempts >= maxAttempts) {
      error.value = 'Extraction timeout. Please try again or enter manually.';
      return;
    }

    // Continue polling
    setTimeout(poll, delay);
  };

  poll();
};
```

---

## 6. Routing

### Decision FE-006: Profile Management Routes

**Status:** ✅ **APPROVED**

```typescript
const routes = [
  // ... existing routes
  {
    path: '/profiles',
    name: 'profiles',
    component: () => import('../views/ProfilesView.vue'),
    meta: { title: 'My Profiles', requiresAuth: false }
  },
  {
    path: '/profiles/create',
    name: 'profile-create',
    component: () => import('../views/ProfileCreateView.vue'),
    meta: { title: 'Create Profile', requiresAuth: false }
  },
  {
    path: '/profiles/:id/edit',
    name: 'profile-edit',
    component: () => import('../views/ProfileEditView.vue'),
    props: true,
    meta: { title: 'Edit Profile', requiresAuth: false, validateParams: true }
  },
  {
    path: '/profiles/:id',
    name: 'profile-detail',
    component: () => import('../views/ProfileDetailView.vue'),
    props: true,
    meta: { title: 'Profile', requiresAuth: false, validateParams: true }
  },
];
```

---

## 7. UI/UX Patterns

### Decision FE-007: Design System Compliance

**Status:** ✅ **APPROVED**

**Use existing design tokens:**

```typescript
// src/composables/useDesignTokens.ts
export const useDesignTokens = () => ({
  colors: {
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-100 hover:bg-gray-200',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
  },
  spacing: {
    card: 'p-6',
    section: 'mb-8',
    input: 'px-4 py-2',
  },
  typography: {
    heading: 'text-2xl font-bold text-gray-900',
    subheading: 'text-xl font-semibold text-gray-800',
    label: 'text-sm font-medium text-gray-700',
    body: 'text-base text-gray-600',
  },
});
```

**Component Patterns:**
- Use base components from `src/components/base/`
- Consistent spacing (Tailwind classes)
- Accessible (ARIA labels, keyboard nav)
- Responsive (mobile-first)

---

## 8. Accessibility

### Decision FE-008: WCAG 2.1 AA Compliance

**Status:** ✅ **APPROVED**

**Implementation:**

```vue
<template>
  <!-- Form labels -->
  <label for="email" class="block text-sm font-medium text-gray-700">
    Email <span class="text-red-500">*</span>
  </label>
  <input
    id="email"
    type="email"
    v-model="email"
    aria-required="true"
    aria-invalid="!!errors.email"
    aria-describedby="email-error"
  />
  <p v-if="errors.email" id="email-error" class="text-red-500 text-sm" role="alert">
    {{ errors.email }}
  </p>

  <!-- Buttons -->
  <button
    type="submit"
    :disabled="loading"
    aria-busy="loading"
    class="btn-primary focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  >
    <span v-if="loading" class="sr-only">Saving...</span>
    {{ loading ? 'Saving...' : 'Save Profile' }}
  </button>
</template>
```

**Keyboard Navigation:**
- Tab order logical
- Escape closes modals
- Enter submits forms
- Arrow keys for lists

**Screen Reader Support:**
- Semantic HTML
- ARIA landmarks
- Live regions for dynamic content
- Descriptive labels

---

## 9. Performance Optimization

### Decision FE-009: Code Splitting & Lazy Loading

**Status:** ✅ **APPROVED**

```typescript
// Lazy load heavy components
const ProfileWizard = defineAsyncComponent(() =>
  import('./components/profile/ProfileWizard.vue')
);

// Lazy load routes
{
  path: '/profiles/create',
  component: () => import(/* webpackChunkName: "profile-create" */ '../views/ProfileCreateView.vue')
}

// Lazy load utilities
const { parseResume } = await import('./utils/parseResume');
```

**Bundle Analysis:**
- Main bundle: < 200KB (gzip)
- Profile routes: Separate chunk (< 100KB)
- Utilities: Lazy loaded on demand

---

## 10. Error Boundaries

### Decision FE-010: Global Error Handling

**Status:** ✅ **APPROVED**

```typescript
// src/components/ErrorBoundary.vue
<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';

const error = ref<Error | null>(null);

onErrorCaptured((err) => {
  error.value = err;
  console.error('[ErrorBoundary]', err);

  // Report to error tracking service (future)
  // Sentry.captureException(err);

  return false; // Prevent propagation
});
</script>

<template>
  <div v-if="error" class="error-boundary">
    <h2>Something went wrong</h2>
    <p>{{ error.message }}</p>
    <button @click="error = null">Try Again</button>
  </div>
  <slot v-else />
</template>
```

---

## 11. Testing Strategy

### Decision FE-011: Component Testing with Vitest

**Status:** ✅ **APPROVED**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ProfileForm from './ProfileForm.vue';

describe('ProfileForm', () => {
  it('validates email format', async () => {
    const wrapper = mount(ProfileForm);
    await wrapper.find('#email').setValue('invalid-email');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('#email-error').text()).toContain('Invalid email');
  });

  it('submits valid form', async () => {
    const submitSpy = vi.fn();
    const wrapper = mount(ProfileForm, {
      props: { onSubmit: submitSpy }
    });

    await wrapper.find('#email').setValue('test@example.com');
    await wrapper.find('form').trigger('submit');

    expect(submitSpy).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com'
    }));
  });
});
```

**Test Coverage Targets:**
- Components: 80%
- Stores: 90%
- Utils: 95%

---

## Summary of Frontend Decisions

| ID | Decision | Status |
|----|----------|--------|
| FE-001 | Multi-step wizard (create) + single form (edit) | ✅ |
| FE-002 | Pinia store with auto-save | ✅ |
| FE-003 | Zod + VeeValidate validation | ✅ |
| FE-004 | Progressive file upload | ✅ |
| FE-005 | Polling with exponential backoff | ✅ |
| FE-006 | Profile management routes | ✅ |
| FE-007 | Design system compliance | ✅ |
| FE-008 | WCAG 2.1 AA accessibility | ✅ |
| FE-009 | Code splitting & lazy loading | ✅ |
| FE-010 | Global error handling | ✅ |
| FE-011 | Component testing with Vitest | ✅ |

---

**Next:** TD003 Backend Architecture for review by foreman-backend-specialist.
