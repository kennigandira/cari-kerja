<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const emit = defineEmits<{
  close: []
  authenticated: []
}>()

const email = ref('')
const password = ref('')
const isSignUp = ref(false)
const error = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    if (isSignUp.value) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.value,
        password: password.value
      })
      if (signUpError) throw signUpError

      // Auto login after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })
      if (signInError) throw signInError
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })
      if (signInError) throw signInError
    }

    emit('authenticated')
    emit('close')
  } catch (err: any) {
    error.value = err.message || 'Authentication failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg p-8 w-full max-w-md min-w-[320px]">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">
        {{ isSignUp ? 'Create Account' : 'Sign In' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In') }}
        </button>
      </form>

      <div class="mt-4 text-center">
        <button
          @click="isSignUp = !isSignUp"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          {{ isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up" }}
        </button>
      </div>
    </div>
  </div>
</template>
