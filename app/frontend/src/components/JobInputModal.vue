<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { onKeyStroke } from '@vueuse/core'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [content: string]
}>()

const inputContent = ref('')
const modalRef = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()

// Focus trap setup
const { activate, deactivate } = useFocusTrap(modalRef, {
  immediate: false,
  allowOutsideClick: true,
  escapeDeactivates: false, // We'll handle escape manually
})

// Escape key handler
onKeyStroke('Escape', (e) => {
  if (props.isOpen) {
    e.preventDefault()
    handleClose()
  }
})

const handleSubmit = () => {
  if (inputContent.value.trim()) {
    emit('submit', inputContent.value.trim())
    inputContent.value = ''
  }
}

const handleClose = () => {
  inputContent.value = ''
  emit('close')
}

// Auto-focus and focus trap management
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      activate()
      textareaRef.value?.focus()
    })
    // Lock body scroll
    document.body.style.overflow = 'hidden'
  } else {
    deactivate()
    // Unlock body scroll
    document.body.style.overflow = ''
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
  deactivate()
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
        aria-labelledby="modal-title"
      >
        <div
          ref="modalRef"
          class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div class="flex justify-between items-center">
              <h2 id="modal-title" class="text-2xl font-bold text-gray-900">
                Add New Job
              </h2>
              <button
                @click="handleClose"
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close dialog"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="px-6 py-5">
            <label for="job-input" class="block text-sm font-semibold text-gray-700 mb-2">
              Job Description
            </label>

            <div class="relative">
              <textarea
                id="job-input"
                ref="textareaRef"
                v-model="inputContent"
                rows="10"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Paste job URL or full job description text here..."
                aria-describedby="job-input-hint"
              ></textarea>
            </div>

            <div id="job-input-hint" class="mt-2 flex items-start gap-2">
              <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <p class="text-xs text-gray-500 leading-relaxed">
                Paste either a URL (starting with http:// or https://) or the complete job description text.
                We'll automatically extract the relevant information to create your tailored CV and cover letter.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              @click="handleClose"
              class="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              @click="handleSubmit"
              :disabled="!inputContent.trim()"
              class="px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Create Job Application
            </button>
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
