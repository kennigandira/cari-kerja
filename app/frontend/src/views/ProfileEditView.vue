<template>
  <div class="profile-edit-view">
    <header class="page-header">
      <h1>Edit Profile</h1>
    </header>

    <div v-if="loading" class="loading-state">
      <p>Loading profile...</p>
    </div>

    <div v-else-if="error" class="alert alert-error" role="alert">
      {{ error }}
    </div>

    <ProfileForm
      v-else-if="currentProfile"
      :is-editing="true"
      :initial-data="currentProfile"
    />

    <div v-else class="error-state">
      <p>Profile not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useProfilesStore } from '../stores/profiles';
import { storeToRefs } from 'pinia';
import ProfileForm from '../components/profile/ProfileForm.vue';

const route = useRoute();
const profilesStore = useProfilesStore();

const { currentProfile, loading, error } = storeToRefs(profilesStore);

onMounted(async () => {
  const PROFILE_ID_CONSTANT = route.params.id as string;
  if (PROFILE_ID_CONSTANT) {
    await profilesStore.fetchProfileById(PROFILE_ID_CONSTANT);
  }
});
</script>

<style scoped>
.profile-edit-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #111827;
}

.loading-state,
.error-state {
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
</style>
