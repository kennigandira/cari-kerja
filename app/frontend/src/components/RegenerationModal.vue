<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  jobId: string;
  documentId: string;
  documentType: string;
}>();

const emit = defineEmits<{
  close: [];
  submit: [feedback: string];
}>();

const feedback = ref('');

const handleSubmit = () => {
  if (feedback.value.trim()) {
    emit('submit', feedback.value.trim());
    feedback.value = '';
  }
};

const handleClose = () => {
  feedback.value = '';
  emit('close');
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click.self="handleClose"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-900">Regenerate {{ documentType.toUpperCase() }}</h2>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              What would you like to change?
            </label>
            <textarea
              v-model="feedback"
              rows="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Example: Make the tone more casual, emphasize my performance optimization experience, reduce the length by 20%, etc."
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">
              Be specific about what you want to change. The AI will regenerate the document based on your feedback.
            </p>
          </div>

          <div class="flex justify-end gap-3">
            <button
              @click="handleClose"
              class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleSubmit"
              :disabled="!feedback.trim()"
              class="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Regenerate
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
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
