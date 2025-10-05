<script setup lang="ts">
import { computed } from 'vue';
import type { JobWithDocuments } from '../../../shared/types';

const props = defineProps<{
  job: JobWithDocuments;
}>();

const emit = defineEmits<{
  preview: [jobId: string];
  download: [jobId: string, documentId: string];
  regenerate: [jobId: string, documentId: string];
}>();

const isProcessing = computed(() => {
  return props.job.status === 'processing' ||
    props.job.documents?.some(doc => doc.processing_status === 'processing' || doc.processing_status === 'pending');
});

const completedDocuments = computed(() => {
  return props.job.documents?.filter(doc => doc.processing_status === 'completed') || [];
});

const cvDocuments = computed(() => {
  return completedDocuments.value.filter(doc => doc.document_type === 'cv');
});

const coverLetterDocuments = computed(() => {
  return completedDocuments.value.filter(doc => doc.document_type === 'cover_letter');
});

const matchColor = computed(() => {
  const match = props.job.match_percentage || 0;
  if (match >= 80) return 'bg-green-100 text-green-800';
  if (match >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
});
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow cursor-move">
    <div class="flex justify-between items-start mb-2">
      <h3 class="text-lg font-semibold text-gray-900 line-clamp-1">
        {{ job.position_title || 'Untitled Position' }}
      </h3>
      <span
        v-if="job.match_percentage"
        :class="matchColor"
        class="px-2 py-1 rounded-full text-xs font-medium"
      >
        {{ job.match_percentage }}%
      </span>
    </div>

    <p class="text-sm text-gray-600 mb-3">{{ job.company_name || 'Unknown Company' }}</p>

    <div v-if="job.location || job.posted_date" class="flex items-center gap-2 text-xs text-gray-500 mb-3">
      <span v-if="job.location">📍 {{ job.location }}</span>
      <span v-if="job.posted_date">📅 {{ new Date(job.posted_date).toLocaleDateString() }}</span>
    </div>

    <!-- Processing Status -->
    <div v-if="isProcessing" class="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
      <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      <span class="text-sm text-blue-700">Processing CV & Cover Letter...</span>
    </div>

    <!-- Document Actions -->
    <div v-else class="space-y-2">
      <!-- CV Section -->
      <div v-if="cvDocuments.length > 0" class="border-t pt-2">
        <p class="text-xs font-medium text-gray-700 mb-1">CV Documents</p>
        <div class="space-y-1">
          <div v-for="doc in cvDocuments" :key="doc.id" class="flex items-center justify-between text-xs">
            <span class="text-gray-600 capitalize">{{ doc.version }}</span>
            <div class="flex gap-1" role="group" :aria-label="`Actions for ${doc.version} CV`">
              <button
                @click="emit('preview', job.id)"
                class="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                :aria-label="`Preview ${doc.version} CV for ${job.company_name}`"
              >
                View
              </button>
              <button
                @click="emit('download', job.id, doc.id)"
                class="px-2 py-1 text-green-600 hover:bg-green-50 rounded"
                :aria-label="`Download ${doc.version} CV for ${job.company_name}`"
              >
                <span aria-hidden="true">⬇</span>
                <span class="sr-only">Download</span>
              </button>
              <button
                @click="emit('regenerate', job.id, doc.id)"
                class="px-2 py-1 text-orange-600 hover:bg-orange-50 rounded"
                :aria-label="`Regenerate ${doc.version} CV for ${job.company_name}`"
              >
                <span aria-hidden="true">↻</span>
                <span class="sr-only">Regenerate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cover Letter Section -->
      <div v-if="coverLetterDocuments.length > 0" class="border-t pt-2">
        <p class="text-xs font-medium text-gray-700 mb-1">Cover Letters</p>
        <div class="space-y-1">
          <div v-for="doc in coverLetterDocuments" :key="doc.id" class="flex items-center justify-between text-xs">
            <span class="text-gray-600 capitalize">{{ doc.version }}</span>
            <div class="flex gap-1" role="group" :aria-label="`Actions for ${doc.version} cover letter`">
              <button
                @click="emit('preview', job.id)"
                class="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                :aria-label="`Preview ${doc.version} cover letter for ${job.company_name}`"
              >
                View
              </button>
              <button
                @click="emit('download', job.id, doc.id)"
                class="px-2 py-1 text-green-600 hover:bg-green-50 rounded"
                :aria-label="`Download ${doc.version} cover letter for ${job.company_name}`"
              >
                <span aria-hidden="true">⬇</span>
                <span class="sr-only">Download</span>
              </button>
              <button
                @click="emit('regenerate', job.id, doc.id)"
                class="px-2 py-1 text-orange-600 hover:bg-orange-50 rounded"
                :aria-label="`Regenerate ${doc.version} cover letter for ${job.company_name}`"
              >
                <span aria-hidden="true">↻</span>
                <span class="sr-only">Regenerate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
