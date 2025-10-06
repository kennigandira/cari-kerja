<script setup lang="ts">
/**
 * KanbanBoard Component
 *
 * Main Kanban board container that:
 * - Displays all 7 workflow columns
 * - Manages real-time sync
 * - Handles loading and error states
 * - Implements horizontal scroll for mobile
 * - Handles authentication
 */

import { onMounted, computed, ref } from 'vue'
import KanbanColumn from './KanbanColumn.vue'
import AuthModal from '../AuthModal.vue'
import JobDetailModal from '../JobDetailModal.vue'
import JobParserModal from '../JobParserModal.vue'
import { useKanbanStore } from '@/stores/kanban'
import { useRealtimeSync } from '@/composables/useRealtimeSync'
import { supabase } from '@/lib/supabase'

const kanbanStore = useKanbanStore()
const { isConnected } = useRealtimeSync()

const IS_LOADING = computed(() => kanbanStore.loading)
const ERROR = computed(() => kanbanStore.error)
const COLUMNS = computed(() => kanbanStore.sortedColumns)
const showAuthModal = ref(false)
const currentUser = ref<any>(null)

// Job Detail Modal state
const isModalOpen = ref(false)
const selectedJobId = ref<string | null>(null)

// Job Parser Modal state
const isParserModalOpen = ref(false)

const loadData = async () => {
  console.log('Loading Kanban data...')
  try {
    // Initialize kanban columns for user if they don't exist
    try {
      await supabase.rpc('initialize_user_kanban_columns')
      console.log('Kanban columns initialized')
    } catch (initError) {
      // Ignore errors - columns might already exist
      console.log('Kanban columns already exist or init skipped')
    }

    await Promise.all([
      kanbanStore.fetchColumns(),
      kanbanStore.fetchCards(),
      kanbanStore.fetchJobs()
    ])
    console.log('Kanban data loaded successfully')
    console.log(`Loaded ${kanbanStore.jobs.length} jobs`)

    // Auto-create cards from jobs
    await kanbanStore.syncJobsToCards()
  } catch (error) {
    console.error('Failed to load Kanban data:', error)
  }
}

const handleAuthenticated = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  currentUser.value = user
  await loadData()
}

const handleSignOut = async () => {
  await supabase.auth.signOut()
  currentUser.value = null
  showAuthModal.value = true
}

// Job Detail Modal handlers
const handleCardClick = (_cardId: string, jobId: string | null) => {
  selectedJobId.value = jobId
  isModalOpen.value = true
}

const handlePrefetch = async (jobId: string | null) => {
  if (!jobId) return

  // Prefetch in background (silent fail)
  try {
    await kanbanStore.getJobWithCache(jobId)
  } catch (err) {
    // Silent fail - prefetch is best-effort
    console.log('Prefetch failed (silent):', err)
  }
}

const closeModal = () => {
  isModalOpen.value = false
  selectedJobId.value = null
}

const handleJobDelete = async (_jobId: string) => {
  // Refresh data after delete
  await kanbanStore.fetchCards()
  await kanbanStore.fetchJobs()
  await kanbanStore.syncJobsToCards()
}

const handleStatusChange = async (_jobId: string, _newStatus: string) => {
  // Refresh data after status change
  await kanbanStore.fetchCards()
  await kanbanStore.fetchJobs()
  await kanbanStore.syncJobsToCards()
}

// Job Parser Modal handlers
const handleJobAdded = async (jobId: string) => {
  console.log('Job added via parser:', jobId)

  // Refresh kanban data
  await kanbanStore.fetchJobs()
  await kanbanStore.syncJobsToCards()

  console.log('✅ Job added successfully!')
}

onMounted(async () => {
  console.log('KanbanBoard mounted, checking auth...')

  // Check if user is already logged in
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user) {
    currentUser.value = session.user
    await loadData()
  } else {
    showAuthModal.value = true
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event)
    if (session?.user) {
      currentUser.value = session.user
      showAuthModal.value = false
      await loadData()
    } else {
      currentUser.value = null
      showAuthModal.value = true
    }
  })
})
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Job Application Tracker
          </h1>
          <p class="text-sm text-gray-600 mt-1">
            Manage your applications across 7 workflow stages
          </p>
        </div>

        <!-- User Info & Actions -->
        <div class="flex items-center gap-4">
          <!-- Add Job Target Button -->
          <button
            v-if="currentUser"
            @click="isParserModalOpen = true"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Job Target
          </button>

          <div v-if="currentUser" class="flex items-center gap-2">
            <span class="text-sm text-gray-600">{{ currentUser.email }}</span>
            <button
              @click="handleSignOut"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              Sign Out
            </button>
          </div>
          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              ]"
            />
            <span class="text-sm text-gray-600">
              {{ isConnected ? 'Live sync' : 'Offline' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="IS_LOADING"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p class="text-gray-600 mt-4">Loading applications...</p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="ERROR"
      class="flex-1 flex items-center justify-center"
    >
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <h3 class="text-red-800 font-semibold mb-2">Error Loading Data</h3>
        <p class="text-red-600 text-sm">{{ ERROR }}</p>
        <button
          type="button"
          class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          @click="kanbanStore.fetchColumns(); kanbanStore.fetchCards()"
        >
          Retry
        </button>
      </div>
    </div>

    <!-- Kanban Board -->
    <div
      v-else
      class="flex-1 overflow-x-auto overflow-y-hidden"
    >
      <div class="flex gap-4 p-6 min-h-full">
        <KanbanColumn
          v-for="column in COLUMNS"
          :key="column.id"
          :column="column"
          @card-click="handleCardClick"
          @card-prefetch="handlePrefetch"
        />
      </div>
    </div>

    <!-- Job Detail Modal -->
    <JobDetailModal
      :is-open="isModalOpen"
      :job-id="selectedJobId"
      @close="closeModal"
      @delete="handleJobDelete"
      @statusChange="handleStatusChange"
    />

    <!-- Job Parser Modal -->
    <JobParserModal
      :is-open="isParserModalOpen"
      @close="isParserModalOpen = false"
      @success="handleJobAdded"
    />

    <!-- Auth Modal -->
    <AuthModal
      v-if="showAuthModal"
      @close="showAuthModal = false"
      @authenticated="handleAuthenticated"
    />
  </div>
</template>
