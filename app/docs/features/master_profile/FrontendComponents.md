# Frontend Components - Master Profile

**Version:** 1.0
**Framework:** Vue 3 Composition API
**Styling:** Tailwind CSS
**State:** Pinia

---

## Component Hierarchy

```
ProfileCreateView
  └── ProfileWizard
      ├── ConsentModal (Step 0)
      ├── StepUpload (Step 1)
      │   └── FileUploader
      │       └── ExtractionStatus
      ├── StepBasicInfo (Step 2)
      │   └── BasicInfoSection
      ├── StepExperience (Step 3)
      │   └── ExperienceSection
      │       └── AchievementInput
      ├── StepSkills (Step 4)
      │   └── SkillsSection
      │       └── SkillAutocomplete
      ├── StepEducation (Step 5)
      │   └── EducationSection
      └── StepPreview (Step 6)
          └── ProfilePreview
```

---

## Critical Components (MVP)

### FileUploader.vue

**Purpose:** Upload CV files with progress and validation

**Props:**
```typescript
interface Props {
  maxSizeMB?: number;      // default: 5
  allowedTypes?: string[]; // default: ['application/pdf', 'application/vnd...', 'text/plain']
  onUploadComplete?: (filePath: string) => void;
}
```

**Events:**
```typescript
emit('upload-started', file: File);
emit('upload-progress', progress: number);
emit('upload-complete', filePath: string);
emit('upload-error', error: string);
emit('extraction-started', taskId: string);
```

**Features:**
- Drag & drop support
- Magic byte validation
- Progress bar (0-100%)
- Error states with retry
- Accessibility (keyboard, screen reader)

---

### ExtractionStatus.vue

**Purpose:** Poll extraction status with exponential backoff

**Props:**
```typescript
interface Props {
  taskId: string;
  onComplete?: (result: CVExtractionResult) => void;
}
```

**Polling Strategy:**
- **Exponential backoff:** 1s → 2s → 4s → 8s → 10s (max)
- **Transition to max:** After 4th attempt (15 seconds cumulative), all subsequent polls use 10s interval
- **Max attempts:** 12 (total time: 1+2+4+8+10*8 = 95 seconds ≈ 1.5 minutes)
- **Calculation:** 1+2+4+8 = 15s (first 4), then 10s × 8 more = 80s, total = 95s
- **Cancellation:** User can cancel polling, component unmount stops polling
- **Network error handling:** Retry same interval once, then continue exponential backoff

**Polling Implementation:**
```typescript
const intervals = [1000, 2000, 4000, 8000]; // First 4 attempts
const maxInterval = 10000; // 10 seconds cap
const maxAttempts = 12;

let attempt = 0;
const poll = async () => {
  if (attempt >= maxAttempts) {
    handleTimeout();
    return;
  }

  const delay = attempt < intervals.length ? intervals[attempt] : maxInterval;
  const result = await fetchStatus(taskId);

  if (result.status === 'completed') {
    onComplete(result.data);
  } else if (result.status === 'failed') {
    onError(result.error);
  } else {
    attempt++;
    setTimeout(poll, delay);
  }
};
```

**UI States:**
1. **Idle** - Not started
2. **Pending** - "Preparing to analyze..." (status: pending)
3. **Processing** - "Analyzing CV... (15-30 seconds)" (status: processing)
4. **Completed** - "Analysis complete! ✓" (status: completed)
5. **Failed** - "Analysis failed. Try again or enter manually." (status: failed)
6. **Timeout** - "Analysis taking longer than expected. Try again or enter manually." (>95s)

---

### ProfileWizard.vue

**Purpose:** Multi-step wizard container

**Features:**
- 6 steps with progress indicator
- Navigation: Next, Previous, Save Draft
- Keyboard navigation (Arrow keys)
- Auto-save every 30 seconds
- Unsaved changes warning
- Focus management

