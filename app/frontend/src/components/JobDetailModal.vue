<script setup lang="ts">
/**
 * JobDetailModal Component
 *
 * Enhanced detail view for kanban job cards with:
 * - Full job information
 * - Match analysis breakdown
 * - Status-specific fields
 * - Edit/delete functionality
 * - Mobile responsive full-screen layout
 */

import { ref, computed, watch } from 'vue'
import type { Job, JobStatus } from '@/shared/types'
import { KanbanCardAPI } from '../services/kanban-api'
import { useKanbanStore } from '@/stores/kanban'
import BaseModal from './base/BaseModal.vue'
import BaseButton from './base/BaseButton.vue'
import BaseBadge from './base/BaseBadge.vue'
import ToSubmitFields from './status-fields/ToSubmitFields.vue'
import WaitingForCallFields from './status-fields/WaitingForCallFields.vue'
import InterviewingFields from './status-fields/InterviewingFields.vue'
import OfferFields from './status-fields/OfferFields.vue'
import NotNowFields from './status-fields/NotNowFields.vue'

interface Props {
  isOpen: boolean
  jobId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  delete: [jobId: string]
  statusChange: [jobId: string, newStatus: JobStatus]
}>()

// Store
const kanbanStore = useKanbanStore()

// State
const job = ref<Job | null>(null)
const isLoading = ref(false)
const isEditing = ref(false)
const error = ref<string | null>(null)

