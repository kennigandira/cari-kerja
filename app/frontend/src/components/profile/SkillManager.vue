<template>
  <div class="skill-manager">
    <div class="skill-input-row">
      <div class="form-group">
        <label for="skill-name">Skill Name *</label>
        <input
          id="skill-name"
          v-model="newSkill.skill_name"
          type="text"
          class="form-input"
          placeholder="e.g., React, TypeScript"
          @keyup.enter="addSkill"
        />
      </div>
      <div class="form-group">
        <label for="skill-category">Category</label>
        <input
          id="skill-category"
          v-model="newSkill.category"
          type="text"
          class="form-input"
          placeholder="e.g., Frontend, Backend"
        />
      </div>
      <div class="form-group">
        <label for="skill-level">Proficiency</label>
        <select
          id="skill-level"
          v-model="newSkill.proficiency_level"
          class="form-input"
        >
          <option value="">Select level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
      </div>
      <div class="form-group">
        <label for="skill-years">Years</label>
        <input
          id="skill-years"
          v-model.number="newSkill.years_of_experience"
          type="number"
          min="0"
          class="form-input"
        />
      </div>
      <button type="button" class="btn-add-skill" @click="addSkill">
        + Add
      </button>
    </div>

    <div v-if="skills.length > 0" class="skills-list">
      <div
        v-for="(skill, index) in visibleSkills"
        :key="skill.id || `skill-${index}`"
        class="skill-item"
      >
        <div class="skill-info">
          <span class="skill-name">{{ skill.skill_name }}</span>
          <span v-if="skill.category" class="skill-category">{{ skill.category }}</span>
          <span v-if="skill.proficiency_level" class="skill-level">{{ skill.proficiency_level }}</span>
          <span v-if="skill.years_of_experience" class="skill-years">
            {{ skill.years_of_experience }} years
          </span>
        </div>
        <button
          type="button"
          class="btn-remove-skill"
          @click="removeSkill(index)"
          :aria-label="`Remove ${skill.skill_name}`"
        >
          ×
        </button>
      </div>

      <button
        v-if="skills.length > visibleCount"
        type="button"
        class="btn-load-more"
        @click="loadMore"
      >
        Load {{ Math.min(BATCH_SIZE, skills.length - visibleCount) }} more skills
      </button>
    </div>

    <p v-else class="empty-state">No skills added yet</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Skill } from '../../../../shared/types';

const BATCH_SIZE = 20;

const props = defineProps<{
  modelValue: Partial<Skill>[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Partial<Skill>[]];
  update: [value: Partial<Skill>[]];
}>();

const skills = ref<Partial<Skill>[]>(props.modelValue || []);
const visibleCount = ref(BATCH_SIZE);

const newSkill = ref<Partial<Skill>>({
  skill_name: '',
  category: '',
  proficiency_level: undefined,
  years_of_experience: undefined
});

const visibleSkills = computed(() => {
  return skills.value.slice(0, visibleCount.value);
});

function addSkill() {
  const SKILL_NAME_CONSTANT = newSkill.value.skill_name?.trim();
  if (!SKILL_NAME_CONSTANT) return;

  const skillToAdd: Partial<Skill> = {
    skill_name: SKILL_NAME_CONSTANT,
    category: newSkill.value.category || undefined,
    proficiency_level: newSkill.value.proficiency_level || undefined,
    years_of_experience: newSkill.value.years_of_experience || undefined,
    display_order: skills.value.length
  };

  skills.value.push(skillToAdd);
  emit('update:modelValue', skills.value);
  emit('update', skills.value);

  newSkill.value = {
    skill_name: '',
    category: '',
    proficiency_level: undefined,
    years_of_experience: undefined
  };
}

function removeSkill(index: number) {
  skills.value.splice(index, 1);
  skills.value.forEach((skill, idx) => {
    skill.display_order = idx;
  });
  emit('update:modelValue', skills.value);
  emit('update', skills.value);

  if (visibleCount.value > skills.value.length) {
    visibleCount.value = Math.max(BATCH_SIZE, skills.value.length);
  }
}

function loadMore() {
  visibleCount.value = Math.min(visibleCount.value + BATCH_SIZE, skills.value.length);
}
</script>

<style scoped>
.skill-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.skill-input-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr 1fr auto;
  gap: 1rem;
  align-items: end;
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

.btn-add-skill {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}

.btn-add-skill:hover {
  background: #2563eb;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.skill-info {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.skill-name {
  font-weight: 600;
  color: #111827;
}

.skill-category {
  padding: 0.125rem 0.5rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.skill-level {
  padding: 0.125rem 0.5rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.skill-years {
  color: #6b7280;
  font-size: 0.875rem;
}

.btn-remove-skill {
  width: 2rem;
  height: 2rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove-skill:hover {
  background: #dc2626;
}

.btn-load-more {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  align-self: flex-start;
}

.btn-load-more:hover {
  background: #4b5563;
}

.empty-state {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

@media (max-width: 768px) {
  .skill-input-row {
    grid-template-columns: 1fr;
  }

  .btn-add-skill {
    width: 100%;
  }
}
</style>
