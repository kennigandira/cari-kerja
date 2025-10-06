<script setup lang="ts">
/**
 * ToSubmitFields Component
 *
 * Displays application readiness indicators and Apply CTA button
 */

import { computed } from 'vue'
import type { Job } from '@/shared/types'
import BaseButton from '../base/BaseButton.vue'
import BaseBadge from '../base/BaseBadge.vue'

interface Props {
  job: Job
}

const props = defineProps<Props>()

// TODO: Check if CV and cover letter documents exist
const hasCv = computed(() => {
  // Placeholder: Check if CV document exists in job_documents table
  return Boolean(props.job.folder_path)
})

const hasCoverLetter = computed(() => {
  // Placeholder: Check if cover letter document exists
  return Boolean(props.job.folder_path)
})

const canApply = computed(() => hasCv.value && hasCoverLetter.value)

const handleApply = () => {
  if (props.job.original_url) {
    window.open(props.job.original_url, '_blank')
  } else if (props.job.application_url) {
    window.open(props.job.application_url, '_blank')
  } else {
    alert('No application URL available')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Readiness Section -->
    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
      <h4 class="font-semibold text-gray-900 text-sm mb-3">Application Readiness</h4>

      <!-- CV Status -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-700">CV</span>
        <BaseBadge :variant="hasCv ? 'green' : 'red'" size="sm">
          {{ hasCv ? '✓ Ready' : '✗ Not Ready' }}
        </BaseBadge>
      </div>

      <!-- Cover Letter Status -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-700">Cover Letter</span>
        <BaseBadge :variant="hasCoverLetter ? 'green' : 'red'" size="sm">
          {{ hasCoverLetter ? '✓ Ready' : '✗ Not Ready' }}
        </BaseBadge>
      </div>
    </div>

    <!-- Apply Button -->
    <div class="flex items-center justify-center pt-2">
      <BaseButton
        variant="primary"
        size="lg"
        :disabled="!canApply"
        @click="handleApply"
        class="w-full sm:w-auto"
      >
        🚀 Apply Now!
      </BaseButton>
    </div>

    <p v-if="!canApply" class="text-xs text-center text-gray-500">
      Complete your CV and cover letter before applying
    </p>
  </div>
</template>
