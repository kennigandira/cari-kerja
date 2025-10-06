<template>
  <form class="profile-form" @submit.prevent="handleSubmit">
    <div v-if="error" class="alert alert-error" role="alert">
      {{ error }}
    </div>

    <div v-if="hasDraft" class="alert alert-info">
      Auto-saved draft restored. Last saved: {{ formatDate(lastSaved) }}
    </div>

    <FormSection id="basic-info" title="Basic Information" :initial-open="true">
      <div class="form-row">
        <div class="form-group">
          <label for="profile-name">Profile Name *</label>
          <input
            id="profile-name"
            v-model="formData.profile_name"
            type="text"
            required
            class="form-input"
            aria-required="true"
          />
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input
              v-model="formData.is_default"
              type="checkbox"
            />
            <span>Set as default profile</span>
          </label>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="full-name">Full Name *</label>
          <input
            id="full-name"
            v-model="formData.full_name"
            type="text"
            required
            class="form-input"
            aria-required="true"
          />
        </div>
        <div class="form-group">
          <label for="email">Email *</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            class="form-input"
            aria-required="true"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="phone-primary">Primary Phone</label>
          <input
            id="phone-primary"
            v-model="formData.phone_primary"
            type="tel"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="phone-secondary">Secondary Phone</label>
          <input
            id="phone-secondary"
            v-model="formData.phone_secondary"
            type="tel"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="linkedin-url">LinkedIn URL</label>
          <input
            id="linkedin-url"
            v-model="formData.linkedin_url"
            type="url"
            class="form-input"
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div class="form-group">
          <label for="github-url">GitHub URL</label>
          <input
            id="github-url"
            v-model="formData.github_url"
            type="url"
            class="form-input"
            placeholder="https://github.com/..."
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="portfolio-url">Portfolio URL</label>
          <input
            id="portfolio-url"
            v-model="formData.portfolio_url"
            type="url"
            class="form-input"
            placeholder="https://..."
          />
        </div>
        <div class="form-group">
          <label for="location">Location *</label>
          <input
            id="location"
            v-model="formData.location"
            type="text"
            required
            class="form-input"
            aria-required="true"
            placeholder="City, Country"
          />
        </div>
      </div>
    </FormSection>

    <FormSection id="professional-summary" title="Professional Summary" :initial-open="true">
      <div class="form-group">
        <label for="professional-summary">Summary *</label>
        <textarea
          id="professional-summary"
          v-model="formData.professional_summary"
          required
          rows="6"
          class="form-input"
          aria-required="true"
          placeholder="Write a compelling professional summary (minimum 50 characters)..."
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="years-experience">Years of Experience</label>
          <input
            id="years-experience"
            v-model.number="formData.years_of_experience"
            type="number"
            min="0"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="current-position">Current Position</label>
          <input
            id="current-position"
            v-model="formData.current_position"
            type="text"
            class="form-input"
          />
        </div>
      </div>
    </FormSection>

    <FormSection id="work-experience" title="Work Experience">
      <WorkExperienceList
        v-model="formData.work_experiences!"
        @update="handleWorkExperienceUpdate"
      />
    </FormSection>

    <FormSection id="skills" title="Skills">
      <SkillManager
        v-model="formData.skills!"
        @update="handleSkillsUpdate"
      />
    </FormSection>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Saving...' : (isEditing ? 'Update Profile' : 'Create Profile') }}
      </button>
      <button type="button" class="btn btn-secondary" @click="handleCancel">
        Cancel
      </button>
      <button
        v-if="hasDraft"
        type="button"
        class="btn btn-ghost"
        @click="clearAutosave"
      >
        Clear Draft
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from '../../stores/profiles';
import { useAutoSave } from '../../composables/useAutoSave';
import FormSection from './FormSection.vue';
import WorkExperienceList from './WorkExperienceList.vue';
import SkillManager from './SkillManager.vue';
import type { MasterProfile, MasterProfileWithDetails, WorkExperience, Skill } from '../../../../shared/types';

const props = defineProps<{
  isEditing?: boolean;
  initialData?: MasterProfileWithDetails;
}>();

