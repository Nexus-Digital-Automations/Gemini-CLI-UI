-- Migration: Add model column to sessions table
-- Date: 2026-02-12

-- Add model column with default value
ALTER TABLE sessions ADD COLUMN model TEXT NOT NULL DEFAULT 'gemini-2.5-flash';

-- Add index for better query performance on model field
CREATE INDEX IF NOT EXISTS idx_sessions_model ON sessions(model);
