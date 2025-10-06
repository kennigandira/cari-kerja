# Frontend Components - Enhanced Kanban Card Detail View

**Version:** 1.0
**Date:** October 6, 2025
**Framework:** Vue 3.5.22 (Composition API + TypeScript)
**Parent Feature:** Kanban Job Application Tracker

---

## Component Architecture

### Component Hierarchy

```
JobDetailModal.vue (Main Modal Container)
├── JobDetailHeader.vue (Title, Close Button, Edit/Delete Actions)
├── JobInfoSection.vue (Company, Position, Location, URL, Posted Date)
├── MatchAnalysisSection.vue (Match %, Strengths/Gaps/Partials Lists)
├── JobDescriptionSection.vue (Full Job Description)
├── StatusSwitcher.vue (Dropdown to Change Status)
│
├── ToSubmitFields.vue (Apply Button, CV/CL Readiness)
├── WaitingForCallFields.vue (Submitted Timestamp, Interview Prep AI)
├── InterviewingFields.vue (Phase Tracker, Progress Bar)
├── OfferFields.vue (Salary Input, AI Analysis, Accept/Decline CTAs)
├── NotNowFields.vue (Retrospective Form)
└── AcceptedFields.vue (Congratulations UI)
```

---

## Core Components

### 1. JobDetailModal.vue

**Purpose:** Main modal container for job card details

**Props:**
```typescript
interface Props {
  jobId: string;
  isOpen: boolean;
}
```

**Emits:**
```typescript
interface Emits {
  close: () => void;
  jobUpdated: (job: JobWithDocuments) => void;
  jobDeleted: (jobId: string) => void;
}
```

**State Management:**
```typescript
import { ref, computed, watch, onMounted } from 'vue';
import { useJobsStore } from '@/stores/jobs';
import { KanbanCardAPI } from '@/services/kanban-api';

const jobsStore = useJobsStore();
const job = ref<JobWithDocuments | null>(null);
const isLoading = ref(false);
const isEditing = ref(false);

// Fetch job on open
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    isLoading.value = true;
    job.value = await KanbanCardAPI.getJobDetail(props.jobId);
    isLoading.value = false;
  }
});

// Keyboard shortcut: ESC to close
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      emit('close');
    }
  };
  window.addEventListener('keydown', handleEscape);
  onUnmounted(() => window.removeEventListener('keydown', handleEscape));
});
```

**Template Structure:**
```vue
<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 z-40"
      @click="emit('close')"
    />
  </Transition>

  <!-- Modal -->
  <Transition name="slide-up">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="emit('close')"
    >
      <div class="min-h-screen px-4 flex items-center justify-center">
        <div
          class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <!-- Loading State -->
          <div v-if="isLoading" class="p-12 text-center">
            <LoadingSpinner />
            <p class="mt-4 text-gray-600">Loading job details...</p>
          </div>

          <!-- Content -->
          <div v-else-if="job" class="p-6 space-y-6">
            <JobDetailHeader
              :job="job"
              :is-editing="isEditing"
              @toggle-edit="isEditing = !isEditing"
              @delete="handleDelete"
              @close="emit('close')"
            />

            <JobInfoSection
              :job="job"
              :is-editing="isEditing"
              @update="handleUpdate"
            />

            <MatchAnalysisSection :match-analysis="job.match_analysis" />

            <JobDescriptionSection
              :description="job.job_description_text"
              :is-editing="isEditing"
              @update="handleUpdate"
            />

            <StatusSwitcher
              :current-status="job.status"
              @change="handleStatusChange"
            />

            <!-- Status-Specific Fields (Conditional Rendering) -->
            <ToSubmitFields
              v-if="job.status === 'to_submit'"
              :job="job"
              @apply-clicked="handleApplyClick"
            />

            <WaitingForCallFields
              v-if="job.status === 'waiting_for_call'"
              :job="job"
              @generate-prep="handleGeneratePrep"
            />

            <InterviewingFields
              v-if="job.status === 'ongoing'"
              :job="job"
              @update-phase="handleUpdatePhase"
            />

            <OfferFields
              v-if="job.status === 'success'"
              :job="job"
              @analyze-offer="handleAnalyzeOffer"
              @accept="handleAcceptOffer"
              @decline="handleDeclineOffer"
            />

            <NotNowFields
              v-if="job.status === 'not_now'"
              :job="job"
              @save-retrospective="handleSaveRetrospective"
            />

            <AcceptedFields
              v-if="job.status === 'accepted'"
              :job="job"
            />

            <!-- Coming Soon: Comments -->
            <div class="border-t pt-6">
              <div class="flex items-center gap-2 text-gray-500">
                <span class="text-lg">💬</span>
                <span class="font-medium">Comments</span>
                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Coming Soon
                </span>
              </div>
              <p class="mt-2 text-sm text-gray-500">
                Rich text comments with formatting will be available in Phase 3
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
```

