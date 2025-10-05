<template>
  <section class="form-section" :aria-labelledby="`section-${id}`">
    <button
      :id="`section-${id}`"
      type="button"
      class="section-header"
      @click="toggleOpen"
      :aria-expanded="isOpen"
      :aria-controls="`content-${id}`"
    >
      <h2 class="section-title">{{ title }}</h2>
      <svg
        class="chevron"
        :class="{ 'rotate-180': isOpen }"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
    <div v-show="isOpen" :id="`content-${id}`" class="section-content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  id: string;
  title: string;
  initialOpen?: boolean;
}>();

const isOpen = ref(props.initialOpen ?? true);

function toggleOpen() {
  isOpen.value = !isOpen.value;
}
</script>

<style scoped>
.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  overflow: hidden;
}

.section-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.section-header:hover {
  background: #f3f4f6;
}

.section-header:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.section-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.chevron {
  transition: transform 0.2s;
}

.rotate-180 {
  transform: rotate(180deg);
}

.section-content {
  padding: 1.5rem;
}
</style>
