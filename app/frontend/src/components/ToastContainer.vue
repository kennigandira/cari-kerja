<script setup lang="ts">
import { computed } from 'vue'
import { TransitionGroup } from 'vue'
import { useToastStore } from '../stores/toast'
import BaseToast from './base/BaseToast.vue'

const toastStore = useToastStore()

const toasts = computed(() => toastStore.toasts)

const handleDismiss = (id: string) => {
  toastStore.remove(id)
}
</script>

<template>
  <div
    class="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
    aria-live="polite"
    aria-relevant="additions"
  >
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-3"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto"
      >
        <BaseToast
          :toast="toast"
          @dismiss="handleDismiss"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Vue transition classes for smooth entry/exit */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
