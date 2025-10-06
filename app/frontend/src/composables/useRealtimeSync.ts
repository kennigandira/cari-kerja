/**
 * Real-time Sync Composable
 *
 * Manages Supabase real-time subscriptions with 150ms debounce.
 * Prevents update loops and handles multi-device sync.
 */

import { onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useKanbanStore } from '@/stores/kanban'
import type { KanbanCard } from '@/types/kanban'
import type { RealtimeChannel } from '@supabase/supabase-js'

const DEBOUNCE_DELAY_MS = 150

export function useRealtimeSync() {
  const kanbanStore = useKanbanStore()
  const channel = ref<RealtimeChannel | null>(null)
  const isConnected = ref(false)
  const lastUpdateTimestamp = ref(0)

  // Debounced update handler
  const debouncedUpdateHandler = (
    handler: (payload: any) => void,
    delay: number
  ) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return (payload: any) => {
      const now = Date.now()

      // Skip if update happened very recently (within debounce window)
      if (now - lastUpdateTimestamp.value < delay) {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
          handler(payload)
          lastUpdateTimestamp.value = Date.now()
        }, delay)
        return
      }

      // Execute immediately if outside debounce window
      handler(payload)
      lastUpdateTimestamp.value = now
    }
  }

  // Real-time event handlers
  const handleInsert = debouncedUpdateHandler(
    (payload: { new: KanbanCard }) => {
      console.log('Real-time INSERT:', payload.new)
      kanbanStore.handleCardInsert(payload.new)
    },
    DEBOUNCE_DELAY_MS
  )

  const handleUpdate = debouncedUpdateHandler(
    (payload: { new: KanbanCard; old: KanbanCard }) => {
      console.log('Real-time UPDATE:', payload.new)
      kanbanStore.handleCardUpdate(payload.new)
    },
    DEBOUNCE_DELAY_MS
  )

  const handleDelete = debouncedUpdateHandler(
    (payload: { old: KanbanCard }) => {
      console.log('Real-time DELETE:', payload.old)
      kanbanStore.handleCardDelete(payload.old)
    },
    DEBOUNCE_DELAY_MS
  )

  function subscribe() {
    if (channel.value) {
      console.warn('Already subscribed to real-time updates')
      return
    }

    console.log('Subscribing to kanban_cards real-time updates...')

    channel.value = supabase
      .channel('kanban_cards_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'kanban_cards'
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kanban_cards'
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'kanban_cards'
        },
        handleDelete
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status)
        isConnected.value = status === 'SUBSCRIBED'
      })
  }

  function unsubscribe() {
    if (channel.value) {
      console.log('Unsubscribing from real-time updates...')
      supabase.removeChannel(channel.value as any).then(() => {
        channel.value = null
        isConnected.value = false
      })
    }
  }

  // Auto-subscribe on mount, unsubscribe on unmount
  onMounted(() => {
    subscribe()
  })

  onUnmounted(() => {
    unsubscribe()
  })

  return {
    isConnected,
    subscribe,
    unsubscribe
  }
}
