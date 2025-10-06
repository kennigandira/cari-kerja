-- Migration 012: Make Position Constraint Deferrable
-- Date: 2025-10-05
-- Description: Fix drag-and-drop by making unique position constraint deferrable

BEGIN;

-- Drop existing constraint
ALTER TABLE kanban_cards
DROP CONSTRAINT unique_column_card_position;

-- Recreate as deferrable constraint
-- DEFERRABLE INITIALLY DEFERRED means constraint is checked at transaction end
ALTER TABLE kanban_cards
ADD CONSTRAINT unique_column_card_position
  UNIQUE (column_id, position)
  DEFERRABLE INITIALLY DEFERRED;

COMMENT ON CONSTRAINT unique_column_card_position ON kanban_cards IS
  'Ensures unique positions within a column (deferrable to allow batch updates)';

COMMIT;
