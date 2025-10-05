<script setup lang="ts">
interface Props {
  variant?: 'processing' | 'to_submit' | 'waiting' | 'ongoing' | 'success' | 'not_now' | 'default'
  size?: 'sm' | 'md' | 'lg'
  label: string
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
})

const variants = {
  processing: 'bg-gray-100 text-gray-800 border-gray-300',
  to_submit: 'bg-blue-100 text-blue-800 border-blue-300',
  waiting: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ongoing: 'bg-purple-100 text-purple-800 border-purple-300',
  success: 'bg-green-100 text-green-800 border-green-300',
  not_now: 'bg-red-100 text-red-800 border-red-300',
  default: 'bg-gray-100 text-gray-800 border-gray-300',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full font-semibold border',
      variants[variant],
      sizes[size],
    ]"
  >
    {{ label }}
  </span>
</template>
