<script setup lang="ts">
/**
 * AcceptedFields Component
 *
 * Displays congratulations message and archive option for accepted offers
 */

import type { Job } from '@/shared/types'
import BaseButton from '../base/BaseButton.vue'

interface Props {
  job: Job
}

const props = defineProps<Props>()

const emit = defineEmits<{
  archive: []
}>()

const handleArchive = () => {
  if (confirm('Archive this application? You can still access it later.')) {
    emit('archive')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Congratulations Section -->
    <div class="text-center py-8 px-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
      <div class="text-6xl mb-4">🎉</div>
      <h3 class="text-2xl font-bold text-gray-900 mb-2">
        Congratulations!
      </h3>
      <p class="text-lg text-gray-700 mb-1">
        You've accepted the offer at <span class="font-semibold">{{ job.company_name }}</span>
      </p>
      <p class="text-sm text-gray-600">
        See you next job search! Your retrospectives are saved for future reference.
      </p>
    </div>

    <!-- Archive Section -->
    <div class="flex items-center justify-center gap-3 pt-4 border-t">
      <BaseButton
        variant="secondary"
        size="sm"
        @click="handleArchive"
      >
        📦 Archive Application
      </BaseButton>
    </div>

    <!-- Offer Details (if available) -->
    <div v-if="job.salary_offer_amount" class="bg-white rounded-lg border p-4 space-y-2">
      <h4 class="font-semibold text-gray-900 text-sm">Accepted Offer Details</h4>
      <div class="text-sm text-gray-700">
        <p><span class="font-medium">Salary:</span> {{ job.salary_offer_amount?.toLocaleString() }} {{ job.salary_offer_currency || 'THB' }}</p>
        <p v-if="job.offer_benefits" class="mt-1">
          <span class="font-medium">Benefits:</span> {{ job.offer_benefits }}
        </p>
      </div>
    </div>
  </div>
</template>
