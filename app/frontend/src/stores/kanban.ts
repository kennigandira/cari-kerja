/**
 * Kanban Store - Pinia State Management
 *
 * Manages columns, cards, and activities with optimistic UI updates.
 * Implements rollback on error and real-time sync coordination.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type {
  KanbanColumn,
  KanbanCard,
  KanbanCardActivity,
  MoveCardPayload,
  ReorderCardsPayload
} from '@/types/kanban'
import type { Job } from '@/../../shared/types'

export const useKanbanStore = defineStore('kanban', () => {
  // State
  const columns = ref<KanbanColumn[]>([])
  const cards = ref<KanbanCard[]>([])
  const activities = ref<KanbanCardActivity[]>([])
  const jobs = ref<Job[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Job cache for detail modal (5 min TTL)
  const jobCache = ref<Map<string, { job: Job; timestamp: number }>>(new Map())
  const JOB_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  // Computed
  const cardsByColumn = computed(() => {
    const columnMap = new Map<string, KanbanCard[]>()

    columns.value.forEach((column) => {
      const columnCards = cards.value
        .filter((card) => card.column_id === column.id)
        .sort((a, b) => a.position - b.position)
      columnMap.set(column.id, columnCards)
    })

    return columnMap
  })

  const sortedColumns = computed(() => {
    return [...columns.value].sort((a, b) => a.position - b.position)
  })

  // Actions
  async function fetchColumns() {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('position', { ascending: true })

      if (fetchError) throw fetchError

      columns.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch columns'
      console.error('Error fetching columns:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchCards() {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('kanban_cards')
        .select('*')
        .order('position', { ascending: true })

      if (fetchError) throw fetchError

      cards.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch cards'
      console.error('Error fetching cards:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchActivities(cardId?: string) {
    try {
      let query = supabase
        .from('kanban_card_activities')
        .select('*')
        .order('created_at', { ascending: false })

      if (cardId) {
        query = query.eq('card_id', cardId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      activities.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch activities'
      console.error('Error fetching activities:', err)
    }
  }

  async function fetchJobs() {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      jobs.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch jobs'
      console.error('Error fetching jobs:', err)
    } finally {
      loading.value = false
    }
  }

  // Map jobs.status to column names
  const statusToColumnMap: Record<string, string> = {
    'to_submit': 'To Submit',
    'waiting_for_call': 'Waiting for Call',
    'ongoing': 'Interviewing',
    'success': 'Accepted',
    'not_now': 'Not now'
  }

  async function createCardForJob(job: Job) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('No authenticated user, cannot create card')
        return null
      }

      // Check if card already exists
      const existingCard = cards.value.find(c => c.job_id === job.id)
      if (existingCard) {
        console.log('Card already exists for job:', job.id)
        return existingCard
      }

      // Find the column for this job's status
      const columnName = statusToColumnMap[job.status]
      if (!columnName) {
        console.warn(`No column mapping for status: ${job.status}`)
        return null
      }

      const column = columns.value.find(c => c.name === columnName)
      if (!column) {
        console.warn(`Column not found: ${columnName}`)
        return null
      }

      // Get next position in this column
      const columnCards = cards.value.filter(c => c.column_id === column.id)
      const nextPosition = columnCards.length

      // Create card with user_id
      const { data: newCard, error: createError } = await supabase
        .from('kanban_cards')
        .insert({
          user_id: user.id,
          column_id: column.id,
          job_id: job.id,
          position: nextPosition,
          company_name: job.company_name || 'Unknown Company',
          job_title: job.position_title || 'Unknown Position',
          application_date: job.created_at,
          application_folder_path: job.folder_path
        })
        .select()
        .single()

      if (createError) {
        console.error(`Failed to create card for job ${job.id}:`, createError)
        throw createError
      }

      if (newCard) {
        cards.value.push(newCard)
        console.log('Card created for job:', job.id)
      }

      return newCard
    } catch (err) {
      console.error('Failed to create card for job:', err)
      throw err
    }
  }

  async function syncJobsToCards() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('No authenticated user, cannot create cards')
        return
      }

      // Get jobs that don't have cards yet
      const existingCardJobIds = new Set(
        cards.value.filter(c => c.job_id).map(c => c.job_id)
      )

      const jobsWithoutCards = jobs.value.filter(job => !existingCardJobIds.has(job.id))

      if (jobsWithoutCards.length === 0) {
        console.log('No jobs without cards')
        return
      }

      console.log(`Creating ${jobsWithoutCards.length} cards from jobs`)

      // Batch insert: prepare all cards data
      const cardsToInsert = jobsWithoutCards
        .map(job => {
          const columnName = statusToColumnMap[job.status]
          if (!columnName) {
            console.warn(`No column mapping for status: ${job.status}`)
            return null
          }

          const column = columns.value.find(c => c.name === columnName)
          if (!column) {
            console.warn(`Column not found: ${columnName}`)
            return null
          }

          // Get next position in this column
          const columnCards = cards.value.filter(c => c.column_id === column.id)
          const nextPosition = columnCards.length

          return {
            user_id: user.id,
            column_id: column.id,
            job_id: job.id,
            position: nextPosition,
            company_name: job.company_name || 'Unknown Company',
            job_title: job.position_title || 'Unknown Position',
            application_date: job.created_at,
            application_folder_path: job.folder_path
          }
        })
        .filter(card => card !== null)

      if (cardsToInsert.length === 0) {
        console.log('No valid cards to insert')
        return
      }

      // Single batch insert
      const { data: newCards, error: batchError } = await supabase
        .from('kanban_cards')
        .insert(cardsToInsert)
        .select()

      if (batchError) {
        console.error('Batch insert failed:', batchError)
        throw batchError
      }

      if (newCards) {
        cards.value.push(...newCards)
        console.log(`Successfully created ${newCards.length} cards`)
      }

      console.log('Jobs synced to cards successfully')
    } catch (err) {
      console.error('Failed to sync jobs to cards:', err)
      throw err
    }
  }

  async function createCard(cardData: Omit<KanbanCard, 'id' | 'created_at' | 'updated_at' | 'status_updated_at' | 'user_id'>) {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('kanban_cards')
        .insert({
          ...cardData,
          status_updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Optimistically add to local state
      if (data) {
        cards.value.push(data)
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create card'
      console.error('Error creating card:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function moveCardBetweenColumns(payload: MoveCardPayload) {
    const { cardId, fromColumnId, toColumnId, newPosition } = payload

    // Find the card for optimistic update
    const cardIndex = cards.value.findIndex((c) => c.id === cardId)
    if (cardIndex === -1) {
      error.value = 'Card not found'
      return
    }

    // Store previous state for rollback
    const previousCards = [...cards.value]

    try {
      // Optimistic UI update
      const currentCard = cards.value[cardIndex]
      cards.value[cardIndex] = {
        ...currentCard,
        column_id: toColumnId,
        position: newPosition,
        status_updated_at: new Date().toISOString()
      } as KanbanCard

      // Call RPC function for atomic backend update
      const { error: rpcError } = await supabase.rpc('move_card_between_columns', {
        p_card_id: cardId,
        p_from_column_id: fromColumnId,
        p_to_column_id: toColumnId,
        p_new_position: newPosition
      })

      if (rpcError) throw rpcError

      // Refresh cards to get server state
      await fetchCards()
    } catch (err) {
      // Rollback on error
      cards.value = previousCards
      error.value = err instanceof Error ? err.message : 'Failed to move card'
      console.error('Error moving card:', err)
      throw err
    }
  }

  async function reorderCardsInColumn(payload: ReorderCardsPayload) {
    const { columnId, cardPositions } = payload

    // Store previous state for rollback
    const previousCards = [...cards.value]

    try {
      // Optimistic UI update
      cardPositions.forEach(({ id, position }: { id: string; position: number }) => {
        const cardIndex = cards.value.findIndex((c) => c.id === id)
        if (cardIndex !== -1) {
          const currentCard = cards.value[cardIndex]
          cards.value[cardIndex] = {
            ...currentCard,
            position
          } as KanbanCard
        }
      })

      // Call RPC function for atomic backend update
      const { error: rpcError } = await supabase.rpc('reorder_cards_in_column', {
        p_column_id: columnId,
        p_card_positions: cardPositions
      })

      if (rpcError) throw rpcError

      // Refresh cards to get server state
      await fetchCards()
    } catch (err) {
      // Rollback on error
      cards.value = previousCards
      error.value = err instanceof Error ? err.message : 'Failed to reorder cards'
      console.error('Error reordering cards:', err)
      throw err
    }
  }

  async function deleteCard(cardId: string) {
    // Store previous state for rollback
    const previousCards = [...cards.value]

    try {
      loading.value = true
      error.value = null

      // Optimistic removal
      cards.value = cards.value.filter((c) => c.id !== cardId)

      const { error: deleteError } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('id', cardId)

      if (deleteError) throw deleteError
    } catch (err) {
      // Rollback on error
      cards.value = previousCards
      error.value = err instanceof Error ? err.message : 'Failed to delete card'
      console.error('Error deleting card:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Real-time sync handlers (called by useRealtimeSync composable)
  function handleCardInsert(newCard: KanbanCard) {
    const existingIndex = cards.value.findIndex((c) => c.id === newCard.id)
    if (existingIndex === -1) {
      cards.value.push(newCard)
    }
  }

  function handleCardUpdate(updatedCard: KanbanCard) {
    const index = cards.value.findIndex((c) => c.id === updatedCard.id)
    if (index !== -1) {
      cards.value[index] = updatedCard
    }
  }

  function handleCardDelete(deletedCard: KanbanCard) {
    cards.value = cards.value.filter((c) => c.id !== deletedCard.id)
  }

  // Helper function to add timeout to promises
  async function fetchWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout - please try again')), timeoutMs)
    )
    return Promise.race([promise, timeoutPromise])
  }

  // Job caching for detail modal
  async function getJobWithCache(jobId: string, forceRefresh = false): Promise<Job> {
    const cached = jobCache.value.get(jobId)
    const now = Date.now()

    // Return cached if valid and not forcing refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < JOB_CACHE_TTL) {
      console.log('✓ Using cached job:', jobId)
      return cached.job
    }

    // Fetch from API with timeout protection
    console.log('→ Fetching job from API:', jobId)

    try {
      const fetchPromise = supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      const { data, error: fetchError } = await fetchWithTimeout(fetchPromise, 10000)

      if (fetchError) {
        // Provide better error messages based on error type
        if (fetchError.code === 'PGRST116') {
          throw new Error('Job not found - it may have been deleted')
        }
        if (fetchError.message.includes('row-level security')) {
          throw new Error('You do not have permission to view this job')
        }
        throw new Error(`Failed to fetch job: ${fetchError.message}`)
      }

      if (!data) {
        throw new Error('Job not found')
      }

      // Update cache
      jobCache.value.set(jobId, { job: data, timestamp: now })
      console.log('✓ Job cached:', jobId)

      return data
    } catch (err) {
      console.error('Error fetching job:', err)
      throw err
    }
  }

  function invalidateJobCache(jobId: string) {
    jobCache.value.delete(jobId)
    console.log('✓ Cache invalidated for job:', jobId)
  }

  function clearJobCache() {
    jobCache.value.clear()
    console.log('✓ All job cache cleared')
  }

  return {
    // State
    columns,
    cards,
    activities,
    jobs,
    loading,
    error,

    // Computed
    cardsByColumn,
    sortedColumns,

    // Actions
    fetchColumns,
    fetchCards,
    fetchActivities,
    fetchJobs,
    createCardForJob,
    syncJobsToCards,
    createCard,
    moveCardBetweenColumns,
    reorderCardsInColumn,
    deleteCard,

    // Real-time handlers
    handleCardInsert,
    handleCardUpdate,
    handleCardDelete,

    // Job caching
    getJobWithCache,
    invalidateJobCache,
    clearJobCache
  }
})
