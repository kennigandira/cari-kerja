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

      console.log(`Creating ${jobsWithoutCards.length} cards from jobs`)

      for (const job of jobsWithoutCards) {
        // Find the column for this job's status
        const columnName = statusToColumnMap[job.status]
        if (!columnName) {
          console.warn(`No column mapping for status: ${job.status}`)
          continue
        }

        const column = columns.value.find(c => c.name === columnName)
        if (!column) {
          console.warn(`Column not found: ${columnName}`)
          continue
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
          continue
        }

        if (newCard) {
          cards.value.push(newCard)
        }
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
    const previousCard = { ...cards.value[cardIndex] }
    const previousCards = [...cards.value]

    try {
      // Optimistic UI update
      cards.value[cardIndex] = {
        ...cards.value[cardIndex],
        column_id: toColumnId,
        position: newPosition,
        status_updated_at: new Date().toISOString()
      }

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
      cardPositions.forEach(({ id, position }) => {
        const cardIndex = cards.value.findIndex((c) => c.id === id)
        if (cardIndex !== -1) {
          cards.value[cardIndex] = {
            ...cards.value[cardIndex],
            position
          }
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
    syncJobsToCards,
    createCard,
    moveCardBetweenColumns,
    reorderCardsInColumn,
    deleteCard,

    // Real-time handlers
    handleCardInsert,
    handleCardUpdate,
    handleCardDelete
  }
})
