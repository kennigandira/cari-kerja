-- Migration 024: Fix Existing Job Statuses to Match Card Columns
-- Date: 2025-10-06
-- Description: One-time data fix to sync existing job.status with card.column positions

BEGIN;

-- Update all jobs to match their card's current column
UPDATE jobs j
SET status = CASE
  WHEN kc.name ILIKE '%to submit%' THEN 'to_submit'
  WHEN kc.name ILIKE '%waiting%' THEN 'waiting_for_call'
  WHEN kc.name ILIKE '%interview%' THEN 'ongoing'
  WHEN kc.name ILIKE '%offer%' THEN 'success'
  WHEN kc.name ILIKE '%not now%' THEN 'not_now'
  WHEN kc.name ILIKE '%rejected%' THEN 'not_now'
  WHEN kc.name ILIKE '%processing%' THEN 'processing'
  ELSE j.status -- Keep existing status if no match
END,
updated_at = NOW()
FROM kanban_cards cards
INNER JOIN kanban_columns kc ON kc.id = cards.column_id
WHERE j.id = cards.job_id
  AND cards.job_id IS NOT NULL
  AND j.status != CASE
    WHEN kc.name ILIKE '%to submit%' THEN 'to_submit'
    WHEN kc.name ILIKE '%waiting%' THEN 'waiting_for_call'
    WHEN kc.name ILIKE '%interview%' THEN 'ongoing'
    WHEN kc.name ILIKE '%offer%' THEN 'success'
    WHEN kc.name ILIKE '%not now%' THEN 'not_now'
    WHEN kc.name ILIKE '%rejected%' THEN 'not_now'
    WHEN kc.name ILIKE '%processing%' THEN 'processing'
    ELSE j.status
  END; -- Only update if status is different

COMMIT;
