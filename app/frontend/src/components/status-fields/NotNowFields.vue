<script setup lang="ts">
/**
 * NotNowFields Component
 *
 * Captures retrospective reason and learnings for declined/rejected applications
 */

import { ref } from 'vue'
import type { Job } from '@/shared/types'

interface Props {
  job: Job
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<Job>]
}>()

// Local state
const reason = ref(props.job.retrospective_reason || '')
const learnings = ref(props.job.retrospective_learnings || '')

const reasonOptions = [
  { value: 'salary_too_low', label: 'Salary too low' },
  { value: 'culture_misfit', label: 'Culture misfit' },
  { value: 'better_offer', label: 'Better offer received' },
  { value: 'role_not_aligned', label: 'Role not aligned with goals' },
  { value: 'rejected', label: 'Application rejected' },
  { value: 'no_response', label: 'No response from company' },
  { value: 'other', label: 'Other' }
]

const handleUpdate = () => {
  emit('update', {
    retrospective_reason: reason.value,
    retrospective_learnings: learnings.value
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Why Not Now Section -->
    <div>
      <label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
        Why Not Now?
      </label>
      <select
        id="reason"
        v-model="reason"
        @change="handleUpdate"
        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
      >
        <option value="">Select a reason...</option>
        <option
          v-for="option in reasonOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- Learnings Section -->
    <div>
      <label for="learnings" class="block text-sm font-medium text-gray-700 mb-2">
        What to Improve Next Time?
      </label>
      <textarea
        id="learnings"
        v-model="learnings"
        @blur="handleUpdate"
        rows="4"
        placeholder="Document what you learned from this experience:
• Skills to develop
• Interview areas to strengthen
• Application strategy adjustments"
        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm resize-none"
      />
    </div>

    <!-- Info Box -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p class="text-xs text-blue-800">
        💡 <strong>Learning Loop:</strong> Your retrospectives help improve future applications.
        Document specific skills, preparation areas, or strategies to focus on next time.
      </p>
    </div>
  </div>
</template>
