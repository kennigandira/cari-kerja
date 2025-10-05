-- Migration 010: Fix move_card_between_columns Function
-- Date: 2025-10-05
-- Description: Fix unique constraint violation during card moves

BEGIN;

-- Drop and recreate the function with proper position handling
DROP FUNCTION IF EXISTS move_card_between_columns(UUID, UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION move_card_between_columns(
  p_card_id UUID,
  p_from_column_id UUID,
  p_to_column_id UUID,
  p_new_position INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_position INTEGER;
  v_current_column_id UUID;
BEGIN
  -- Get current card data with row lock to prevent race conditions
  SELECT user_id, position, column_id INTO v_user_id, v_current_position, v_current_column_id
  FROM kanban_cards
  WHERE id = p_card_id
  FOR UPDATE;

  -- Security check: Ensure user owns this card
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this card';
  END IF;

  -- Check if card exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  -- Step 1: Move card to temporary position -1 to avoid conflicts
  UPDATE kanban_cards
  SET position = -1,
      updated_at = NOW()
  WHERE id = p_card_id;

  -- Step 2: Shift positions down in source column (fill the gap)
  UPDATE kanban_cards
  SET position = position - 1,
      updated_at = NOW()
  WHERE column_id = p_from_column_id
    AND position > v_current_position
    AND user_id = auth.uid();

  -- Step 3: Make space in destination column (shift positions up)
  UPDATE kanban_cards
  SET position = position + 1,
      updated_at = NOW()
  WHERE column_id = p_to_column_id
    AND position >= p_new_position
    AND user_id = auth.uid();

  -- Step 4: Move the card to final position
  UPDATE kanban_cards
  SET column_id = p_to_column_id,
      position = p_new_position,
      status_updated_at = NOW(),
      updated_at = NOW()
  WHERE id = p_card_id;

  -- Step 5: Log the activity
  INSERT INTO kanban_card_activities (card_id, user_id, activity_type, from_column_id, to_column_id)
  VALUES (p_card_id, auth.uid(), 'card_moved', p_from_column_id, p_to_column_id);

  -- Success
  RETURN;
END;
$$;

COMMENT ON FUNCTION move_card_between_columns IS 'Atomically moves a card from one column to another with position reordering (fixed unique constraint issue)';

COMMIT;
