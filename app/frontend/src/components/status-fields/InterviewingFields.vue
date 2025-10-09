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

// CSP-compliant progress class
const progressClass = computed(() => `progress-${progressPercentage.value}`)

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
          :class="progressClass"
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

<style scoped>
/* CSP-compliant progress bar width classes (0-100%) */
.progress-0 { width: 0%; }
.progress-1 { width: 1%; }
.progress-2 { width: 2%; }
.progress-3 { width: 3%; }
.progress-4 { width: 4%; }
.progress-5 { width: 5%; }
.progress-6 { width: 6%; }
.progress-7 { width: 7%; }
.progress-8 { width: 8%; }
.progress-9 { width: 9%; }
.progress-10 { width: 10%; }
.progress-11 { width: 11%; }
.progress-12 { width: 12%; }
.progress-13 { width: 13%; }
.progress-14 { width: 14%; }
.progress-15 { width: 15%; }
.progress-16 { width: 16%; }
.progress-17 { width: 17%; }
.progress-18 { width: 18%; }
.progress-19 { width: 19%; }
.progress-20 { width: 20%; }
.progress-21 { width: 21%; }
.progress-22 { width: 22%; }
.progress-23 { width: 23%; }
.progress-24 { width: 24%; }
.progress-25 { width: 25%; }
.progress-26 { width: 26%; }
.progress-27 { width: 27%; }
.progress-28 { width: 28%; }
.progress-29 { width: 29%; }
.progress-30 { width: 30%; }
.progress-31 { width: 31%; }
.progress-32 { width: 32%; }
.progress-33 { width: 33%; }
.progress-34 { width: 34%; }
.progress-35 { width: 35%; }
.progress-36 { width: 36%; }
.progress-37 { width: 37%; }
.progress-38 { width: 38%; }
.progress-39 { width: 39%; }
.progress-40 { width: 40%; }
.progress-41 { width: 41%; }
.progress-42 { width: 42%; }
.progress-43 { width: 43%; }
.progress-44 { width: 44%; }
.progress-45 { width: 45%; }
.progress-46 { width: 46%; }
.progress-47 { width: 47%; }
.progress-48 { width: 48%; }
.progress-49 { width: 49%; }
.progress-50 { width: 50%; }
.progress-51 { width: 51%; }
.progress-52 { width: 52%; }
.progress-53 { width: 53%; }
.progress-54 { width: 54%; }
.progress-55 { width: 55%; }
.progress-56 { width: 56%; }
.progress-57 { width: 57%; }
.progress-58 { width: 58%; }
.progress-59 { width: 59%; }
.progress-60 { width: 60%; }
.progress-61 { width: 61%; }
.progress-62 { width: 62%; }
.progress-63 { width: 63%; }
.progress-64 { width: 64%; }
.progress-65 { width: 65%; }
.progress-66 { width: 66%; }
.progress-67 { width: 67%; }
.progress-68 { width: 68%; }
.progress-69 { width: 69%; }
.progress-70 { width: 70%; }
.progress-71 { width: 71%; }
.progress-72 { width: 72%; }
.progress-73 { width: 73%; }
.progress-74 { width: 74%; }
.progress-75 { width: 75%; }
.progress-76 { width: 76%; }
.progress-77 { width: 77%; }
.progress-78 { width: 78%; }
.progress-79 { width: 79%; }
.progress-80 { width: 80%; }
.progress-81 { width: 81%; }
.progress-82 { width: 82%; }
.progress-83 { width: 83%; }
.progress-84 { width: 84%; }
.progress-85 { width: 85%; }
.progress-86 { width: 86%; }
.progress-87 { width: 87%; }
.progress-88 { width: 88%; }
.progress-89 { width: 89%; }
.progress-90 { width: 90%; }
.progress-91 { width: 91%; }
.progress-92 { width: 92%; }
.progress-93 { width: 93%; }
.progress-94 { width: 94%; }
.progress-95 { width: 95%; }
.progress-96 { width: 96%; }
.progress-97 { width: 97%; }
.progress-98 { width: 98%; }
.progress-99 { width: 99%; }
.progress-100 { width: 100%; }
</style>
