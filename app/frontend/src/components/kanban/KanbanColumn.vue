<script setup lang="ts">
/**
 * KanbanColumn Component
 *
 * Displays a single column with draggable cards.
 * Uses vuedraggable v4 for drag-and-drop functionality.
 * Implements optimistic UI updates with error rollback.
 */

import { computed } from 'vue'
import draggable from 'vuedraggable'
import ApplicationCard from './ApplicationCard.vue'
import { useKanbanStore } from '@/stores/kanban'
import type { KanbanColumn, KanbanCard, ChangeEvent } from '@/types/kanban'

const props = defineProps<{
  column: KanbanColumn
}>()

const emit = defineEmits<{
  'card-click': [cardId: string, jobId: string | null]
  'card-prefetch': [jobId: string | null]
}>()

const kanbanStore = useKanbanStore()

const COLUMN_CARDS = computed({
  get: () => kanbanStore.cardsByColumn.get(props.column.id) || [],
  set: () => {
    // Draggable requires a setter, but we handle updates via store
  }
})

const CARD_COUNT = computed(() => COLUMN_CARDS.value.length)

// Drag event handlers
const handleChange = async (event: ChangeEvent) => {
  console.log('Column change event:', event)

  // Card moved within same column
  if (event.moved) {
    const { newIndex } = event.moved

    const cardPositions = COLUMN_CARDS.value.map((card, index) => {
      const position = index === newIndex ? newIndex : (index < newIndex ? index : index + 1)
      return { id: card.id, position }
    })

    try {
      await kanbanStore.reorderCardsInColumn({
        columnId: props.column.id,
        cardPositions
      })
    } catch (error) {
      console.error('Failed to reorder cards:', error)
    }
  }

  // Card added from another column
  if (event.added) {
    const { element, newIndex } = event.added

    // Find the source column ID (stored in the card)
    const fromColumnId = element.column_id

    try {
      await kanbanStore.moveCardBetweenColumns({
        cardId: element.id,
        fromColumnId,
        toColumnId: props.column.id,
        newPosition: newIndex
      })
    } catch (error) {
      console.error('Failed to move card:', error)
    }
  }
}

const handleCardClick = (cardId: string, jobId: string | null) => {
  emit('card-click', cardId, jobId)
}

const handlePrefetch = (jobId: string | null) => {
  emit('card-prefetch', jobId)
}

const handleDelete = async (cardId: string) => {
  try {
    await kanbanStore.deleteCard(cardId)
  } catch (error) {
    console.error('Failed to delete card:', error)
  }
}
</script>

<template>
  <div class="bg-gray-50 rounded-lg p-4 min-w-[300px] max-w-[350px] flex flex-col h-[calc(100vh-180px)]">
    <!-- Column Header -->
    <div class="mb-4 flex-shrink-0">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ column.name }}
        </h2>
        <span class="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
          {{ CARD_COUNT }}
        </span>
      </div>
    </div>

    <!-- Draggable Cards Container -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <draggable
        v-model="COLUMN_CARDS"
        :group="{ name: 'kanban-cards' }"
        :item-key="(card: KanbanCard) => card.id"
        :animation="200"
        ghost-class="opacity-50"
        chosen-class="shadow-lg"
        drag-class="rotate-2"
        @change="handleChange"
        class="min-h-[200px]"
      >
        <template #item="{ element }">
          <ApplicationCard
            :key="element.id"
            :card="element"
            @delete="handleDelete"
            @click="handleCardClick"
            @prefetch="handlePrefetch"
          />
        </template>
      </draggable>
    </div>

    <!-- Add Card Button (Phase 2) -->
    <div class="mt-4 flex-shrink-0">
      <button
        type="button"
        class="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors"
      >
        + Add application
      </button>
    </div>
  </div>
</template>
