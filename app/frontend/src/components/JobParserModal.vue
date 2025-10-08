<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { worker } from '@/config/env'
import type {
  ParseJobRequest,
  ParseJobResponse,
  ParseJobError,
  InputType,
  ProgressState,
  ProgressStep
} from '@/types/job-parser'

// Props & Emits
const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  success: [jobId: string]
}>()

// State
const inputType = ref<InputType>('url')
const jobUrl = ref('')
const jobText = ref('')
const jobSource = ref('')
const loading = ref(false)
const error = ref('')
const previewData = ref<ParseJobResponse | null>(null)
const showFallbackPrompt = ref(false)
const progress = ref<ProgressState>({
  step: 'idle',
  message: '',
  progress: 0
})
const abortController = ref<AbortController | null>(null)

// Computed
const inputPlaceholder = computed(() =>
  inputType.value === 'url'
    ? 'https://jobs.company.com/senior-frontend-engineer'
    : 'Paste the full job description here...'
)

const canSubmit = computed(() =>
  inputType.value === 'url'
    ? jobUrl.value.trim().length > 0
    : jobText.value.trim().length > 50
)

const isLowConfidence = computed(() =>
  previewData.value && previewData.value.confidence < 80
)

const canConfirm = computed(() =>
  previewData.value !== null && jobSource.value.trim().length > 0 && jobSource.value.trim().length <= 500
)

// Helper: Get session with timeout to prevent hanging
const getSessionWithTimeout = async (timeoutMs = 5000) => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Session check timed out. Please try again.')), timeoutMs)
  )

  const sessionPromise = supabase.auth.getSession()

  return Promise.race([sessionPromise, timeoutPromise])
}

// Helper: Update progress state
const updateProgress = (step: ProgressStep, message: string, progressPercent: number) => {
  progress.value = { step, message, progress: progressPercent }
}

