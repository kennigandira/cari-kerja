<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useJobsStore } from '../stores/jobs';
import SubmissionInfoCard from '../components/SubmissionInfoCard.vue';
import type { ApplicationMethod } from '../../../shared/types';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const jobsStore = useJobsStore();

const job = computed(() => jobsStore.getJobById(props.id));

onMounted(async () => {
  if (!job.value) {
    await jobsStore.fetchJobs();
  }
});

const goBack = () => {
  router.push('/');
};

const handleUpdateSubmission = async (submissionInfo: {
  application_url?: string;
  application_method?: ApplicationMethod;
  recruiter_email?: string;
  recruiter_name?: string;
  application_notes?: string;
  application_deadline?: string;
}) => {
  if (job.value) {
    await jobsStore.updateSubmissionInfo(job.value.id, submissionInfo);
  }
};

const handleMarkSubmitted = async () => {
  if (job.value) {
    await jobsStore.markAsSubmitted(job.value.id);
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          @click="goBack"
          class="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Kanban
        </button>
        <h1 class="text-3xl font-bold text-gray-900">{{ job?.position_title || 'Job Details' }}</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="!job" class="text-center py-12">
        <p class="text-gray-600">Job not found</p>
      </div>

      <div v-else class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="space-y-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">{{ job.company_name }}</h2>
              <p class="text-gray-600">{{ job.position_title }}</p>
            </div>

            <div v-if="job.match_percentage" class="flex items-center gap-2">
              <span class="text-gray-700 font-medium">Match:</span>
              <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {{ job.match_percentage }}%
              </span>
            </div>

            <div v-if="job.match_analysis" class="border-t pt-4">
              <h3 class="font-semibold text-gray-900 mb-2">Match Analysis</h3>

              <div v-if="job.match_analysis.strengths?.length" class="mb-4">
                <h4 class="text-sm font-medium text-green-700 mb-1">Strengths</h4>
                <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li v-for="(strength, index) in job.match_analysis.strengths" :key="index">{{ strength }}</li>
                </ul>
              </div>

              <div v-if="job.match_analysis.partial_matches?.length" class="mb-4">
                <h4 class="text-sm font-medium text-yellow-700 mb-1">Partial Matches</h4>
                <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li v-for="(match, index) in job.match_analysis.partial_matches" :key="index">{{ match }}</li>
                </ul>
              </div>

              <div v-if="job.match_analysis.gaps?.length">
                <h4 class="text-sm font-medium text-red-700 mb-1">Gaps</h4>
                <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li v-for="(gap, index) in job.match_analysis.gaps" :key="index">{{ gap }}</li>
                </ul>
              </div>
            </div>

            <div v-if="job.job_description_text" class="border-t pt-4">
              <h3 class="font-semibold text-gray-900 mb-2">Job Description</h3>
              <div class="prose prose-sm max-w-none">
                <p class="whitespace-pre-wrap text-gray-700">{{ job.job_description_text }}</p>
              </div>
            </div>
          </div>
        </div>

        <SubmissionInfoCard
          :job="job"
          @update="handleUpdateSubmission"
          @mark-submitted="handleMarkSubmitted"
        />
      </div>
    </main>
  </div>
</template>
