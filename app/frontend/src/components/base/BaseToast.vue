<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTimeoutFn } from '@vueuse/core'
import type { Toast } from '../../types/toast'

interface Props {
  toast: Toast
}

const props = defineProps<Props>()
const emit = defineEmits<{
  dismiss: [id: string]
}>()

// Icon mapping
const iconMap = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

// Color mapping from design tokens
const colorClasses = computed(() => {
  const baseClasses = 'rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[320px] max-w-[480px]'

  switch (props.toast.type) {
    case 'success':
      return `${baseClasses} bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500`
    case 'error':
      return `${baseClasses} bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500`
    case 'warning':
      return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500`
    case 'info':
    default:
      return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500`
  }
})

const iconColorClasses = computed(() => {
  switch (props.toast.type) {
    case 'success': return 'text-green-600 dark:text-green-400'
    case 'error': return 'text-red-600 dark:text-red-400'
    case 'warning': return 'text-yellow-600 dark:text-yellow-400'
    case 'info':
    default: return 'text-blue-600 dark:text-blue-400'
  }
})

const textColorClasses = computed(() => {
  switch (props.toast.type) {
    case 'success': return 'text-green-900 dark:text-green-100'
    case 'error': return 'text-red-900 dark:text-red-100'
    case 'warning': return 'text-yellow-900 dark:text-yellow-100'
    case 'info':
    default: return 'text-blue-900 dark:text-blue-100'
  }
})

// Auto-dismiss logic
const { start: startDismissTimer } = useTimeoutFn(() => {
  emit('dismiss', props.toast.id)
}, props.toast.duration ?? 0, { immediate: false })

onMounted(() => {
  if (props.toast.duration) {
    startDismissTimer()
  }
})

const handleDismiss = () => {
  emit('dismiss', props.toast.id)
}
</script>

<template>
  <div
    :class="colorClasses"
    role="alert"
    :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
    aria-atomic="true"
  >
    <!-- Icon -->
    <div :class="['flex-shrink-0', iconColorClasses]" aria-hidden="true">
      <span class="text-xl font-bold">{{ iconMap[toast.type] }}</span>
    </div>

    <!-- Message -->
    <div :class="['flex-1', textColorClasses]">
      <p class="text-sm font-medium">{{ toast.message }}</p>
    </div>

    <!-- Dismiss button -->
    <button
      v-if="toast.dismissible"
      type="button"
      :class="['flex-shrink-0 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors', textColorClasses]"
      @click="handleDismiss"
      aria-label="Dismiss notification"
    >
      <span class="text-lg" aria-hidden="true">×</span>
    </button>
  </div>
</template>
