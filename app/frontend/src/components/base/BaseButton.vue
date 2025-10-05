<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  ariaLabel?: string
  icon?: boolean // icon-only button
  type?: 'button' | 'submit' | 'reset'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  icon: false,
  type: 'button',
})

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
  ghost: 'hover:bg-gray-100 text-gray-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const iconSizes = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
}
</script>

<template>
  <button
    :type="type"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
      'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
      'focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant],
      icon ? iconSizes[size] : sizes[size],
    ]"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-busy="loading"
  >
    <span v-if="loading" class="animate-spin" aria-hidden="true">⟳</span>
    <slot />
  </button>
</template>
