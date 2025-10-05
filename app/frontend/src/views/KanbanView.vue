<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useJobsStore } from '../stores/jobs';
import { useToast } from '../composables/useToast';
import KanbanColumn from '../components/KanbanColumn.vue';
import JobInputModal from '../components/JobInputModal.vue';
import RegenerationModal from '../components/RegenerationModal.vue';
import type { JobStatus } from '../../../shared/types';

const jobsStore = useJobsStore();
const { error } = useToast();

const isInputModalOpen = ref(false);
const isRegenerationModalOpen = ref(false);
const selectedJobId = ref('');
const selectedDocumentId = ref('');
const selectedDocumentType = ref('cv');

let unsubscribe: (() => void) | null = null;

onMounted(async () => {
  await jobsStore.fetchJobs();
  unsubscribe = jobsStore.subscribeToChanges();
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

const handleAddJob = () => {
  isInputModalOpen.value = true;
};

const handleSubmitJob = async (content: string) => {
  try {
    await jobsStore.createJob(content);
    isInputModalOpen.value = false;
  } catch (err) {
    console.error('Failed to create job:', err);
    error('Failed to create job. Please try again.');
  }
};

const handlePreview = (jobId: string) => {
  // TODO: Implement preview functionality
  console.log('Preview job:', jobId);
};

const handleDownload = (_jobId: string, documentId: string) => {
  // TODO: Implement download functionality
  console.log('Download document:', documentId);
};

const handleRegenerate = (jobId: string, documentId: string) => {
  const job = jobsStore.getJobById(jobId);
  if (!job) return;

  const document = job.documents?.find(d => d.id === documentId);
  if (!document) return;

  selectedJobId.value = jobId;
  selectedDocumentId.value = documentId;
  selectedDocumentType.value = document.document_type;
  isRegenerationModalOpen.value = true;
};

const handleSubmitRegeneration = async (feedback: string) => {
  try {
    await jobsStore.requestRegeneration(
      selectedJobId.value,
      selectedDocumentId.value,
      feedback
    );
    isRegenerationModalOpen.value = false;
  } catch (err) {
    console.error('Failed to request regeneration:', err);
    error('Failed to request regeneration. Please try again.');
  }
};

const kanbanColumns: JobStatus[] = ['to_submit', 'waiting_for_call', 'ongoing'];
const finalColumns: JobStatus[] = ['success', 'not_now'];
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold text-gray-900">Job Application Tracker</h1>
          <button
            @click="handleAddJob"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            + Add Job
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="jobsStore.loading" class="text-center py-12">
        <div class="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p class="mt-4 text-gray-600">Loading jobs...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="jobsStore.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ jobsStore.error }}</p>
      </div>

      <!-- Kanban Board -->
      <div v-else>
        <!-- Processing Row -->
        <div v-if="jobsStore.jobsByStatus.processing.length > 0" class="mb-8">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Processing</h2>
          <div class="grid grid-cols-1 gap-4">
            <KanbanColumn
              status="processing"
              :jobs="jobsStore.jobsByStatus.processing"
              @preview="handlePreview"
              @download="handleDownload"
              @regenerate="handleRegenerate"
            />
          </div>
        </div>

        <!-- Main Kanban Columns -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <KanbanColumn
            v-for="status in kanbanColumns"
            :key="status"
            :status="status"
            :jobs="jobsStore.jobsByStatus[status]"
            @preview="handlePreview"
            @download="handleDownload"
            @regenerate="handleRegenerate"
          />
        </div>

        <!-- Final Status Columns -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KanbanColumn
            v-for="status in finalColumns"
            :key="status"
            :status="status"
            :jobs="jobsStore.jobsByStatus[status]"
            @preview="handlePreview"
            @download="handleDownload"
            @regenerate="handleRegenerate"
          />
        </div>
      </div>
    </main>

    <!-- Modals -->
    <JobInputModal
      :is-open="isInputModalOpen"
      @close="isInputModalOpen = false"
      @submit="handleSubmitJob"
    />

    <RegenerationModal
      :is-open="isRegenerationModalOpen"
      :job-id="selectedJobId"
      :document-id="selectedDocumentId"
      :document-type="selectedDocumentType"
      @close="isRegenerationModalOpen = false"
      @submit="handleSubmitRegeneration"
    />
  </div>
</template>