**Styles:**
```vue
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* Mobile: Full screen */
@media (max-width: 640px) {
  .rounded-2xl {
    border-radius: 0;
    max-height: 100vh !important;
  }
}
</style>
```

---

### 2. Status-Specific Components

#### ToSubmitFields.vue

**Purpose:** Display application readiness and "Apply!" CTA

**Props:**
```typescript
interface Props {
  job: JobWithDocuments;
}
```

**Emits:**
```typescript
interface Emits {
  applyClicked: (jobUrl: string) => void;
}
```

**Template:**
```vue
<template>
  <div class="border-t pt-6 space-y-4">
    <h3 class="font-semibold text-gray-900">📮 Ready to Submit</h3>

    <!-- Readiness Indicators -->
    <div class="flex gap-4">
      <!-- CV Readiness -->
      <div class="flex items-center gap-2">
        <span v-if="cvStatus === 'completed'" class="text-green-600">
          ✓ CV Ready
        </span>
        <span v-else-if="cvStatus === 'processing'" class="text-yellow-600">
          ⏳ CV Processing
        </span>
        <span v-else class="text-red-600">
          ✗ No CV
        </span>
      </div>

      <!-- Cover Letter Readiness -->
      <div class="flex items-center gap-2">
        <span v-if="clStatus === 'completed'" class="text-green-600">
          ✓ Cover Letter Ready
        </span>
        <span v-else-if="clStatus === 'processing'" class="text-yellow-600">
          ⏳ Cover Letter Processing
        </span>
        <span v-else class="text-red-600">
          ✗ No Cover Letter
        </span>
      </div>
    </div>

    <!-- Apply Button -->
    <button
      @click="handleApply"
      :disabled="!canApply"
      class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
    >
      {{ canApply ? 'Apply Now! 🚀' : 'Documents Processing...' }}
    </button>

    <p v-if="job.application_url" class="text-sm text-gray-500">
      Will open: <a :href="job.application_url" target="_blank" class="text-blue-600 hover:underline">{{ job.application_url }}</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cvStatus = computed(() => {
  const cv = props.job.documents?.find(d => d.document_type === 'cv');
  return cv?.processing_status;
});

const clStatus = computed(() => {
  const cl = props.job.documents?.find(d => d.document_type === 'cover_letter');
  return cl?.processing_status;
});

const canApply = computed(() => {
  return cvStatus.value === 'completed' && clStatus.value === 'completed';
});

function handleApply() {
  if (job.application_url) {
    window.open(job.application_url, '_blank');
    emit('applyClicked', job.application_url);
  }
}
</script>
```

---

#### WaitingForCallFields.vue

**Purpose:** Show submission timestamp and AI interview prep

**Props:**
```typescript
interface Props {
  job: JobWithDocuments;
}
```

**Emits:**
```typescript
interface Emits {
  generatePrep: () => void;
}
```

**Template:**
```vue
<template>
  <div class="border-t pt-6 space-y-4">
    <h3 class="font-semibold text-gray-900">⏳ Waiting for Response</h3>

    <!-- Submitted Timestamp -->
    <div v-if="job.application_submitted_at" class="text-sm text-gray-600">
      Submitted <strong>{{ daysAgo }}</strong> days ago
      <span class="text-gray-400">({{ formattedDate }})</span>
    </div>

    <!-- Interview Prep Section -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-medium text-blue-900">📚 Interview Prep Suggestions</h4>
        <button
          v-if="!hasSuggestions"
          @click="emit('generatePrep')"
          :disabled="isGenerating"
          class="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
        >
          {{ isGenerating ? 'Generating...' : 'Get Prep ✨' }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isGenerating" class="flex items-center gap-2 text-blue-700">
        <LoadingSpinner size="sm" />
        <span class="text-sm">AI is analyzing job requirements...</span>
      </div>

      <!-- Topics Checklist -->
      <div v-else-if="hasSuggestions" class="space-y-2">
        <div
          v-for="(topic, index) in suggestions.topics"
          :key="index"
          class="flex items-start gap-2"
        >
          <input
            type="checkbox"
            :id="`topic-${index}`"
            v-model="completedTopics[index]"
            class="mt-0.5 h-4 w-4 text-blue-600 rounded"
          />
          <label :for="`topic-${index}`" class="text-sm text-gray-700">
            {{ topic }}
          </label>
        </div>

        <p class="text-xs text-gray-500 mt-3">
          Generated {{ timeAgo(suggestions.generated_at) }} by {{ suggestions.model }}
        </p>
      </div>

      <!-- Empty State -->
      <p v-else class="text-sm text-blue-700">
        Click "Get Prep" to generate AI-powered interview topics based on this job description
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatDistanceToNow } from 'date-fns';

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isGenerating = ref(false);
const completedTopics = ref<boolean[]>([]);

const daysAgo = computed(() => {
  if (!props.job.application_submitted_at) return 0;
  const submitted = new Date(props.job.application_submitted_at);
  const now = new Date();
  return Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
});

const formattedDate = computed(() => {
  if (!props.job.application_submitted_at) return '';
  return new Date(props.job.application_submitted_at).toLocaleDateString();
});

const hasSuggestions = computed(() => {
  return props.job.interview_prep_suggestions?.topics?.length > 0;
});

const suggestions = computed(() => props.job.interview_prep_suggestions || {});

function timeAgo(timestamp: string) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}
</script>
```

