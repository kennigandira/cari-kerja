<script setup lang="ts">
import { ref, computed } from 'vue'
import { APPLICATION_METHOD_LABELS } from '../../../shared/types'
import type { ApplicationMethod, JobWithDocuments } from '../../../shared/types'

const props = defineProps<{
  job: JobWithDocuments
}>()

const emit = defineEmits<{
  update: [submissionInfo: {
    application_url?: string
    application_method?: ApplicationMethod
    recruiter_email?: string
    recruiter_name?: string
    application_notes?: string
    application_deadline?: string
  }]
  markSubmitted: []
}>()

const isEditing = ref(false)
const form = ref({
  application_url: props.job.application_url || '',
  application_method: props.job.application_method || '',
  recruiter_email: props.job.recruiter_email || '',
  recruiter_name: props.job.recruiter_name || '',
  application_notes: props.job.application_notes || '',
  application_deadline: props.job.application_deadline || '',
})

const applicationMethods = Object.entries(APPLICATION_METHOD_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const showRecruiterFields = computed(() => {
  return form.value.application_method === 'email' || form.value.application_method === 'recruiter'
})

const showUrlField = computed(() => {
  return form.value.application_method === 'online_form' || form.value.application_method === 'linkedin'
})

const handleSave = () => {
  emit('update', {
    application_url: form.value.application_url || undefined,
    application_method: form.value.application_method as ApplicationMethod || undefined,
    recruiter_email: form.value.recruiter_email || undefined,
    recruiter_name: form.value.recruiter_name || undefined,
    application_notes: form.value.application_notes || undefined,
    application_deadline: form.value.application_deadline || undefined,
  })
  isEditing.value = false
}

const handleCancel = () => {
  form.value = {
    application_url: props.job.application_url || '',
    application_method: props.job.application_method || '',
    recruiter_email: props.job.recruiter_email || '',
    recruiter_name: props.job.recruiter_name || '',
    application_notes: props.job.application_notes || '',
    application_deadline: props.job.application_deadline || '',
  }
  isEditing.value = false
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const isDeadlineNear = computed(() => {
  if (!props.job.application_deadline) return false
  const deadline = new Date(props.job.application_deadline)
  const now = new Date()
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntil <= 3 && daysUntil >= 0
})
</script>

<template>
  <div class="submission-card bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
    <div class="flex justify-between items-start mb-4">
      <h3 class="text-xl font-bold text-gray-900">📮 Application Submission</h3>
      <button
        v-if="!isEditing && !job.application_submitted_at"
        @click="isEditing = true"
        class="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        {{ job.application_method ? 'Edit' : 'Add Info' }}
      </button>
    </div>

    <div v-if="!isEditing">
      <div v-if="job.application_submitted_at" class="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
        <div class="flex items-center gap-2 text-green-700">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="font-semibold">Submitted on {{ formatDate(job.application_submitted_at) }}</span>
        </div>
      </div>

      <div v-else-if="job.application_method" class="space-y-3">
        <div>
          <span class="text-sm font-semibold text-gray-600">Method:</span>
          <div class="mt-1 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium ml-2">
            {{ APPLICATION_METHOD_LABELS[job.application_method as ApplicationMethod] }}
          </div>
        </div>

        <div v-if="job.application_url">
          <span class="text-sm font-semibold text-gray-600">Apply at:</span>
          <a
            :href="job.application_url"
            target="_blank"
            rel="noopener noreferrer"
            class="block mt-1 text-blue-600 hover:text-blue-700 hover:underline truncate"
          >
            {{ job.application_url }}
          </a>
        </div>

        <div v-if="job.recruiter_email || job.recruiter_name">
          <span class="text-sm font-semibold text-gray-600">Contact:</span>
          <div class="mt-1">
            <p v-if="job.recruiter_name" class="text-gray-900">{{ job.recruiter_name }}</p>
            <a
              v-if="job.recruiter_email"
              :href="`mailto:${job.recruiter_email}`"
              class="text-blue-600 hover:text-blue-700 hover:underline"
            >
              {{ job.recruiter_email }}
            </a>
          </div>
        </div>

        <div v-if="job.application_deadline">
          <span class="text-sm font-semibold text-gray-600">Deadline:</span>
          <div class="mt-1" :class="{ 'text-red-600 font-semibold': isDeadlineNear }">
            {{ formatDate(job.application_deadline) }}
            <span v-if="isDeadlineNear" class="ml-2">⚠️ Soon!</span>
          </div>
        </div>

        <div v-if="job.application_notes">
          <span class="text-sm font-semibold text-gray-600">Notes:</span>
          <p class="mt-1 text-gray-700 text-sm">{{ job.application_notes }}</p>
        </div>

        <button
          v-if="!job.application_submitted_at"
          @click="$emit('markSubmitted')"
          class="mt-4 w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          ✓ Mark as Submitted
        </button>
      </div>

      <div v-else class="text-center py-6">
        <p class="text-gray-500 mb-3">No submission information yet</p>
        <button
          @click="isEditing = true"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Add Submission Info
        </button>
      </div>
    </div>

    <form v-else @submit.prevent="handleSave" class="space-y-4">
      <div>
        <label for="method" class="block text-sm font-semibold text-gray-700 mb-1">
          Application Method *
        </label>
        <select
          id="method"
          v-model="form.application_method"
          required
          class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select method...</option>
          <option v-for="method in applicationMethods" :key="method.value" :value="method.value">
            {{ method.label }}
          </option>
        </select>
      </div>

      <div v-if="showUrlField">
        <label for="url" class="block text-sm font-semibold text-gray-700 mb-1">
          Application URL
        </label>
        <input
          id="url"
          v-model="form.application_url"
          type="url"
          placeholder="https://..."
          class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div v-if="showRecruiterFields" class="space-y-3">
        <div>
          <label for="name" class="block text-sm font-semibold text-gray-700 mb-1">
            Recruiter Name
          </label>
          <input
            id="name"
            v-model="form.recruiter_name"
            type="text"
            placeholder="Jane Smith"
            class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label for="email" class="block text-sm font-semibold text-gray-700 mb-1">
            Recruiter Email
          </label>
          <input
            id="email"
            v-model="form.recruiter_email"
            type="email"
            placeholder="recruiter@company.com"
            class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label for="deadline" class="block text-sm font-semibold text-gray-700 mb-1">
          Application Deadline
        </label>
        <input
          id="deadline"
          v-model="form.application_deadline"
          type="date"
          class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label for="notes" class="block text-sm font-semibold text-gray-700 mb-1">
          Special Instructions
        </label>
        <textarea
          id="notes"
          v-model="form.application_notes"
          rows="3"
          placeholder="e.g., Include portfolio link in subject line"
          class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        ></textarea>
      </div>

      <div class="flex gap-3 pt-2">
        <button
          type="button"
          @click="handleCancel"
          class="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Save
        </button>
      </div>
    </form>
  </div>
</template>
