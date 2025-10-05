<template>
  <div class="profiles-list-view">
    <header class="page-header">
      <h1>Master Profiles</h1>
      <button class="btn btn-primary" @click="navigateToCreate">
        + Create New Profile
      </button>
    </header>

    <div v-if="loading" class="loading-state">
      <p>Loading profiles...</p>
    </div>

    <div v-else-if="error" class="alert alert-error" role="alert">
      {{ error }}
    </div>

    <div v-else-if="profiles.length === 0" class="empty-state">
      <p>No profiles yet. Create your first one!</p>
    </div>

    <div v-else class="profiles-grid">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="profile-card"
      >
        <div class="profile-header">
          <h2>{{ profile.profile_name }}</h2>
          <span v-if="profile.is_default" class="badge badge-default">Default</span>
        </div>
        <div class="profile-info">
          <p class="profile-name">{{ profile.full_name }}</p>
          <p class="profile-email">{{ profile.email }}</p>
          <p v-if="profile.current_position" class="profile-position">
            {{ profile.current_position }}
          </p>
        </div>
        <div class="profile-actions">
          <button
            class="btn btn-sm btn-primary"
            @click="navigateToEdit(profile.id)"
          >
            Edit
          </button>
          <button
            class="btn btn-sm btn-secondary"
            @click="handleExport(profile.id)"
          >
            Export
          </button>
          <button
            class="btn btn-sm btn-danger"
            @click="handleDelete(profile.id, profile.profile_name)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from '../stores/profiles';
import { storeToRefs } from 'pinia';

const router = useRouter();
const profilesStore = useProfilesStore();

const { profiles, loading, error } = storeToRefs(profilesStore);

onMounted(() => {
  profilesStore.fetchProfiles();
});

function navigateToCreate() {
  router.push('/profiles/new');
}

function navigateToEdit(id: string) {
  router.push(`/profiles/${id}`);
}

async function handleExport(id: string) {
  try {
    await profilesStore.exportProfileMarkdown(id);
  } catch (err) {
    console.error('Export failed:', err);
  }
}

async function handleDelete(id: string, name: string) {
  const CONFIRM_CONSTANT = confirm(`Are you sure you want to delete "${name}"? This action will soft-delete the profile.`);
  if (!CONFIRM_CONSTANT) return;

  try {
    await profilesStore.deleteProfile(id);
  } catch (err) {
    console.error('Delete failed:', err);
  }
}
</script>

<style scoped>
.profiles-list-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #111827;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
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

.profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.profile-card {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  transition: box-shadow 0.2s;
}

.profile-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.profile-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-default {
  background: #dbeafe;
  color: #1e40af;
}

.profile-info {
  margin-bottom: 1.5rem;
}

.profile-info p {
  margin: 0.25rem 0;
}

.profile-name {
  font-weight: 600;
  color: #374151;
}

.profile-email {
  color: #6b7280;
  font-size: 0.875rem;
}

.profile-position {
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
}

.profile-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .profiles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