---

#### InterviewingFields.vue

**Purpose:** Track interview phases with progress bar

**Props:**
```typescript
interface Props {
  job: JobWithDocuments;
}
```

**Emits:**
```typescript
interface Emits {
  updatePhase: (total: number, current: number) => void;
}
```

**Template:**
```vue
<template>
  <div class="border-t pt-6 space-y-4">
    <h3 class="font-semibold text-gray-900">🎯 Interview Process</h3>

    <!-- Phase Input -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Total Phases
        </label>
        <input
          type="number"
          v-model.number="phaseTotal"
          min="1"
          max="10"
          @change="handleUpdate"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Current Phase
        </label>
        <input
          type="number"
          v-model.number="phaseCurrent"
          min="0"
          :max="phaseTotal"
          @change="handleUpdate"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="phaseTotal > 0">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">
          Phase {{ phaseCurrent + 1 }} of {{ phaseTotal }}
        </span>
        <span class="text-sm text-gray-500">
          {{ progressPercentage }}% complete
        </span>
      </div>

      <div class="w-full bg-gray-200 rounded-full h-3">
        <div
          class="bg-blue-600 h-3 rounded-full transition-all duration-300"
          :style="{ width: progressPercentage + '%' }"
        />
      </div>

      <!-- Phase Labels (Optional) -->
      <div class="mt-4 flex justify-between text-xs text-gray-500">
        <span>Phone Screen</span>
        <span v-if="phaseTotal >= 2">Technical</span>
        <span v-if="phaseTotal >= 3">Final Round</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const phaseTotal = ref(props.job.interview_phase_total || 1);
const phaseCurrent = ref(props.job.interview_phase_current || 0);

const progressPercentage = computed(() => {
  if (phaseTotal.value === 0) return 0;
  return Math.round((phaseCurrent.value / phaseTotal.value) * 100);
});

function handleUpdate() {
  emit('updatePhase', phaseTotal.value, phaseCurrent.value);
}

// Sync with prop changes
watch(() => props.job.interview_phase_total, (val) => {
  phaseTotal.value = val || 1;
});
</script>
```

---

#### OfferFields.vue

**Purpose:** Record offer details and trigger AI analysis

**Props:**
```typescript
interface Props {
  job: JobWithDocuments;
}
```

**Emits:**
```typescript
interface Emits {
  analyzeOffer: (amount: number, currency: string, benefits: string) => void;
  accept: () => void;
  decline: () => void;
}
```

