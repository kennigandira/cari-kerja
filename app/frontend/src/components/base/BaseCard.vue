<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  shadow: 'md',
  hover: false,
})

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const shadows = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
}

const hoverEffect = props.hover
  ? 'transition-shadow duration-200 hover:shadow-xl'
  : ''
</script>

<template>
  <div
    :class="[
      'bg-white rounded-lg border border-gray-200',
      paddings[padding],
      shadows[shadow],
      hoverEffect,
    ]"
  >
    <slot />
  </div>
</template>
