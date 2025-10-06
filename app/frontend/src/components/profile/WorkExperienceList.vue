<template>
  <div class="work-experience-list">
    <div
      v-for="(experience, index) in experiences"
      :key="experience.id || `exp-${index}`"
      class="experience-item"
    >
      <div class="form-row">
        <div class="form-group">
          <label :for="`company-${index}`">Company Name *</label>
          <input
            :id="`company-${index}`"
            v-model="experience.company_name"
            type="text"
            required
            class="form-input"
            @input="emit('update', experiences)"
          />
        </div>
        <div class="form-group">
          <label :for="`position-${index}`">Position Title *</label>
          <input
            :id="`position-${index}`"
            v-model="experience.position_title"
            type="text"
            required
            class="form-input"
            @input="emit('update', experiences)"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label :for="`location-${index}`">Location</label>
          <input
            :id="`location-${index}`"
            v-model="experience.location"
            type="text"
            class="form-input"
            @input="emit('update', experiences)"
          />
        </div>
        <div class="form-group">
          <label :for="`start-date-${index}`">Start Date *</label>
          <input
            :id="`start-date-${index}`"
            :value="formatDateForMonthInput(experience.start_date)"
            type="month"
            required
            class="form-input"
            @input="handleStartDateChange(experience, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label :for="`end-date-${index}`">End Date</label>
          <input
            :id="`end-date-${index}`"
            :value="formatDateForMonthInput(experience.end_date)"
            type="month"
            :disabled="experience.is_current"
            class="form-input"
            @input="handleEndDateChange(experience, ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input
              v-model="experience.is_current"
              type="checkbox"
              @change="handleCurrentChange(experience)"
            />
            <span>Currently working here</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label :for="`description-${index}`">Description</label>
        <textarea
          :id="`description-${index}`"
          v-model="experience.description"
          rows="4"
          class="form-input"
          placeholder="Describe your responsibilities and achievements..."
          @input="emit('update', experiences)"
        />
      </div>

      <button
        type="button"
        class="btn-remove"
        @click="removeExperience(index)"
        :aria-label="`Remove ${experience.company_name || 'experience'}`"
      >
        Remove
      </button>
    </div>

    <button type="button" class="btn-add" @click="addExperience">
      + Add Work Experience
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { WorkExperience } from '../../../../shared/types';
import { formatDateForMonthInput, formatMonthInputForDB } from '../../utils/dateUtils';

const props = defineProps<{
  modelValue: Partial<WorkExperience>[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Partial<WorkExperience>[]];
  update: [value: Partial<WorkExperience>[]];
}>();

const experiences = ref<Partial<WorkExperience>[]>(props.modelValue || []);

function addExperience() {
  const newExperience: Partial<WorkExperience> = {
    company_name: '',
    position_title: '',
    location: '',
    start_date: undefined,
    end_date: undefined,
    is_current: false,
    description: '',
    display_order: experiences.value.length
  };
  experiences.value.push(newExperience);
  emit('update:modelValue', experiences.value);
  emit('update', experiences.value);
}

function removeExperience(index: number) {
  experiences.value.splice(index, 1);
  experiences.value.forEach((exp, idx) => {
    exp.display_order = idx;
  });
  emit('update:modelValue', experiences.value);
  emit('update', experiences.value);
}

function handleStartDateChange(experience: Partial<WorkExperience>, monthValue: string) {
  experience.start_date = formatMonthInputForDB(monthValue);
  emit('update:modelValue', experiences.value);
  emit('update', experiences.value);
}

function handleEndDateChange(experience: Partial<WorkExperience>, monthValue: string) {
  experience.end_date = formatMonthInputForDB(monthValue);
  emit('update:modelValue', experiences.value);
  emit('update', experiences.value);
}

function handleCurrentChange(experience: Partial<WorkExperience>) {
  if (experience.is_current) {
    experience.end_date = undefined;
  }
  emit('update:modelValue', experiences.value);
  emit('update', experiences.value);
}
</script>

<style scoped>
.work-experience-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.experience-item {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.form-input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 0;
}

.form-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.checkbox-group {
  justify-content: center;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
}

.btn-remove {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}

.btn-remove:hover {
  background: #dc2626;
}

.btn-add {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  align-self: flex-start;
}

.btn-add:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
