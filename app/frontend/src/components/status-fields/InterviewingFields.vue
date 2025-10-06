<script setup lang="ts">
/**
 * InterviewingFields Component
 *
 * Displays interview phase tracker with progress bar
 */

import { ref, computed } from 'vue'
import type { Job } from '@shared/types'

interface Props {
  job: Job
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<Job>]
}>()

// Local state for editing
const phaseTotal = ref(props.job.interview_phase_total || 3)
const phaseCurrent = ref(props.job.interview_phase_current || 0)

const progressPercentage = computed(() => {
  if (!phaseTotal.value || phaseTotal.value === 0) return 0
  return Math.round((phaseCurrent.value / phaseTotal.value) * 100)
})

const handleUpdate = () => {
  emit('update', {
    interview_phase_total: phaseTotal.value,
    interview_phase_current: phaseCurrent.value
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Phase Input Section -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="phase-total" class="block text-sm font-medium text-gray-700 mb-1">
          Total Phases
        </label>
        <input
          id="phase-total"
          v-model.number="phaseTotal"
          type="number"
          min="1"
          max="10"
          @blur="handleUpdate"
          class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <label for="phase-current" class="block text-sm font-medium text-gray-700 mb-1">
          Current Phase
        </label>
        <input
          id="phase-current"
          v-model.number="phaseCurrent"
          type="number"
          min="0"
          :max="phaseTotal"
          @blur="handleUpdate"
          class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        />
      </div>
    </div>

    <!-- Progress Display -->
    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">Interview Progress</span>
        <span class="text-sm font-bold text-blue-600">
          {{ phaseCurrent }} / {{ phaseTotal }}
        </span>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          class="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>

      <p class="text-xs text-center text-gray-600">
        {{ progressPercentage }}% complete
      </p>
    </div>

    <!-- Helper Text -->
    <p class="text-xs text-gray-500">
      Track your interview process by updating the current phase as you progress.
    </p>
  </div>
</template>
