-- ============================================
-- AUDIO & DOCUMENT INPUT SUPPORT
-- StoryMaking.AI Database Migration
-- ============================================
-- This migration adds support for audio and document inputs
-- to the StoryMaking.AI platform.
--
-- Features added:
-- 1. Input type tracking (text, audio, document)
-- 2. Original file metadata storage
-- 3. Indexes for performance
-- 4. Usage tracking enhancements
--
-- HOW TO RUN:
-- 1. Log into Supabase Dashboard (https://app.supabase.com)
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
--
-- SAFE TO RUN MULTIPLE TIMES:
-- Uses IF NOT EXISTS clauses
-- ============================================

-- ============================================
-- 1. ADD INPUT TYPE TRACKING
-- ============================================

-- Add input_type column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS input_type TEXT DEFAULT 'text';

-- Add constraint to ensure valid input types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'conversations_input_type_check'
  ) THEN
    ALTER TABLE conversations
    ADD CONSTRAINT conversations_input_type_check
    CHECK (input_type IN ('text', 'audio', 'document'));
  END IF;
END
$$;

-- ============================================
-- 2. ADD FILE METADATA STORAGE
-- ============================================

-- Add original_file_info for storing file metadata
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS original_file_info JSONB;

-- ============================================
-- 3. CREATE PERFORMANCE INDEXES
-- ============================================

-- Create index for filtering by input type
CREATE INDEX IF NOT EXISTS idx_conversations_input_type
ON conversations(input_type);

-- Create GIN index for file info queries (JSONB)
CREATE INDEX IF NOT EXISTS idx_conversations_file_info
ON conversations USING gin(original_file_info);

-- ============================================
-- 4. ADD METADATA TO USAGE TRACKING
-- ============================================

-- Add metadata column to usage_tracking if not exists
ALTER TABLE usage_tracking
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create GIN index for metadata queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_metadata
ON usage_tracking USING gin(metadata);

-- ============================================
-- 5. ADD DOCUMENTATION COMMENTS
-- ============================================

COMMENT ON COLUMN conversations.input_type IS
'Source of user input:
- text: Typed/pasted text input
- audio: Voice recording (transcribed via Whisper API)
- document: Uploaded file (PDF, DOC, PPT, etc.)';

COMMENT ON COLUMN conversations.original_file_info IS
'JSONB metadata about original file (for audio/document inputs):
{
  "fileName": "example.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "duration": 120,         // for audio only (seconds)
  "extractedLength": 5000  // for documents only (characters)
}';

COMMENT ON COLUMN usage_tracking.metadata IS
'JSONB metadata for tracking usage details:
{
  "file_name": "recording.webm",
  "file_size": 2048000,
  "mime_type": "audio/webm",
  "audio_duration_estimate": 120,  // for audio
  "extracted_length": 5000         // for documents
}';

-- ============================================
-- 6. BACKFILL EXISTING DATA
-- ============================================

-- Set all existing conversations to 'text' type
UPDATE conversations
SET input_type = 'text'
WHERE input_type IS NULL;

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================

-- Verify columns were added successfully
DO $$
DECLARE
  v_input_type_exists BOOLEAN;
  v_file_info_exists BOOLEAN;
  v_metadata_exists BOOLEAN;
BEGIN
  -- Check if input_type column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'input_type'
  ) INTO v_input_type_exists;

  -- Check if original_file_info column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'original_file_info'
  ) INTO v_file_info_exists;

  -- Check if metadata column exists in usage_tracking
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'usage_tracking'
    AND column_name = 'metadata'
  ) INTO v_metadata_exists;

  -- Raise notice with results
  RAISE NOTICE '=== Migration Verification ===';
  RAISE NOTICE 'conversations.input_type: %', CASE WHEN v_input_type_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'conversations.original_file_info: %', CASE WHEN v_file_info_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'usage_tracking.metadata: %', CASE WHEN v_metadata_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
END
$$;

-- Verify constraint was added
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'conversations_input_type_check';

-- Count conversations by input type
SELECT
  COALESCE(input_type, 'null') as input_type,
  COUNT(*) as count
FROM conversations
GROUP BY input_type
ORDER BY count DESC;

-- ============================================
-- 8. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=== Migration Completed Successfully! ===';
  RAISE NOTICE 'Audio and Document support has been added to StoryMaking.AI';
  RAISE NOTICE '';
  RAISE NOTICE 'New features enabled:';
  RAISE NOTICE '  ✓ Input type tracking (text, audio, document)';
  RAISE NOTICE '  ✓ File metadata storage';
  RAISE NOTICE '  ✓ Performance indexes created';
  RAISE NOTICE '  ✓ Usage tracking enhanced';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Deploy backend code with new endpoints';
  RAISE NOTICE '  2. Deploy frontend code with audio/document UI';
  RAISE NOTICE '  3. Test audio transcription flow';
  RAISE NOTICE '  4. Test document extraction flow';
  RAISE NOTICE '  5. Monitor usage and costs';
END
$$;

-- ============================================
-- 9. ROLLBACK INSTRUCTIONS (if needed)
-- ============================================

/*
-- ROLLBACK: Only run if you need to remove the changes
-- WARNING: This will remove the columns and data!

-- Drop indexes
DROP INDEX IF EXISTS idx_conversations_input_type;
DROP INDEX IF EXISTS idx_conversations_file_info;
DROP INDEX IF EXISTS idx_usage_tracking_metadata;

-- Drop constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_input_type_check;

-- Drop columns
ALTER TABLE conversations DROP COLUMN IF EXISTS input_type;
ALTER TABLE conversations DROP COLUMN IF EXISTS original_file_info;
ALTER TABLE usage_tracking DROP COLUMN IF EXISTS metadata;

-- Verify rollback
SELECT 'Rollback completed' AS status;
*/

-- ============================================
-- END OF MIGRATION
-- ============================================
