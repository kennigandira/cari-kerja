# Frontend Components Specification - Kanban Job Application Tracker

**Project:** Job Application Kanban Tracker
**Tech Stack:** Vue 3.5.22, Pinia, TypeScript, Tailwind CSS, Vite
**Drag Library:** vuedraggable v4.1.0
**Last Updated:** 2025-10-05
**Author:** Frontend Specialist (Chase)

---

## Component Architecture

### Component Hierarchy

```
KanbanBoard.vue (Container)
├── KanbanSkeleton.vue (Loading State)
└── KanbanColumn.vue (Droppable) × 7 columns
    └── ApplicationCard.vue (Draggable) × N cards
```

### Data Flow

```
User Action → Optimistic UI Update → API Call → Realtime Sync → State Update
```

### Column Stages

1. **Interested** - Saved but not applied
2. **Applied** - Application submitted
3. **Interviewing** - In interview process
4. **Offer** - Job offer received
5. **Rejected** - Application declined
6. **Accepted** - Offer accepted
7. **Withdrawn** - Withdrawn by candidate

---

## Core Components

### 1. KanbanBoard.vue (Container)

**Purpose:** Root container managing board state, drag context, and real-time synchronization.

**File Location:** `app/frontend/src/components/kanban/KanbanBoard.vue`

#### Props

```typescript
interface Props {
  initialJobs?: Job[]
  autoSync?: boolean // Enable real-time sync (default: true)
  enableKeyboardNav?: boolean // Keyboard navigation (default: true)
}
```

#### Emits

```typescript
interface Emits {
  (e: 'card-moved', payload: CardMovedEvent): void
  (e: 'card-clicked', card: Card, job: Job): void
  (e: 'error', error: Error): void
}
```

### 2. KanbanColumn.vue (Droppable)

**Purpose:** Vertical column containing draggable application cards with drop zone.

**File Location:** `app/frontend/src/components/kanban/KanbanColumn.vue`

#### Implementation with vuedraggable

```vue
<template>
  <div class="kanban-column" :data-column-id="column.id">
    <header class="column-header">
      <h2 class="column-title">{{ column.title }}</h2>
      <span class="column-count">{{ cards.length }}</span>
    </header>

    <draggable
      v-model="localCards"
      :group="{ name: 'cards', pull: true, put: true }"
      :animation="200"
      ghost-class="card-ghost"
      chosen-class="card-chosen"
      drag-class="card-drag"
      handle=".drag-handle"
      class="column-content"
      item-key="id"
      @change="handleDragChange"
    >
      <template #item="{ element: card }">
        <ApplicationCard
          :card="card"
          :job="getJob(card.jobId)"
          @click="$emit('card-clicked', card, getJob(card.jobId))"
        />
      </template>
    </draggable>
  </div>
</template>
```

### 3. ApplicationCard.vue (Draggable)

**Purpose:** Individual job application card with drag handle and job metadata.

**File Location:** `app/frontend/src/components/kanban/ApplicationCard.vue`

```vue
<template>
  <article class="application-card">
    <button class="drag-handle" aria-label="Drag card">
      <Icon icon="mdi:drag-vertical" />
    </button>

    <div class="card-content">
      <h3 class="position-title">{{ job.position_title }}</h3>
      <p class="company-name">{{ job.company_name }}</p>
      <span class="application-date">{{ formatDate(job.applied_date) }}</span>
    </div>
  </article>
</template>
```

---

## State Management

### Pinia Store: `useKanbanStore`

**File Location:** `app/frontend/src/stores/kanban.ts`

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useKanbanStore = defineStore('kanban', () => {
  const jobs = ref<Job[]>([])
  const cards = ref<Card[]>([])
  const columns = ref<Column[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchBoard() {
    isLoading.value = true
    try {
      // Fetch columns
      const { data: columnsData } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('position')

      // Fetch cards with jobs
      const { data: cardsData } = await supabase
        .from('kanban_cards')
        .select('*, job:jobs(*)')
        .is('archived_at', null)
        .order('position')

      columns.value = columnsData || []
      cards.value = cardsData || []
    } catch (err) {
      error.value = err as Error
    } finally {
      isLoading.value = false
    }
  }

  async function moveCard(cardId: string, targetColumnId: string, targetPosition: number) {
    try {
      await supabase.rpc('move_card_between_columns', {
        p_card_id: cardId,
        p_target_column_id: targetColumnId,
        p_target_position: targetPosition
      })
    } catch (err) {
      error.value = err as Error
      throw err
    }
  }

  return {
    jobs,
    cards,
    columns,
    isLoading,
    error,
    fetchBoard,
    moveCard
  }
})
```

---

## Composables

### useRealtimeSync

**File Location:** `app/frontend/src/composables/useRealtimeSync.ts`

```typescript
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'

export function useRealtimeSync(onUpdate: (payload: any) => void) {
  const isConnected = ref(false)
  let channel: any = null

  onMounted(() => {
    channel = supabase
      .channel('kanban-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_cards' },
        (payload) => onUpdate(payload)
      )
      .subscribe()

    isConnected.value = true
  })

  onUnmounted(() => {
    if (channel) {
      supabase.removeChannel(channel)
    }
  })

  return { isConnected }
}
```

---

## Styling Guidelines

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        kanban: {
          interested: '#9333EA',  // purple-600
          applied: '#3B82F6',     // blue-500
          interviewing: '#F59E0B', // yellow-500
          offer: '#10B981',       // green-500
          rejected: '#EF4444',    // red-500
          accepted: '#059669',    // emerald-600
          withdrawn: '#6B7280',   // gray-500
        }
      }
    }
  }
}
```

---

## Accessibility

### WCAG 2.1 AA Compliance

- ✅ Keyboard navigation (Tab, Enter, Arrow keys, Escape)
- ✅ Screen reader support (ARIA labels, live regions)
- ✅ Color contrast (4.5:1 text, 3:1 UI components)
- ✅ Touch targets (40x40px minimum on mobile)
- ✅ Focus indicators (visible 2px ring)

---

**Complete Frontend Components Specification**

For full component implementations, Pinia store patterns, composables, styling guidelines, and accessibility requirements, refer to the complete Frontend Specialist (Chase) assessment in the project documentation.

---

**Last Updated:** October 5, 2025
