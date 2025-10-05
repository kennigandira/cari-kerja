-- Migration 007: Kanban Job Application Tracker Database Structure
-- Created: 2025-10-05
-- Purpose: Create tables, RPC functions, RLS policies, and indexes for Kanban board feature
-- Related: DatabaseSchema.md, TD004_Kanban_Architecture.md

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. kanban_columns: Workflow stages/columns in the Kanban board
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  color TEXT DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure each user has unique column positions (no gaps/duplicates)
  CONSTRAINT unique_user_column_position UNIQUE (user_id, position),

  -- Ensure each user has unique column names (prevent confusion)
  CONSTRAINT unique_user_column_name UNIQUE (user_id, name),

  -- Validate hex color format (#RRGGBB)
  CONSTRAINT valid_hex_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- 2. kanban_cards: Job application cards within columns
CREATE TABLE kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID REFERENCES kanban_columns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  application_date DATE,
  application_folder_path TEXT,
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure each column has unique card positions (no gaps/duplicates)
  CONSTRAINT unique_column_card_position UNIQUE (column_id, position)
);

-- 3. kanban_card_activities: Audit log for card movements and changes
CREATE TABLE kanban_card_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (
    activity_type IN ('card_created', 'card_moved', 'card_archived', 'card_restored', 'field_updated')
  ),
  from_column_id UUID REFERENCES kanban_columns(id),
  to_column_id UUID REFERENCES kanban_columns(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RPC FUNCTIONS (Critical for Frontend Drag-and-Drop)
-- ============================================================================

-- 1. move_card_between_columns: Atomic operation to move a card from one column to another
-- This handles position reordering in both source and destination columns
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
BEGIN
  -- Get current card data with row lock to prevent race conditions
  SELECT user_id, position INTO v_user_id, v_current_position
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

  -- Step 1: Remove card from source column (shift positions down to fill the gap)
  UPDATE kanban_cards
  SET position = position - 1,
      updated_at = NOW()
  WHERE column_id = p_from_column_id
    AND position > v_current_position
    AND user_id = auth.uid();

  -- Step 2: Make space in destination column (shift positions up)
  UPDATE kanban_cards
  SET position = position + 1,
      updated_at = NOW()
  WHERE column_id = p_to_column_id
    AND position >= p_new_position
    AND user_id = auth.uid();

  -- Step 3: Move the card to new column and position
  UPDATE kanban_cards
  SET column_id = p_to_column_id,
      position = p_new_position,
      status_updated_at = NOW(),
      updated_at = NOW()
  WHERE id = p_card_id;

  -- Step 4: Log the activity
  INSERT INTO kanban_card_activities (card_id, user_id, activity_type, from_column_id, to_column_id)
  VALUES (p_card_id, auth.uid(), 'card_moved', p_from_column_id, p_to_column_id);

  -- Success
  RETURN;
END;
$$;

-- 2. reorder_cards_in_column: Batch update card positions within the same column
-- This is optimized for drag-and-drop reordering within a column
CREATE OR REPLACE FUNCTION reorder_cards_in_column(
  p_column_id UUID,
  p_card_positions JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  card_data RECORD;
BEGIN
  -- Validate that user owns the column
  IF NOT EXISTS (
    SELECT 1 FROM kanban_columns
    WHERE id = p_column_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this column';
  END IF;

  -- Update each card's position
  FOR card_data IN
    SELECT * FROM jsonb_to_recordset(p_card_positions) AS (id UUID, position INTEGER)
  LOOP
    UPDATE kanban_cards
    SET position = card_data.position,
        updated_at = NOW()
    WHERE id = card_data.id
      AND user_id = auth.uid()
      AND column_id = p_column_id;
  END LOOP;

  -- Success
  RETURN;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_card_activities ENABLE ROW LEVEL SECURITY;

-- kanban_columns policies
CREATE POLICY "Users can view own columns"
  ON kanban_columns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own columns"
  ON kanban_columns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own columns"
  ON kanban_columns
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own columns"
  ON kanban_columns
  FOR DELETE
  USING (auth.uid() = user_id);

-- kanban_cards policies
CREATE POLICY "Users can view own cards"
  ON kanban_cards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON kanban_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON kanban_cards
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON kanban_cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- kanban_card_activities policies (read-only for users, insert via triggers/functions)
CREATE POLICY "Users can view own activities"
  ON kanban_card_activities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert activities"
  ON kanban_card_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- INDEXES (Performance Optimization)
-- ============================================================================

-- Indexes for kanban_cards (most frequently queried)
CREATE INDEX idx_kanban_cards_column_id ON kanban_cards(column_id);
CREATE INDEX idx_kanban_cards_user_id ON kanban_cards(user_id);
CREATE INDEX idx_kanban_cards_position ON kanban_cards(column_id, position);

-- Indexes for kanban_card_activities (for activity feed queries)
CREATE INDEX idx_kanban_card_activities_card_id ON kanban_card_activities(card_id);
CREATE INDEX idx_kanban_card_activities_user_id ON kanban_card_activities(user_id);
CREATE INDEX idx_kanban_card_activities_created_at ON kanban_card_activities(created_at DESC);

-- Indexes for kanban_columns
CREATE INDEX idx_kanban_columns_user_id ON kanban_columns(user_id);
CREATE INDEX idx_kanban_columns_position ON kanban_columns(user_id, position);

-- ============================================================================
-- TRIGGERS (Auto-update Timestamps)
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply trigger to kanban_columns
CREATE TRIGGER update_kanban_columns_updated_at
  BEFORE UPDATE ON kanban_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to kanban_cards
CREATE TRIGGER update_kanban_cards_updated_at
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (7 Default Columns)
-- ============================================================================

-- Note: This INSERT will only work when there's an authenticated user
-- For initial setup, this should be run after user creation
-- The seed data will be inserted via a separate migration or app initialization

-- Insert default columns for authenticated user
-- This uses a DO block to handle the case where no user is authenticated during migration
DO $$
BEGIN
  -- Only insert if there are authenticated users and they don't have columns yet
  -- This prevents errors during initial migration but allows seeding on first user login
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    -- Insert for each user that doesn't have columns yet
    INSERT INTO kanban_columns (user_id, name, position, color, is_default)
    SELECT
      u.id,
      defaults.name,
      defaults.position,
      defaults.color,
      true
    FROM
      auth.users u
    CROSS JOIN (VALUES
      ('Interested', 1, '#9333EA'),     -- purple (exploration phase)
      ('Applied', 2, '#3B82F6'),        -- blue (application submitted)
      ('Interviewing', 3, '#F59E0B'),   -- yellow (active interview process)
      ('Offer', 4, '#10B981'),          -- green (offer received)
      ('Rejected', 5, '#EF4444'),       -- red (application declined)
      ('Accepted', 6, '#059669'),       -- emerald (offer accepted)
      ('Withdrawn', 7, '#6B7280')       -- gray (application withdrawn)
    ) AS defaults(name, position, color)
    WHERE NOT EXISTS (
      SELECT 1 FROM kanban_columns WHERE user_id = u.id
    );
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTION (For Application Code to Initialize User Columns)
-- ============================================================================

-- This function should be called after user signup to ensure they have default columns
CREATE OR REPLACE FUNCTION initialize_user_kanban_columns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already has columns
  IF EXISTS (SELECT 1 FROM kanban_columns WHERE user_id = auth.uid()) THEN
    RETURN; -- User already has columns, nothing to do
  END IF;

  -- Insert default columns for current user
  INSERT INTO kanban_columns (user_id, name, position, color, is_default)
  VALUES
    (auth.uid(), 'Interested', 1, '#9333EA', true),
    (auth.uid(), 'Applied', 2, '#3B82F6', true),
    (auth.uid(), 'Interviewing', 3, '#F59E0B', true),
    (auth.uid(), 'Offer', 4, '#10B981', true),
    (auth.uid(), 'Rejected', 5, '#EF4444', true),
    (auth.uid(), 'Accepted', 6, '#059669', true),
    (auth.uid(), 'Withdrawn', 7, '#6B7280', true);
END;
$$;

-- ============================================================================
-- COMMENTS (Documentation for Future Developers)
-- ============================================================================

COMMENT ON TABLE kanban_columns IS 'User-defined workflow stages for job applications';
COMMENT ON TABLE kanban_cards IS 'Individual job application cards with company and position details';
COMMENT ON TABLE kanban_card_activities IS 'Audit log for card movements and changes';

COMMENT ON FUNCTION move_card_between_columns IS 'Atomically moves a card from one column to another with position reordering';
COMMENT ON FUNCTION reorder_cards_in_column IS 'Batch updates card positions within the same column';
COMMENT ON FUNCTION initialize_user_kanban_columns IS 'Creates default columns for a new user (call after signup)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
