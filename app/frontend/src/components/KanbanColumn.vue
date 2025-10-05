<script setup lang="ts">
import { computed } from 'vue';
import type { JobWithDocuments, JobStatus } from '../../../shared/types';
import { JOB_STATUS_LABELS } from '../../../shared/types';
import JobCard from './JobCard.vue';

const props = defineProps<{
  status: JobStatus;
  jobs: JobWithDocuments[];
}>();

const emit = defineEmits<{
  preview: [jobId: string];
  download: [jobId: string, documentId: string];
  regenerate: [jobId: string, documentId: string];
}>();

const columnTitle = computed(() => JOB_STATUS_LABELS[props.status]);

const columnColor = computed(() => {
  const colors: Record<JobStatus, string> = {
    processing: 'bg-gray-100 border-gray-300',
    to_submit: 'bg-blue-50 border-blue-300',
    waiting_for_call: 'bg-yellow-50 border-yellow-300',
    ongoing: 'bg-purple-50 border-purple-300',
    success: 'bg-green-50 border-green-300',
    not_now: 'bg-red-50 border-red-300',
  };
  return colors[props.status];
});
</script>

<template>
  <div :class="columnColor" class="rounded-lg border-2 p-4 min-h-[600px] flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-gray-800">{{ columnTitle }}</h2>
      <span class="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
        {{ jobs.length }}
      </span>
    </div>

    <div class="space-y-3 flex-1">
      <JobCard
        v-for="job in jobs"
        :key="job.id"
        :job="job"
        @preview="emit('preview', $event)"
        @download="emit('download', $event, $event)"
        @regenerate="emit('regenerate', $event, $event)"
      />

      <div v-if="jobs.length === 0" class="text-center text-gray-400 text-sm py-8">
        No jobs in this column
      </div>
    </div>
  </div>
</template>