// Fetch job details when modal opens (uses cache)
const loadJobDetails = async () => {
  if (!props.jobId) return

  isLoading.value = true
  error.value = null

  try {
    job.value = await kanbanStore.getJobWithCache(props.jobId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load job details'
  } finally {
    isLoading.value = false
  }
}

// Watch for modal open and load data
watch(() => [props.isOpen, props.jobId], ([isOpen, jobId]) => {
  if (isOpen && jobId) {
    loadJobDetails()
  }
})

// Computed properties
const matchPercentageColor = computed(() => {
  if (!job.value?.match_percentage) return 'default'
  const percentage = job.value.match_percentage
  if (percentage >= 80) return 'success'
  if (percentage >= 60) return 'waiting'
  return 'not_now'
})

const currentStatus = computed({
  get: () => job.value?.status || 'processing',
  set: (newStatus: JobStatus) => {
    handleStatusChange(newStatus)
  }
})

const statusOptions: { value: JobStatus; label: string }[] = [
  { value: 'processing', label: 'Processing' },
  { value: 'to_submit', label: 'To Submit' },
  { value: 'waiting_for_call', label: 'Waiting for Call' },
  { value: 'ongoing', label: 'Interviewing' },
  { value: 'success', label: 'Offer' },
  { value: 'not_now', label: 'Not Now' }
]

// Actions
const handleClose = () => {
  isEditing.value = false
  emit('close')
}

const handleDelete = async () => {
  if (!job.value) return

  if (confirm(`Delete application for ${job.value.company_name}? This cannot be undone.`)) {
    try {
      await KanbanCardAPI.deleteJob(job.value.id)
      emit('delete', job.value.id)
      handleClose()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete job'
    }
  }
}

const handleStatusChange = (newStatus: JobStatus) => {
  if (!job.value) return
  emit('statusChange', job.value.id, newStatus)
  if (job.value) {
    job.value.status = newStatus
  }
}

const openJobUrl = () => {
  if (job.value?.original_url) {
    window.open(job.value.original_url, '_blank')
  }
}

// Status-specific component mapping
const statusComponent = computed(() => {
  if (!job.value) return null

  const statusMap: Record<JobStatus, any> = {
    processing: null, // No specific fields for processing
    to_submit: ToSubmitFields,
    waiting_for_call: WaitingForCallFields,
    ongoing: InterviewingFields,
    success: OfferFields,
    not_now: NotNowFields
  }

  return statusMap[job.value.status]
})

// Handle job updates from status components
const handleJobUpdate = async (updates: Partial<Job>) => {
  if (!job.value) return

  try {
    // Special handling for interview phase updates
    if ('interview_phase_total' in updates || 'interview_phase_current' in updates) {
      await KanbanCardAPI.updateInterviewPhase(
        job.value.id,
        updates.interview_phase_total ?? job.value.interview_phase_total ?? 0,
        updates.interview_phase_current ?? job.value.interview_phase_current ?? 0
      )
    }

    // Special handling for salary offer updates
    if ('salary_offer_amount' in updates || 'offer_benefits' in updates) {
      await KanbanCardAPI.saveSalaryOffer(
        job.value.id,
        updates.salary_offer_amount ?? job.value.salary_offer_amount ?? 0,
        updates.salary_offer_currency ?? job.value.salary_offer_currency ?? 'THB',
        updates.offer_benefits ?? job.value.offer_benefits ?? ''
      )
    }

    // Special handling for retrospective updates
    if ('retrospective_reason' in updates || 'retrospective_learnings' in updates) {
      await KanbanCardAPI.saveRetrospective(
        job.value.id,
        updates.retrospective_reason ?? job.value.retrospective_reason ?? '',
        updates.retrospective_learnings ?? job.value.retrospective_learnings ?? ''
      )
    }

    // For other updates, use generic update
    const otherUpdates: Partial<Job> = {}
    for (const key in updates) {
      if (
        !key.startsWith('interview_') &&
        !key.startsWith('salary_offer_') &&
        !key.startsWith('offer_') &&
        !key.startsWith('retrospective_')
      ) {
        otherUpdates[key as keyof Job] = updates[key as keyof Job] as any
      }
    }

    if (Object.keys(otherUpdates).length > 0) {
      await KanbanCardAPI.updateJob(job.value.id, otherUpdates)
    }

    // Merge updates into current job for immediate UI feedback
    Object.assign(job.value, updates)

    // Invalidate cache to ensure fresh data on next open
    kanbanStore.invalidateJobCache(job.value.id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update job'
  }
}

// Handle accept offer
const handleAccept = () => {
  if (!job.value) return
  handleStatusChange('success') // Keep as success or create new 'accepted' status
  // TODO: Add logic to move to accepted
}

// Handle decline offer
const handleDecline = () => {
  if (!job.value) return
  handleStatusChange('not_now')
}

// Handle archive
const handleArchive = async () => {
  if (!job.value) return

  try {
    await KanbanCardAPI.archiveJob(job.value.id)
    handleClose()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to archive job'
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    title="Job Application Details"
    size="xl"
    @close="handleClose"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-600 mb-4">{{ error }}</p>
      <BaseButton @click="loadJobDetails">Retry</BaseButton>
    </div>

    <!-- Job Details -->
    <div v-else-if="job" class="space-y-6">
      <!-- Header Section (Full Width) -->
      <div class="space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-900">
              {{ job.position_title || 'Untitled Position' }}
            </h3>
            <p class="text-xl text-gray-600 mt-1">
              {{ job.company_name || 'Unknown Company' }}
            </p>
            <p v-if="job.location" class="text-sm text-gray-500 mt-1">
              📍 {{ job.location }}
            </p>
          </div>

          <!-- Match Percentage Badge -->
          <BaseBadge
            v-if="job.match_percentage"
            :variant="matchPercentageColor"
            size="lg"
            label=""
          >
            {{ job.match_percentage }}% Match
          </BaseBadge>
        </div>

        <!-- Status Switcher -->
        <div class="flex items-center gap-3">
          <label for="status-select" class="text-sm font-medium text-gray-700">
            Status:
          </label>
          <select
            id="status-select"
            v-model="currentStatus"
            class="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <BaseButton
            v-if="job.original_url"
            variant="secondary"
            size="sm"
            @click="openJobUrl"
          >
            View Job Post ↗
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            class="text-red-600 hover:text-red-700 hover:bg-red-50"
            @click="handleDelete"
          >
            Delete
          </BaseButton>
        </div>
      </div>

      <!-- Two Column Layout (Desktop) / Stacked (Mobile) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column: Match Analysis -->
        <div class="space-y-6">
          <div v-if="job.match_analysis" class="border-t pt-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Match Analysis</h4>

            <!-- Strengths -->
            <div v-if="job.match_analysis.strengths?.length" class="mb-4">
              <h5 class="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Strengths
              </h5>
              <ul class="space-y-1">
                <li v-for="(item, index) in job.match_analysis.strengths" :key="index" class="text-sm text-gray-700 pl-6">
                  • {{ item }}
                </li>
              </ul>
            </div>

            <!-- Partial Matches -->
            <div v-if="job.match_analysis.partial_matches?.length" class="mb-4">
              <h5 class="text-sm font-medium text-yellow-700 mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                Partial Matches
              </h5>
              <ul class="space-y-1">
                <li v-for="(item, index) in job.match_analysis.partial_matches" :key="index" class="text-sm text-gray-700 pl-6">
                  • {{ item }}
                </li>
              </ul>
            </div>

            <!-- Gaps -->
            <div v-if="job.match_analysis.gaps?.length" class="mb-4">
              <h5 class="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                Gaps
              </h5>
              <ul class="space-y-1">
                <li v-for="(item, index) in job.match_analysis.gaps" :key="index" class="text-sm text-gray-700 pl-6">
                  • {{ item }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Status-Specific Fields Section -->
          <div class="border-t pt-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Application Details</h4>

            <!-- Status-specific components -->
            <component
              :is="statusComponent"
              v-if="statusComponent"
              :job="job"
              @update="handleJobUpdate"
              @accept="handleAccept"
              @decline="handleDecline"
              @archive="handleArchive"
            />

            <!-- Fallback for unknown status -->
            <div v-else class="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
              No specific fields for "{{ job.status }}" status
            </div>
          </div>
        </div>

        <!-- Right Column: Job Description -->
        <div class="space-y-6">
          <div v-if="job.job_description_text" class="border-t pt-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-3">Job Description</h4>
            <div class="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {{ job.job_description_text }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 text-gray-500">
      No job selected
    </div>
  </BaseModal>
</template>

<style scoped>
/* Mobile full-screen on small devices */
@media (max-width: 640px) {
  :deep(.modal-content) {
    max-height: 100vh;
    overflow-y: auto;
  }
}
</style>
