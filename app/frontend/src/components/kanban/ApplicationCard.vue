<script setup lang="ts">
/**
 * ApplicationCard Component
 *
 * Displays a single job application card with:
 * - Company name and job title
 * - Application date (if available)
 * - Visual indicators for status
 * - Mobile-friendly touch targets (44px+ height)
 */

import { computed } from 'vue'
import type { KanbanCard } from '@/types/kanban'

const props = defineProps<{
  card: KanbanCard
}>()

const emit = defineEmits<{
  delete: [cardId: string]
  click: [cardId: string, jobId: string | null]
  prefetch: [jobId: string | null]
}>()

const FORMATTED_DATE = computed(() => {
  if (!props.card.application_date) {
    return 'Not applied yet'
  }

  const date = new Date(props.card.application_date)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const HAS_APPLICATION_FOLDER = computed(() => {
  return Boolean(props.card.application_folder_path)
})

const handleCardClick = () => {
  emit('click', props.card.id, props.card.job_id)
}

const handleHover = () => {
  if (props.card.job_id) {
    emit('prefetch', props.card.job_id)
  }
}

const handleDelete = (event: Event) => {
  // Prevent card click when deleting
  event.stopPropagation()

  if (confirm(`Delete application for ${props.card.company_name}?`)) {
    emit('delete', props.card.id)
  }
}
</script>

<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-lg hover:border-blue-300 transition-all duration-200 min-h-[44px] cursor-pointer group"
    @click="handleCardClick"
    @mouseenter="handleHover"
    @focus="handleHover"
    role="button"
    tabindex="0"
    @keydown.enter="handleCardClick"
    @keydown.space.prevent="handleCardClick"
  >
    <!-- Company & Job Title -->
    <div class="mb-2">
      <h3 class="font-semibold text-gray-900 text-sm leading-tight">
        {{ card.company_name }}
      </h3>
      <p class="text-xs text-gray-600 mt-1">
        {{ card.job_title }}
      </p>
    </div>

    <!-- Application Date -->
    <div class="flex items-center justify-between text-xs text-gray-500">
      <span>{{ FORMATTED_DATE }}</span>

      <!-- Application Folder Indicator -->
      <div v-if="HAS_APPLICATION_FOLDER" class="flex items-center gap-1">
        <svg
          class="w-3 h-3 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span class="text-green-600">CV ready</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-3 flex items-center justify-between gap-2">
      <span class="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Click to view details
      </span>
      <button
        type="button"
        class="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
        @click="handleDelete"
      >
        Delete
      </button>
    </div>
  </div>
</template>
