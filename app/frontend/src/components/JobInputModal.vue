<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [content: string];
}>();

const inputContent = ref('');

const handleSubmit = () => {
  if (inputContent.value.trim()) {
    emit('submit', inputContent.value.trim());
    inputContent.value = '';
  }
};

const handleClose = () => {
  inputContent.value = '';
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
            <h2 class="text-2xl font-bold text-gray-900">Add New Job</h2>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Job Description (URL or Text)
            </label>
            <textarea
              v-model="inputContent"
              rows="10"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste job URL or full job description text here..."
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">
              You can paste either a URL (starting with http) or the full job description text
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
              :disabled="!inputContent.trim()"
              class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Submit
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