**Template:**
```vue
<template>
  <div class="border-t pt-6 space-y-4">
    <h3 class="font-semibold text-gray-900">💼 Offer Details</h3>

    <!-- Salary Input -->
    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Salary (Annual Gross)
        </label>
        <input
          type="number"
          v-model.number="salary"
          step="1000"
          placeholder="1200000"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Currency
        </label>
        <select
          v-model="currency"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="THB">฿ THB</option>
          <option value="USD">$ USD</option>
          <option value="EUR">€ EUR</option>
          <option value="GBP">£ GBP</option>
          <option value="SGD">S$ SGD</option>
          <option value="AUD">A$ AUD</option>
        </select>
      </div>
    </div>

    <!-- Benefits -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Benefits & Perks
      </label>
      <textarea
        v-model="benefits"
        rows="3"
        placeholder="Health insurance, 15 days vacation, stock options, remote work..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>

    <!-- Analyze Button -->
    <button
      @click="handleAnalyze"
      :disabled="!canAnalyze || isAnalyzing"
      class="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium rounded-lg"
    >
      {{ isAnalyzing ? 'Analyzing...' : 'Analyze Offer with AI ✨' }}
    </button>

    <!-- AI Analysis Results -->
    <div v-if="hasAnalysis" class="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">{{ competitiveIcon }}</span>
        <h4 class="font-semibold text-purple-900">
          {{ analysis.is_competitive === 'above_average' ? 'Above Average Offer' :
             analysis.is_competitive === 'average' ? 'Market Average Offer' :
             'Below Average Offer' }}
        </h4>
      </div>

      <p class="text-sm text-gray-700 mb-3">{{ analysis.analysis }}</p>

      <!-- Sources -->
      <div v-if="analysis.sources?.length" class="space-y-1">
        <p class="text-xs font-medium text-gray-600">Sources:</p>
        <div v-for="(source, idx) in analysis.sources" :key="idx" class="text-xs">
          <a
            :href="source.url"
            target="_blank"
            class="text-blue-600 hover:underline"
          >
            • {{ source.title }}
          </a>
        </div>
      </div>

      <p class="mt-3 text-sm font-medium text-purple-900">
        💡 {{ analysis.recommendation }}
      </p>
    </div>

    <!-- Accept/Decline CTAs -->
    <div class="flex gap-3 pt-4">
      <button
        @click="emit('accept')"
        class="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
      >
        ✓ Accept Offer
      </button>
      <button
        @click="emit('decline')"
        class="flex-1 py-3 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg"
      >
        Decline
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const salary = ref(props.job.salary_offer_amount || 0);
const currency = ref(props.job.salary_offer_currency || 'THB');
const benefits = ref(props.job.offer_benefits || '');
const isAnalyzing = ref(false);

const canAnalyze = computed(() => salary.value > 0);

const hasAnalysis = computed(() => !!props.job.offer_ai_analysis);

const analysis = computed(() => props.job.offer_ai_analysis || {});

const competitiveIcon = computed(() => {
  const competitive = analysis.value.is_competitive;
  if (competitive === 'above_average') return '🎉';
  if (competitive === 'average') return '👍';
  return '⚠️';
});

async function handleAnalyze() {
  emit('analyzeOffer', salary.value, currency.value, benefits.value);
}
</script>
```

---

#### NotNowFields.vue

**Purpose:** Capture retrospective for learning

**Props:**
```typescript
interface Props {
  job: JobWithDocuments;
}
```

**Emits:**
```typescript
interface Emits {
  saveRetrospective: (reason: string, learnings: string) => void;
}
```

**Template:**
```vue
<template>
  <div class="border-t pt-6 space-y-4">
    <h3 class="font-semibold text-gray-900">🔍 Retrospective</h3>

    <p class="text-sm text-gray-600">
      Document why this didn't work out and what to improve for next time
    </p>

    <!-- Reason Dropdown -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Why Not Now?
      </label>
      <select
        v-model="reason"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">Select reason...</option>
        <option value="salary_low">Salary too low</option>
        <option value="culture_misfit">Culture misfit</option>
        <option value="better_offer">Better offer received</option>
        <option value="role_misaligned">Role not aligned with goals</option>
        <option value="location">Location/remote mismatch</option>
        <option value="rejected">Application rejected</option>
        <option value="other">Other</option>
      </select>
    </div>

    <!-- Custom Reason (if "Other") -->
    <div v-if="reason === 'other'">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Specify Reason
      </label>
      <input
        v-model="customReason"
        placeholder="e.g., Required 50% backend work"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>

    <!-- Learnings -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        What to Improve Next Time?
      </label>
      <textarea
        v-model="learnings"
        rows="4"
        placeholder="• Improve Node.js skills for full-stack roles&#10;• Ask about salary range upfront&#10;• Research company culture more thoroughly"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>

    <!-- Save Button -->
    <button
      @click="handleSave"
      :disabled="!canSave"
      class="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg"
    >
      Save Retrospective
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const reason = ref(props.job.retrospective_reason || '');
const customReason = ref('');
const learnings = ref(props.job.retrospective_learnings || '');

const canSave = computed(() => {
  const hasReason = reason.value === 'other' ? customReason.value : reason.value;
  return hasReason && learnings.value;
});

function handleSave() {
  const finalReason = reason.value === 'other' ? customReason.value : reason.value;
  emit('saveRetrospective', finalReason, learnings.value);
}
</script>
```

---

#### AcceptedFields.vue

**Purpose:** Congratulations UI for accepted offers

