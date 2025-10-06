/**
 * Kanban Job Application Tracker - Type Definitions
 *
 * Defines interfaces for columns, cards, and activities.
 * All types match the database schema from DatabaseSchema.md
 */

export interface KanbanColumn {
  id: string
  user_id: string
  name: string
  position: number
  color: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface KanbanCard {
  id: string
  column_id: string
  user_id: string
  position: number
  company_name: string
  job_title: string
  job_id: string | null
  application_date: string | null
  application_folder_path: string | null
  status_updated_at: string
  created_at: string
  updated_at: string
}

export interface KanbanCardActivity {
  id: string
  card_id: string
  user_id: string
  activity_type: 'card_created' | 'card_moved' | 'card_archived' | 'card_restored' | 'field_updated'
  from_column_id: string | null
  to_column_id: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface MoveCardPayload {
  cardId: string
  fromColumnId: string
  toColumnId: string
  newPosition: number
}

export interface ReorderCardsPayload {
  columnId: string
  cardPositions: Array<{ id: string; position: number }>
}

// Drag event types for vuedraggable
export interface DragEvent {
  oldIndex: number
  newIndex: number
  from: HTMLElement
  to: HTMLElement
  item: HTMLElement
}

export interface ChangeEvent {
  added?: { element: KanbanCard; newIndex: number }
  removed?: { element: KanbanCard; oldIndex: number }
  moved?: { element: KanbanCard; oldIndex: number; newIndex: number }
}
