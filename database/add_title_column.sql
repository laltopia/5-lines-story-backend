-- ============================================
-- ADD TITLE COLUMN TO CONVERSATIONS TABLE
-- ============================================
-- This migration adds a title column to store story titles
-- Run this in your Supabase SQL Editor or via migration tool

-- Add title column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add comment to document the column
COMMENT ON COLUMN conversations.title IS 'Story title extracted from path, custom description, or user input';

-- Create an index for faster title searches (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_conversations_title ON conversations(title);

-- Update existing records to have a title (optional - generates from first line)
-- Uncomment the line below if you want to backfill titles for existing stories
-- UPDATE conversations
-- SET title = LEFT(user_input, 100)
-- WHERE title IS NULL;
