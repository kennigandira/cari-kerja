# Frontend Components: Job Parser

**Version:** 1.0
**Date:** October 6, 2025
**Status:** Approved
**Related:** TechnicalArchitecture.md, APISpecification.md

---

## Overview

This document specifies the frontend components required for the AI-Powered Job Parser feature. The main component is **JobParserModal.vue**, which provides a two-step flow: Parse → Preview → Confirm.

**Tech Stack:**
- Vue 3 Composition API
- TypeScript
- Tailwind CSS
- Supabase JS Client

---

## Component Hierarchy

```
KanbanBoard.vue (existing)
├─ Header
│  └─ [+ Add Job Target] Button ← NEW
├─ KanbanColumn.vue (existing)
└─ JobParserModal.vue ← NEW
   ├─ InputStep (URL or Paste)
   ├─ LoadingState (Analyzing...)
   ├─ PreviewStep (Confirm/Edit)
   └─ ErrorState (Fallback prompt)
```

---

## Component 1: JobParserModal.vue

### File Location
`app/frontend/src/components/JobParserModal.vue`

### Props & Emits

```typescript
interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'success', jobId: string): void
}
```

### Component State

```typescript
<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { ParseJobResponse } from '@/types/job-parser'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  success: [jobId: string]
}>()

// State
const inputType = ref<'url' | 'paste'>('url')
const jobUrl = ref('')
const jobText = ref('')
const loading = ref(false)
const error = ref('')
const previewData = ref<ParseJobResponse | null>(null)
const showFallbackPrompt = ref(false)

// Computed
const inputPlaceholder = computed(() =>
  inputType.value === 'url'
    ? 'https://jobs.company.com/senior-frontend-engineer'
    : 'Paste the full job description here...'
)

const canSubmit = computed(() =>
  inputType.value === 'url' ? jobUrl.value.trim() : jobText.value.trim().length > 50
)

const isLowConfidence = computed(() =>
  previewData.value && previewData.value.confidence < 80
)
</script>
```

### Main Handler Functions

```typescript
// Parse job post
const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  previewData.value = null
  showFallbackPrompt.value = false

  try {
    const body = inputType.value === 'url'
      ? { url: jobUrl.value.trim() }
      : { text: jobText.value.trim() }

    const { data, error: fnError } = await supabase.functions.invoke<ParseJobResponse>(
      'parse-job-post',
      { body }
    )

    if (fnError) {
      handleError(fnError)
    } else {
      // Success: Show preview
      previewData.value = data
    }
  } catch (err: any) {
    error.value = 'Network error. Please check your connection.'
  } finally {
    loading.value = false
  }
}

// Handle errors with fallback
const handleError = (err: any) => {
  const errorCode = err.code || err.message

  if (errorCode === 'FETCH_FAILED' || errorCode.includes('Unable to fetch')) {
    // Fallback to manual paste
    error.value = 'Unable to access URL. Please paste the job description instead.'
    inputType.value = 'paste'
    showFallbackPrompt.value = true
  } else if (errorCode === 'LOW_CONFIDENCE') {
    // Show preview with warning
    error.value = 'Extraction confidence is low. Please review carefully.'
    previewData.value = err.extracted || null
  } else {
    // Generic error
    error.value = err.error || 'Failed to parse job post. Please try again.'
  }
}

// Confirm and save to database
const handleConfirm = async () => {
  if (!previewData.value) return

  loading.value = true
  error.value = ''

  try {
    const { data: job, error: dbError } = await supabase
      .from('jobs')
      .insert({
        input_type: inputType.value === 'url' ? 'url' : 'text',
        input_content: inputType.value === 'url' ? jobUrl.value : jobText.value,
        original_url: previewData.value.original_url,
        company_name: previewData.value.company_name,
        position_title: previewData.value.position_title,
        location: previewData.value.location,
        salary_range: previewData.value.salary_range,
        job_type: previewData.value.job_type,
        job_description_text: previewData.value.job_description_text,
        posted_date: previewData.value.posted_date,
        parsing_source: previewData.value.parsing_source,
        parsing_confidence: previewData.value.confidence,
        parsing_model: previewData.value.parsing_model,
        raw_content: previewData.value.raw_content,
        status: 'processing'
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Success
    emit('success', job.id)
    resetModal()
    emit('close')
  } catch (err: any) {
    error.value = err.message || 'Failed to save job. Please try again.'
  } finally {
    loading.value = false
  }
}

// Reset modal state
const resetModal = () => {
  inputType.value = 'url'
  jobUrl.value = ''
  jobText.value = ''
  loading.value = false
  error.value = ''
  previewData.value = null
  showFallbackPrompt.value = false
}

// Handle close
const handleClose = () => {
  resetModal()
  emit('close')
}

// Edit preview data
const handleEdit = () => {
  previewData.value = null
}
```