**State:**
```typescript
// Wizard state management
const currentStep = ref(1);
const formData = ref<Partial<MasterProfileWithDetails>>({});
const isDirty = ref(false);
const saving = ref(false);

// Validation and completion tracking
const validationErrors = ref<Map<string, string[]>>(new Map());
const completedSteps = ref<Set<number>>(new Set());
const canProceedToStep = computed(() => (step: number) => {
  // Can proceed if previous step is completed or current step
  return step <= currentStep.value || completedSteps.value.has(step - 1);
});

// CV extraction state
const extractionTaskId = ref<string | null>(null);
const extractionStatus = ref<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
const uploadedFile = ref<File | null>(null);

// Draft restoration state
const isDraftRestored = ref(false);
const draftTimestamp = ref<Date | null>(null);
const showDraftRestoreModal = ref(false);

// Step validation state
const isStepValid = computed(() => (step: number) => {
  const stepErrors = Array.from(validationErrors.value.entries())
    .filter(([key]) => getStepForField(key) === step);
  return stepErrors.length === 0;
});
```

**Complete Wizard Interface:**
```typescript
interface ProfileWizardState {
  // Navigation
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrevious: boolean;

  // Form data
  formData: Partial<MasterProfileWithDetails>;
  isDirty: boolean;
  hasUnsavedChanges: boolean;

  // Validation
  validationErrors: Map<string, string[]>;
  completedSteps: Set<number>;
  isCurrentStepValid: boolean;

  // CV Extraction
  extractionTaskId: string | null;
  extractionStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  extractionResult: CVExtractionResult | null;
  uploadedFile: File | null;

  // Draft management
  isDraftRestored: boolean;
  draftTimestamp: Date | null;
  hasDraft: boolean;

  // Actions
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  saveDraft: () => Promise<void>;
  loadDraft: () => void;
  deleteDraft: () => void;
  submitProfile: () => Promise<void>;
}
```

---

## Component File Locations

**Create these files:**
```
/Users/user/Documents/cari-kerja/app/frontend/src/
├── views/
│   ├── ProfilesListView.vue      # List all profiles
│   ├── ProfileCreateView.vue     # Wizard container
│   └── ProfileEditView.vue       # Edit form
├── components/
│   └── profile/
│       ├── ProfileWizard.vue
│       ├── ConsentModal.vue
│       ├── FileUploader.vue
│       ├── ExtractionStatus.vue
│       ├── steps/
│       │   ├── StepUpload.vue
│       │   ├── StepBasicInfo.vue
│       │   ├── StepExperience.vue
│       │   ├── StepSkills.vue
│       │   ├── StepEducation.vue
│       │   └── StepPreview.vue
│       ├── sections/
│       │   ├── BasicInfoSection.vue
│       │   ├── ExperienceSection.vue
│       │   ├── SkillsSection.vue
│       │   └── EducationSection.vue
│       └── fields/
│           ├── AchievementInput.vue
│           ├── SkillAutocomplete.vue
│           └── DateRangeInput.vue
├── stores/
│   └── profiles.ts
├── composables/
│   ├── useAutoSave.ts
│   ├── useExtractionPolling.ts
│   └── useProfileValidation.ts
└── schemas/
    ├── profile.schema.ts
    └── experience.schema.ts

**Backend Worker Files:**
/Users/user/Documents/cari-kerja/app/workers/src/
├── handlers/
│   └── profiles/
│       ├── create.ts
│       ├── list.ts
│       ├── get.ts
│       ├── update.ts
│       ├── delete.ts
│       ├── set-default.ts
│       ├── duplicate.ts
│       ├── upload-cv.ts
│       └── extraction-status.ts
├── services/
│   ├── ProfileService.ts
│   ├── CVExtractionService.ts
│   ├── FileParser.ts
│   ├── ValidationService.ts
│   └── StorageService.ts
└── tasks/
    └── extract-cv.ts
```

---

**For detailed implementation, see:** `TD002_Frontend_Architecture.md` and `ImplementationPlan.md`