// Parse job post
const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  previewData.value = null
  showFallbackPrompt.value = false
  updateProgress('idle', 'Preparing...', 0)

  // Auto-fill job_source from URL input (ALWAYS, regardless of parse result)
  if (inputType.value === 'url') {
    jobSource.value = jobUrl.value.trim()
  }

  try {
    const body: ParseJobRequest = inputType.value === 'url'
      ? { url: jobUrl.value.trim() }
      : { text: jobText.value.trim() }
    console.debug( '====CEK SINI BODY', body);

    // Get auth token for Cloudflare Worker (with timeout)
    updateProgress('fetching', 'Authenticating...', 10)
    const { data: { session } } = await getSessionWithTimeout()
    console.debug( '====CEK SINI SESSION', session);

    if (!session) {
      throw new Error('Please sign in to use the job parser')
    }

    // Call Cloudflare Worker API with 40-second timeout
    // Progress: fetching (URL) → analyzing (AI) → finalizing
    if (inputType.value === 'url') {
      updateProgress('fetching', 'Fetching job posting...', 20)
    } else {
      updateProgress('analyzing', 'Analyzing job description...', 30)
    }

    const controller = new AbortController()
    abortController.value = controller
    const timeoutId = setTimeout(() => controller.abort(), 40000) // 40s timeout

    try {
      const response = await fetch(`${worker.url}/api/parse-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      // Update progress based on input type
      if (inputType.value === 'url') {
        updateProgress('analyzing', 'Analyzing with AI...', 60)
      } else {
        updateProgress('finalizing', 'Preparing preview...', 80)
      }

      console.debug('Parse response:', { status: response.status, ok: response.ok })

      // Read response as text first to handle empty bodies
      const text = await response.text()

      if (!text || text.trim().length === 0) {
        throw new Error('Server returned empty response')
      }

      // Parse JSON
      let data
      try {
        data = JSON.parse(text)
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError, 'Response:', text.substring(0, 200))
        throw new Error('Server returned invalid response')
      }

      if (!response.ok) {
        // Handle error response and stop execution
        handleError(data, response.status)
        updateProgress('idle', '', 0)
        return
      }

      // Success: Show preview
      updateProgress('done', 'Complete!', 100)
      previewData.value = data as ParseJobResponse

    } catch (fetchError: any) {
      // Handle fetch-level errors (timeout, network, etc.)
      if (fetchError.name === 'AbortError') {
        error.value = abortController.value ? 'Request cancelled by user.' : 'Request timed out after 40 seconds. The job site may be very slow. Please try manual paste instead.'
        if (!abortController.value) {
          inputType.value = 'paste'
          showFallbackPrompt.value = true
        }
      } else {
        error.value = fetchError.message || 'Network error occurred.'
      }
      console.error('Fetch error:', fetchError)
      updateProgress('idle', '', 0)
    } finally {
      clearTimeout(timeoutId)
      abortController.value = null
    }
  } catch (err: any) {
    // Catch errors from session check or other outer code
    console.error('Parse error:', err)
    error.value = err.message || 'An unexpected error occurred. Please try again.'
    updateProgress('idle', '', 0)
  } finally {
    loading.value = false
  }
}

// Cancel request
const handleCancel = () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
    loading.value = false
    updateProgress('idle', '', 0)
  }
}

// Handle errors with fallback
const handleError = (err: ParseJobError | any, status: number) => {
  // Handle empty error object (worker returns {})
  if (!err || typeof err !== 'object' || Object.keys(err).length === 0) {
    error.value = 'Server error occurred. Please try manual paste instead.'
    inputType.value = 'paste'
    showFallbackPrompt.value = true
    return
  }

  const errorCode = err.code

  // Server errors (500, 502, 503) - suggest retry or manual entry
  if (status >= 500 && status < 600) {
    error.value = err.error || 'Server temporarily unavailable. Please try again or use manual paste.'
    if (status === 500) {
      inputType.value = 'paste'
      showFallbackPrompt.value = true
    }
  } else if (status === 429) {
    // Rate limited
    error.value = 'Rate limited. Please wait a moment before trying again.'
  } else if (status === 400 && (errorCode === 'FETCH_FAILED' || err.fallback === 'manual_paste')) {
    // Fallback to manual paste
    error.value = err.error || 'Unable to access URL. Please paste the job description instead.'
    inputType.value = 'paste'
    showFallbackPrompt.value = true
  } else if (status === 422 && errorCode === 'LOW_CONFIDENCE') {
    // Show preview with warning
    error.value = 'Extraction confidence is low. Please review carefully.'
    previewData.value = err.extracted as ParseJobResponse
  } else {
    // Generic error
    error.value = err.error || `Server error (${status}). Please try again.`
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
        job_source: jobSource.value.trim(),
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
        status: 'to_submit'
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
  jobSource.value = ''
  loading.value = false
  error.value = ''
  previewData.value = null
  showFallbackPrompt.value = false
  updateProgress('idle', '', 0)
  abortController.value = null
}

// Handle close
const handleClose = () => {
  if (!loading.value) {
    resetModal()
    emit('close')
  }
}

// Edit preview data
const handleEdit = () => {
  previewData.value = null
}

// Focus first input when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      const firstInput = document.querySelector<HTMLInputElement>('input[type="url"], textarea')
      firstInput?.focus()
    })
  }
})

// Close modal on Escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen && !loading.value) {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      @click.self="handleClose"
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto" style="max-width: 42rem;">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id="modal-title" class="text-2xl font-bold text-gray-900">Add Job Target</h2>
            <p id="modal-description" class="text-sm text-gray-600 mt-1">
              Parse job information from URL or manual paste
            </p>
          </div>
          <button
            @click="handleClose"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            :disabled="loading"
            aria-label="Close modal"
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
                @keyup.enter="canSubmit && handleSubmit()"
              />
              <p class="mt-2 text-sm text-gray-500">
                <strong>⚠️ Important:</strong> Use the direct job posting URL, not search results page.
                <br>
                <span class="text-green-600">✓ Example:</span> https://linkedin.com/jobs/view/123456789
                <br>
                <span class="text-red-600">✗ Avoid:</span> https://linkedin.com/jobs/search/...
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
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                :disabled="loading"
              />
              <p class="mt-2 text-sm text-gray-500">
                Paste the full job description including company name, position, and requirements (minimum 50 characters).
              </p>
            </div>

            <!-- Progress Bar (when loading) -->
            <div v-if="loading" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium text-blue-900">{{ progress.message }}</span>
                <span class="text-xs text-blue-700">{{ progress.progress }}%</span>
              </div>
              <div class="w-full bg-blue-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${progress.progress}%` }"
                ></div>
              </div>
              <p class="mt-2 text-xs text-blue-700">
                {{ inputType === 'url' ? 'Usually takes 10-15 seconds' : 'Usually takes 5-10 seconds' }}
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
                v-if="loading"
                @click="handleCancel"
                class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                v-else
                @click="handleClose"
                class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="loading"
              >
                Cancel
              </button>
              <button
                @click="handleSubmit"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                :disabled="loading || !canSubmit"
              >
                <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span v-if="loading">{{ progress.message || 'Analyzing...' }}</span>
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

            <!-- Job Source Field (REQUIRED) -->
            <div class="mb-4 pt-4 border-t border-gray-200">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Where to Submit Application <span class="text-red-500">*</span>
              </label>
              <input
                v-model="jobSource"
                type="text"
                placeholder="e.g., jobs@company.com, https://careers.company.com, or LinkedIn"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="loading"
                maxlength="500"
              />
              <p class="mt-1 text-sm text-gray-500">
                {{ inputType === 'url' ? 'Auto-filled from URL (you can edit)' : 'URL, email, or application portal name (required)' }}
              </p>
              <p v-if="jobSource.trim().length === 0" class="mt-1 text-sm text-red-600">
                ⚠️ Required: Please specify where to submit your application
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
                @click="handleEdit"
                class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="loading"
              >
                Edit
              </button>
              <button
                @click="handleConfirm"
                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                :disabled="loading || !canConfirm"
              >
                <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
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
