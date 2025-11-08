-- ============================================
-- FIX USER INPUT LENGTH CONSTRAINT
-- StoryMaking.AI Database Migration
-- ============================================
-- This migration removes the old user_input length constraint
-- and replaces it with a new one that supports documents (50k chars)
--
-- PROBLEM:
-- The old constraint limited user_input to 5,000 characters,
-- but document uploads can be up to 50,000 characters.
--
-- SOLUTION:
-- Drop the old constraint and create a new one with 50k limit.
--
-- HOW TO RUN:
-- 1. Log into Supabase Dashboard (https://app.supabase.com)
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
--
-- SAFE TO RUN MULTIPLE TIMES
-- ============================================

-- ============================================
-- 1. DROP OLD CONSTRAINT
-- ============================================

-- Drop the old user_input length constraint if it exists
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS check_user_input_length;

-- ============================================
-- 2. CREATE NEW CONSTRAINT
-- ============================================

-- Add new constraint with 50,000 character limit
ALTER TABLE conversations
ADD CONSTRAINT check_user_input_length
CHECK (LENGTH(user_input) <= 50000);

-- ============================================
-- 3. VERIFICATION
-- ============================================

-- Verify the new constraint exists
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'check_user_input_length'
AND table_name = 'conversations';

-- Show current max length in conversations table
SELECT
  MAX(LENGTH(user_input)) as current_max_length,
  50000 as new_limit,
  CASE
    WHEN MAX(LENGTH(user_input)) <= 50000 THEN '✓ All records within new limit'
    ELSE '✗ Some records exceed new limit'
  END as status
FROM conversations;

-- ============================================
-- 4. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=== Constraint Update Completed Successfully! ===';
  RAISE NOTICE 'user_input length limit increased from 5,000 to 50,000 characters';
  RAISE NOTICE '';
  RAISE NOTICE 'This change enables:';
  RAISE NOTICE '  ✓ Document uploads (up to 50k characters)';
  RAISE NOTICE '  ✓ Long-form text inputs';
  RAISE NOTICE '  ✓ Audio transcriptions (longer recordings)';
  RAISE NOTICE '';
  RAISE NOTICE 'The API and frontend are already configured for this limit.';
END
$$;

-- ============================================
-- END OF MIGRATION
-- ============================================
