-- Migration 009: Add job_id to kanban_cards
-- Date: 2025-10-05
-- Description: Link kanban_cards to jobs table to display job application data

BEGIN;

-- Add job_id column to kanban_cards (nullable for backward compatibility)
ALTER TABLE kanban_cards
ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE CASCADE;

-- Add index for job lookups
CREATE INDEX idx_kanban_cards_job_id ON kanban_cards(job_id);

-- Add comment for documentation
COMMENT ON COLUMN kanban_cards.job_id IS 'Optional link to jobs table for job application tracking';

COMMIT;
