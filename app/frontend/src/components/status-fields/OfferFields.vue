<script setup lang="ts">
/**
 * OfferFields Component
 *
 * Captures salary offer details and displays AI analysis (Phase 2)
 * Phase 1: Basic salary input
 * Phase 2: AI-powered salary competitiveness analysis
 */

import { ref } from 'vue'
import type { Job } from '@/shared/types'
import BaseButton from '../base/BaseButton.vue'

interface Props {
  job: Job
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<Job>]
  accept: []
  decline: []
}>()

// Local state
const salaryAmount = ref(props.job.salary_offer_amount || 0)
const currency = ref(props.job.salary_offer_currency || 'THB')
const benefits = ref(props.job.offer_benefits || '')

const currencyOptions = [
  { value: 'THB', label: '฿ THB (Thai Baht)' },
  { value: 'USD', label: '$ USD (US Dollar)' },
  { value: 'EUR', label: '€ EUR (Euro)' },
  { value: 'GBP', label: '£ GBP (British Pound)' },
  { value: 'SGD', label: 'S$ SGD (Singapore Dollar)' },
  { value: 'AUD', label: 'A$ AUD (Australian Dollar)' }
]

const handleUpdate = () => {
  emit('update', {
    salary_offer_amount: salaryAmount.value,
    salary_offer_currency: currency.value,
    offer_benefits: benefits.value
  })
}

const handleAccept = () => {
  if (confirm(`Accept the offer from ${props.job.company_name}?`)) {
    emit('accept')
  }
}

const handleDecline = () => {
  if (confirm(`Decline the offer from ${props.job.company_name}? This will move the application to "Not Now" status.`)) {
    emit('decline')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Salary Input Section -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="salary-amount" class="block text-sm font-medium text-gray-700 mb-2">
          Annual Salary Offer
        </label>
        <input
          id="salary-amount"
          v-model.number="salaryAmount"
          type="number"
          min="0"
          step="1000"
          @blur="handleUpdate"
          placeholder="1200000"
          class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <label for="currency" class="block text-sm font-medium text-gray-700 mb-2">
          Currency
        </label>
        <select
          id="currency"
          v-model="currency"
          @change="handleUpdate"
          class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        >
          <option
            v-for="option in currencyOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Benefits Section -->
    <div>
      <label for="benefits" class="block text-sm font-medium text-gray-700 mb-2">
        Benefits & Perks
      </label>
      <textarea
        id="benefits"
        v-model="benefits"
        @blur="handleUpdate"
        rows="3"
        placeholder="e.g., Health insurance, stock options, remote work, 20 days vacation"
        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm resize-none"
      />
    </div>

    <!-- AI Analysis Placeholder (Phase 2) -->
    <div class="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300">
      <p class="text-sm text-gray-600 text-center mb-2">
        ✨ AI Salary Competitiveness Analysis
      </p>
      <p class="text-xs text-gray-500 text-center">
        Coming in Phase 2: AI-powered market comparison with sources
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-3 pt-4 border-t">
      <BaseButton
        variant="primary"
        size="md"
        @click="handleAccept"
        class="flex-1"
      >
        ✓ Accept Offer
      </BaseButton>
      <BaseButton
        variant="ghost"
        size="md"
        @click="handleDecline"
        class="flex-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
      >
        ✗ Decline
      </BaseButton>
    </div>
  </div>
</template>
