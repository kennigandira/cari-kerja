<template>
  <div class="profile-create-view">
    <header class="page-header">
      <h1>Create New Profile</h1>
    </header>
    <ProfileForm :is-editing="false" />
  </div>
</template>

<script setup lang="ts">
import ProfileForm from '../components/profile/ProfileForm.vue';
</script>

<style scoped>
.profile-create-view {
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
</style>