**Template:**
```vue
<template>
  <div class="border-t pt-6 text-center space-y-4">
    <div class="text-6xl">🎉</div>
    <h3 class="text-2xl font-bold text-green-600">
      Congratulations!
    </h3>
    <p class="text-lg text-gray-700">
      You've accepted the offer at
      <strong>{{ job.company_name }}</strong>
    </p>
    <p class="text-sm text-gray-500">
      See you next job search! Your retrospectives are saved for future reference.
    </p>

    <!-- Optional: Archive Button -->
    <button
      @click="$emit('archive')"
      class="mt-6 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
    >
      Archive This Application
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ job: JobWithDocuments }>();
</script>
```

---

## Shared Components

### MatchAnalysisSection.vue

**Purpose:** Display match analysis with categorized lists

**Template:**
```vue
<template>
  <div class="bg-gray-50 rounded-lg p-4">
    <h3 class="font-semibold text-gray-900 mb-3">📊 Match Analysis</h3>

    <!-- Strengths -->
    <div v-if="matchAnalysis?.strengths?.length" class="mb-4">
      <h4 class="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
        <span class="text-lg">✓</span> Strengths
      </h4>
      <ul class="space-y-1">
        <li
          v-for="(strength, idx) in matchAnalysis.strengths"
          :key="idx"
          class="text-sm text-gray-700 pl-6"
        >
          • {{ strength }}
        </li>
      </ul>
    </div>

    <!-- Partial Matches -->
    <div v-if="matchAnalysis?.partial_matches?.length" class="mb-4">
      <h4 class="text-sm font-medium text-yellow-700 mb-2 flex items-center gap-1">
        <span class="text-lg">⚠</span> Partial Matches
      </h4>
      <ul class="space-y-1">
        <li
          v-for="(match, idx) in matchAnalysis.partial_matches"
          :key="idx"
          class="text-sm text-gray-700 pl-6"
        >
          • {{ match }}
        </li>
      </ul>
    </div>

    <!-- Gaps -->
    <div v-if="matchAnalysis?.gaps?.length">
      <h4 class="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
        <span class="text-lg">✗</span> Gaps
      </h4>
      <ul class="space-y-1">
        <li
          v-for="(gap, idx) in matchAnalysis.gaps"
          :key="idx"
          class="text-sm text-gray-700 pl-6"
        >
          • {{ gap }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MatchAnalysis } from '@/types';

defineProps<{
  matchAnalysis?: MatchAnalysis;
}>();
</script>
```

---

## Utility Components

### LoadingSpinner.vue

```vue
<template>
  <div
    :class="[
      'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
      sizeClasses
    ]"
    role="status"
  >
    <span class="sr-only">Loading...</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  size?: 'sm' | 'md' | 'lg';
}>();

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'h-4 w-4';
    case 'lg': return 'h-12 w-12';
    default: return 'h-8 w-8';
  }
});
</script>
```

---

## Mobile Responsiveness

### Breakpoint Strategy

```css
/* Mobile First Approach */

/* Base (Mobile): 0-640px */
.modal {
  padding: 1rem;
  border-radius: 0; /* Full screen on mobile */
  max-height: 100vh;
}

/* Tablet: 640px+ */
@media (min-width: 640px) {
  .modal {
    padding: 1.5rem;
    border-radius: 1rem;
    max-height: 90vh;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .modal {
    padding: 2rem;
    max-width: 56rem; /* 4xl */
  }
}
```

---

## Accessibility

### Keyboard Navigation
- **ESC:** Close modal
- **Tab:** Navigate between fields
- **Enter:** Submit forms
- **Space:** Toggle checkboxes

### ARIA Labels
```vue
<button
  aria-label="Close job detail modal"
  @click="$emit('close')"
>
  ×
</button>

<div
  role="dialog"
  aria-labelledby="job-title"
  aria-modal="true"
>
  <h2 id="job-title">{{ job.position_title }}</h2>
  <!-- ... -->
</div>
```

---

## State Management Integration

### Pinia Store Usage

```typescript
// stores/jobs.ts
import { defineStore } from 'pinia';

export const useJobsStore = defineStore('jobs', {
  actions: {
    async updateJobField(jobId: string, field: string, value: any) {
      // Optimistic update
      const job = this.jobs.find(j => j.id === jobId);
      if (job) job[field] = value;

      // API call
      await KanbanCardAPI.updateJob(jobId, { [field]: value });

      // Refresh if needed
      await this.fetchJobs();
    }
  }
});
```

---

## Related Documentation

- **Database Schema:** `./DatabaseSchema.md`
- **API Specification:** `./APISpecification.md`
- **PRD:** `./PRD.md`
- **Implementation Plan:** `./ImplementationPlan.md`
