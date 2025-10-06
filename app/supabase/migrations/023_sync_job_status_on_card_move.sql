-- Migration 023: Sync Job Status When Card Moves Between Columns
-- Date: 2025-10-06
-- Description: Update move_card_between_columns to sync job.status with column name

BEGIN;

-- Drop and recreate the function with job status syncing
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
  v_job_id UUID;
  v_column_name TEXT;
  v_new_job_status TEXT;
BEGIN
  -- Get current card data with row lock to prevent race conditions
  SELECT user_id, position, column_id, job_id INTO v_user_id, v_current_position, v_current_column_id, v_job_id
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

  -- Step 5: Sync job status if card has a linked job
  IF v_job_id IS NOT NULL THEN
    -- Get the destination column name
    SELECT name INTO v_column_name
    FROM kanban_columns
    WHERE id = p_to_column_id;

    -- Map column name to job status
    v_new_job_status := CASE
      WHEN v_column_name ILIKE '%to submit%' THEN 'to_submit'
      WHEN v_column_name ILIKE '%waiting%' THEN 'waiting_for_call'
      WHEN v_column_name ILIKE '%interview%' THEN 'ongoing'
      WHEN v_column_name ILIKE '%offer%' THEN 'success'
      WHEN v_column_name ILIKE '%not now%' THEN 'not_now'
      WHEN v_column_name ILIKE '%rejected%' THEN 'not_now'
      WHEN v_column_name ILIKE '%processing%' THEN 'processing'
      ELSE NULL -- Keep existing status if no match
    END;

    -- Update job status if we found a mapping
    IF v_new_job_status IS NOT NULL THEN
      UPDATE jobs
      SET status = v_new_job_status,
          updated_at = NOW()
      WHERE id = v_job_id;
    END IF;
  END IF;

  -- Step 6: Log the activity
  INSERT INTO kanban_card_activities (card_id, user_id, activity_type, from_column_id, to_column_id)
  VALUES (p_card_id, auth.uid(), 'card_moved', p_from_column_id, p_to_column_id);

  -- Success
  RETURN;
END;
$$;

COMMENT ON FUNCTION move_card_between_columns IS 'Atomically moves a card from one column to another with position reordering and job status syncing';

COMMIT;