### Template

```vue
<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="handleClose"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-900">Add Job Target</h2>
          <button
            @click="handleClose"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            :disabled="loading"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Step 1: Input -->
          <div v-if="!previewData">
            <!-- Fallback Prompt (if URL failed) -->
            <div
              v-if="showFallbackPrompt"
              class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <p class="text-yellow-800 text-sm">
                ⚠️ Unable to access the URL. Please paste the job description manually below.
              </p>
            </div>

            <!-- Input Type Selector -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                How would you like to add this job?
              </label>
              <select
                v-model="inputType"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="loading"
              >
                <option value="url">Paste job post URL</option>
                <option value="paste">Copy & paste job description</option>
              </select>
            </div>

            <!-- URL Input -->
            <div v-if="inputType === 'url'" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Job Post URL
              </label>
              <input
                v-model="jobUrl"
                type="url"
                :placeholder="inputPlaceholder"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="loading"
                @keyup.enter="handleSubmit"
              />
              <p class="mt-2 text-sm text-gray-500">
                Example: https://jobs.company.com/senior-frontend-engineer
              </p>
            </div>

            <!-- Text Input -->
            <div v-else class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                v-model="jobText"
                :placeholder="inputPlaceholder"
                rows="10"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                :disabled="loading"
              />
              <p class="mt-2 text-sm text-gray-500">
                Paste the full job description including company name, position, and requirements.
              </p>
            </div>

            <!-- Error Message -->
            <div
              v-if="error"
              class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p class="text-red-800 text-sm">{{ error }}</p>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
              <button
                @click="handleClose"
                class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                :disabled="loading"
              >
                Cancel
              </button>
              <button
                @click="handleSubmit"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="loading || !canSubmit"
              >
                <span v-if="loading" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
                <span v-else>Parse Job Post</span>
              </button>
            </div>
          </div>

          <!-- Step 2: Preview -->
          <div v-else>
            <!-- Low Confidence Warning -->
            <div
              v-if="isLowConfidence"
              class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <p class="text-yellow-800 text-sm font-medium">
                ⚠️ Extraction confidence is low ({{ previewData.confidence }}%). Please review carefully.
              </p>
            </div>

            <!-- Preview Card -->
            <div class="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <div class="flex items-start gap-3 mb-4">
                <div class="flex-shrink-0 mt-1">
                  <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">
                    {{ previewData.position_title }}
                  </h3>
                  <p class="text-gray-600">at {{ previewData.company_name }}</p>
                </div>
                <div class="flex-shrink-0">
                  <span
                    class="px-3 py-1 text-xs font-medium rounded-full"
                    :class="{
                      'bg-green-100 text-green-800': previewData.confidence >= 90,
                      'bg-yellow-100 text-yellow-800': previewData.confidence >= 70 && previewData.confidence < 90,
                      'bg-orange-100 text-orange-800': previewData.confidence < 70
                    }"
                  >
                    {{ previewData.confidence }}% confidence
                  </span>
                </div>
              </div>

              <!-- Details -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-if="previewData.location">
                  <p class="text-sm text-gray-500">Location</p>
                  <p class="text-gray-900 font-medium">{{ previewData.location }}</p>
                </div>
                <div v-if="previewData.salary_range">
                  <p class="text-sm text-gray-500">Salary Range</p>
                  <p class="text-gray-900 font-medium">{{ previewData.salary_range }}</p>
                </div>
                <div v-if="previewData.job_type">
                  <p class="text-sm text-gray-500">Job Type</p>
                  <p class="text-gray-900 font-medium capitalize">{{ previewData.job_type }}</p>
                </div>
                <div v-if="previewData.posted_date">
                  <p class="text-sm text-gray-500">Posted Date</p>
                  <p class="text-gray-900 font-medium">{{ new Date(previewData.posted_date).toLocaleDateString() }}</p>
                </div>
              </div>

              <!-- Description Preview -->
              <div v-if="previewData.job_description_text" class="mt-4 pt-4 border-t border-gray-200">
                <p class="text-sm text-gray-500 mb-2">Description Preview</p>
                <p class="text-sm text-gray-700 line-clamp-3">
                  {{ previewData.job_description_text }}
                </p>
              </div>
            </div>

            <!-- Error Message -->
            <div
              v-if="error"
              class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p class="text-red-800 text-sm">{{ error }}</p>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
              <button
                @click="handleEdit"
                class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                :disabled="loading"
              >
                Edit
              </button>
              <button
                @click="handleConfirm"
                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="loading"
              >
                <span v-if="loading">Saving...</span>
                <span v-else>Confirm & Add to Board</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
```

