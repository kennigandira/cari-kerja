# API Specification - Kanban Job Application Tracker

**Version:** 1.0
**Last Updated:** October 5, 2025
**Author:** Backend Specialist (Foreman)

---

## Overview

### Architecture

```
Frontend (Vue 3 + Pinia)
    ↓ (Supabase Client)
Supabase PostgreSQL + RLS
    ↓ (WebSocket)
Real-time Subscriptions
```

**Key Design Principles:**
- Frontend communicates **DIRECTLY** with Supabase using `supabase-js` client
- No intermediate REST API layer
- Row Level Security (RLS) enforces authorization at database level
- Workers handle background cron jobs only (not API endpoints)
- Real-time updates via WebSocket subscriptions

### Authentication

All Supabase client requests automatically include JWT authentication:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// User authentication
const { data: { user }, error } = await supabase.auth.getUser()
```

---

## Supabase Client Operations

### 1. Kanban Columns

#### Get All Columns

```typescript
const { data: columns, error } = await supabase
  .from('kanban_columns')
  .select('*')
  .order('position', { ascending: true })

// Response Type
type KanbanColumn = {
  id: string
  user_id: string
  name: string
  position: number
  color: string
  is_default: boolean
  created_at: string
  updated_at: string
}
```

#### Create Column

```typescript
const { data: newColumn, error } = await supabase
  .from('kanban_columns')
  .insert({
    name: 'In Progress',
    position: 2,
    color: '#3b82f6'
  })
  .select()
  .single()
```

### 2. Kanban Cards

#### Get Cards for Column (with Job Details)

```typescript
const { data: cards, error } = await supabase
  .from('kanban_cards')
  .select(`
    *,
    job:jobs (
      id,
      company_name,
      position,
      location,
      application_date,
      status,
      notes
    )
  `)
  .eq('column_id', columnId)
  .is('archived_at', null)
  .order('position', { ascending: true })
```

## PostgreSQL RPC Functions

### 1. Move Card Between Columns

```typescript
const { data, error } = await supabase.rpc('move_card_between_columns', {
  p_card_id: cardId,
  p_target_column_id: targetColumnId,
  p_target_position: targetPosition
})
```

### 2. Reorder Cards in Column

```typescript
const { data, error } = await supabase.rpc('reorder_cards_in_column', {
  p_card_id: cardId,
  p_new_position: newPosition
})
```

## Real-time Subscriptions

### Subscribe to Kanban Changes

```typescript
const channel = supabase
  .channel('kanban-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'kanban_cards' },
    (payload) => {
      console.log('Card changed:', payload)
      handleKanbanChange(payload)
    }
  )
  .subscribe()

// Cleanup
onUnmounted(() => {
  supabase.removeChannel(channel)
})
```

---

**Complete API Specification**

For full implementation details including error handling, type definitions, optimistic update patterns, and usage examples, refer to the complete Backend Specialist (Foreman) assessment in the project documentation.

---

**Last Updated:** October 5, 2025
