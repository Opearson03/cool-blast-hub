-- Add 'pending' status to estimate_status enum
ALTER TYPE estimate_status ADD VALUE 'pending' AFTER 'draft';