---

## Component 2: KanbanBoard.vue Integration

### File Location
`app/frontend/src/components/kanban/KanbanBoard.vue`

### Changes Required

```vue
<script setup lang="ts">
// ... existing imports
import JobParserModal from '../JobParserModal.vue'

// ... existing code

// Add Job Parser modal state
const isParserModalOpen = ref(false)

// Handle job added
const handleJobAdded = async (jobId: string) => {
  console.log('Job added:', jobId)

  // Refresh kanban data
  await kanbanStore.fetchJobs()
  await kanbanStore.syncJobsToCards()

  // Show success toast (optional)
  console.log('✅ Job added successfully!')
}
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Job Application Tracker
          </h1>
          <p class="text-sm text-gray-600 mt-1">
            Manage your applications across 7 workflow stages
          </p>
        </div>

        <!-- User Info & Add Job Button -->
        <div class="flex items-center gap-4">
          <!-- ADD JOB TARGET BUTTON (NEW) -->
          <button
            @click="isParserModalOpen = true"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Job Target
          </button>

          <!-- Existing user info -->
          <div v-if="currentUser" class="flex items-center gap-2">
            <!-- ... existing code ... -->
          </div>
        </div>
      </div>
    </div>

    <!-- ... existing kanban board code ... -->

    <!-- Job Parser Modal (NEW) -->
    <JobParserModal
      :is-open="isParserModalOpen"
      @close="isParserModalOpen = false"
      @success="handleJobAdded"
    />
  </div>
</template>
```

---

## TypeScript Types

### File: `app/frontend/src/types/job-parser.ts`

```typescript
export interface ParseJobRequest {
  url?: string
  text?: string
}

export interface ParseJobResponse {
  company_name: string
  position_title: string
  location: string | null
  salary_range: string | null
  job_type: 'full-time' | 'contract' | 'remote' | 'hybrid' | null
  job_description_text: string
  posted_date: string | null
  confidence: number
  parsing_source: 'url_jina' | 'manual_paste'
  parsing_model: string
  raw_content: string
  original_url: string | null
}

export interface ParseJobError {
  error: string
  fallback?: 'manual_paste'
  code?: string
  extracted?: Partial<ParseJobResponse>
}
```

---

## Styling Guidelines

### Tailwind Classes Used

**Layout:**
- `fixed inset-0` - Full-screen overlay
- `z-50` - Above other content
- `max-w-2xl` - Modal width
- `max-h-[90vh]` - Scrollable content

**Colors:**
- `bg-blue-600` - Primary action button
- `bg-green-600` - Confirm button
- `bg-yellow-50` - Warning background
- `bg-red-50` - Error background

**Confidence Badges:**
- 90-100: `bg-green-100 text-green-800`
- 70-89: `bg-yellow-100 text-yellow-800`
- <70: `bg-orange-100 text-orange-800`

---

## Accessibility

### Keyboard Navigation

```typescript
// Close modal on Escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      handleClose()
    }
  }
  window.addEventListener('keydown', handleEscape)
  onUnmounted(() => window.removeEventListener('keydown', handleEscape))
})
```

### ARIA Labels

```vue
<div
  role="dialog"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Add Job Target</h2>
  <p id="modal-description">Parse job information from URL or manual paste</p>
</div>
```

### Focus Management

```typescript
// Focus first input when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      const firstInput = document.querySelector<HTMLInputElement>('input, textarea')
      firstInput?.focus()
    })
  }
})
```

---

## Error Handling

### Error States

1. **Network Error:** "Network error. Please check your connection."
2. **URL Fetch Failed:** "Unable to access URL. Please paste description instead." → Switch to paste mode
3. **Low Confidence:** "Extraction confidence is low. Please review." → Show preview with warning
4. **Missing Fields:** "Could not extract company/position." → Block save, require manual input
5. **Database Error:** "Failed to save job. Please try again."

---

## Testing Checklist

- [ ] Modal opens when "Add Job Target" clicked
- [ ] Dropdown switches between URL/paste modes
- [ ] URL validation (HTTPS required)
- [ ] Paste validation (minimum 50 characters)
- [ ] Loading state shows spinner
- [ ] Error messages display correctly
- [ ] Fallback prompt appears on URL failure
- [ ] Preview shows all extracted fields
- [ ] Low confidence warning displays
- [ ] Confirm saves to database
- [ ] Success triggers kanban refresh
- [ ] Modal closes on success
- [ ] Modal resets state on close
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Mobile responsive (tested on 375px width)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Frontend Team | Initial component specification |

---

**Status:** ✅ Ready for Implementation
**Next:** ImplementationPlan.md, TestingStrategy.md
