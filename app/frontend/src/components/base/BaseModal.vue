<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import BaseButton from './BaseButton.vue'

interface Props {
  isOpen: boolean
  titleComponent: string
  size?: 'sm' | 'md' | 'lg' | 'xl'

}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const emit = defineEmits<{
  close: []
}>()

const modalRef = ref<HTMLElement>()

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

// Escape key handler
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

const handleClose = () => {
  emit('close')
}

// Body scroll lock
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="handleClose"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`modal-title-${$.uid}`"
      >
        <div
          ref="modalRef"
          :class="['bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]', sizes[size]]"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
            <div class="flex justify-between items-center">
              <h2 :id="`modal-title-${$.uid}`" class="text-2xl font-bold text-gray-900">
                {{ titleComponent }}
              </h2>
              <BaseButton
                variant="ghost"
                icon
                size="sm"
                aria-label="Close dialog"
                @click="handleClose"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </BaseButton>
            </div>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 overflow-y-auto flex-1 min-h-0">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95) translateY(-20px);
}
</style>
