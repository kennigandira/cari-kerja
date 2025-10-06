<script setup lang="ts">
/**
 * WaitingForCallFields Component
 *
 * Displays submission timestamp
 * Phase 2 will add AI interview prep suggestions
 */

import { computed } from 'vue'
import type { Job } from '@shared/types'

interface Props {
  job: Job
}

const props = defineProps<Props>()

const daysWaiting = computed(() => {
  if (!props.job.application_submitted_at) return null

  const submittedDate = new Date(props.job.application_submitted_at)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - submittedDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
})

const submittedDateFormatted = computed(() => {
  if (!props.job.application_submitted_at) return null

  const date = new Date(props.job.application_submitted_at)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})
</script>

<template>
  <div class="space-y-4">
    <!-- Submission Info -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      <div v-if="daysWaiting !== null" class="text-center">
        <p class="text-sm text-gray-600 mb-1">Application Submitted</p>
        <p class="text-3xl font-bold text-blue-600 mb-2">
          {{ daysWaiting }} {{ daysWaiting === 1 ? 'day' : 'days' }} ago
        </p>
        <p class="text-xs text-gray-500">
          Submitted on {{ submittedDateFormatted }}
        </p>
      </div>
      <div v-else class="text-center text-sm text-gray-500">
        <p>No submission date recorded</p>
      </div>
    </div>

    <!-- Interview Prep Placeholder (Phase 2) -->
    <div class="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300">
      <p class="text-sm text-gray-600 text-center mb-2">
        ✨ AI Interview Prep Suggestions
      </p>
      <p class="text-xs text-gray-500 text-center">
        Coming in Phase 2: AI-generated interview preparation topics
      </p>
    </div>

    <!-- Helpful Tips -->
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <p class="text-xs text-yellow-800">
        💡 <strong>While you wait:</strong> Research the company culture, review the job description,
        and prepare answers to common interview questions.
      </p>
    </div>
  </div>
</template>