const router = useRouter();
const profilesStore = useProfilesStore();

const loading = ref(false);
const error = ref<string | null>(null);

const formData = reactive<Partial<MasterProfile> & {
  work_experiences?: Partial<WorkExperience>[];
  skills?: Partial<Skill>[];
}>({
  profile_name: props.initialData?.profile_name || '',
  is_default: props.initialData?.is_default || false,
  full_name: props.initialData?.full_name || '',
  email: props.initialData?.email || '',
  phone_primary: props.initialData?.phone_primary || '',
  phone_secondary: props.initialData?.phone_secondary || '',
  linkedin_url: props.initialData?.linkedin_url || '',
  github_url: props.initialData?.github_url || '',
  portfolio_url: props.initialData?.portfolio_url || '',
  location: props.initialData?.location || '',
  professional_summary: props.initialData?.professional_summary || '',
  years_of_experience: props.initialData?.years_of_experience || undefined,
  current_position: props.initialData?.current_position || '',
  work_experiences: props.initialData?.work_experiences || [],
  skills: props.initialData?.skills || []
});

const FORM_DATA_REF = ref(formData);
const { lastSaved, hasDraft, clearDraft: clearAutosave, loadDraft } = useAutoSave(
  `profile-${props.initialData?.id || 'new'}`,
  FORM_DATA_REF
);

onMounted(() => {
  if (!props.initialData) {
    const draft = loadDraft();
    if (draft) {
      Object.assign(formData, draft);
    }
  }
});

function handleWorkExperienceUpdate(experiences: Partial<WorkExperience>[]) {
  formData.work_experiences = experiences;
}

function handleSkillsUpdate(skills: Partial<Skill>[]) {
  formData.skills = skills;
}

async function handleSubmit() {
  loading.value = true;
  error.value = null;

  try {
    const profileData: Partial<MasterProfile> = {
      profile_name: formData.profile_name,
      is_default: formData.is_default,
      full_name: formData.full_name,
      email: formData.email,
      phone_primary: formData.phone_primary || undefined,
      phone_secondary: formData.phone_secondary || undefined,
      linkedin_url: formData.linkedin_url || undefined,
      github_url: formData.github_url || undefined,
      portfolio_url: formData.portfolio_url || undefined,
      location: formData.location,
      professional_summary: formData.professional_summary,
      years_of_experience: formData.years_of_experience,
      current_position: formData.current_position || undefined
    };

    // Prepare work experiences
    const validExperiences = (formData.work_experiences || [])
      .filter(exp => exp.company_name && exp.position_title && exp.start_date)
      .map(exp => ({
        ...exp,
        end_date: exp.end_date || undefined
      }));

    // Prepare skills
    const validSkills = (formData.skills || []).filter(skill => skill.skill_name);

    if (props.isEditing && props.initialData?.id) {
      // Use batch update for editing - updates everything in one transaction
      await profilesStore.updateProfileWithDetails(
        props.initialData.id,
        profileData,
        validExperiences,
        validSkills
      );
    } else {
      // For new profiles, use the existing create flow
      const newProfile = await profilesStore.createProfile(profileData);
      const profileId = newProfile.id;

      // Add experiences and skills individually for new profiles
      for (const exp of validExperiences) {
        await profilesStore.addWorkExperience(profileId, exp);
      }

      for (const skill of validSkills) {
        await profilesStore.addSkill(profileId, skill);
      }
    }

    clearAutosave();
    router.push('/profiles');
  } catch (err: any) {
    error.value = err.message || 'Failed to save profile';
    console.error('Form submission error:', err);
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  const HAS_DRAFT_CONSTANT = hasDraft.value;
  if (HAS_DRAFT_CONSTANT) {
    const CONFIRM_CONSTANT = confirm('You have unsaved changes. Are you sure you want to cancel?');
    if (!CONFIRM_CONSTANT) return;
  }
  clearAutosave();
  router.push('/profiles');
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}
</script>

<style scoped>
.profile-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.alert {
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-info {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
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

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-ghost {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-ghost:hover {
  background: #f9fafb;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
