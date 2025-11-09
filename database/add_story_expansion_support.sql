-- ============================================
-- STORY EXPANSION SUPPORT (5→10→15→20 LINES)
-- StoryMaking.AI Database Migration
-- ============================================
-- This migration adds support for progressive story expansion
-- following the 5-Lines-Story methodology.
--
-- Features added:
-- 1. Story level tracking (5, 10, 15, 20 lines)
-- 2. Parent-child story relationships (lineage)
-- 3. Accumulated metadata from user inputs
-- 4. User inputs history tracking
-- 5. Performance indexes for lineage queries
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
-- 1. ADD STORY LEVEL TRACKING
-- ============================================

-- Add story_level column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS story_level INTEGER DEFAULT 5;

-- Add constraint to ensure valid story levels (5, 10, 15, or 20)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'conversations_story_level_check'
  ) THEN
    ALTER TABLE conversations
    ADD CONSTRAINT conversations_story_level_check
    CHECK (story_level IN (5, 10, 15, 20));
  END IF;
END
$$;

-- ============================================
-- 2. ADD PARENT-CHILD RELATIONSHIPS
-- ============================================

-- Add parent_story_id column for lineage tracking
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS parent_story_id UUID;

-- Add foreign key constraint to link to parent story
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'conversations_parent_story_id_fkey'
  ) THEN
    ALTER TABLE conversations
    ADD CONSTRAINT conversations_parent_story_id_fkey
    FOREIGN KEY (parent_story_id)
    REFERENCES conversations(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

-- ============================================
-- 3. ADD METADATA STORAGE
-- ============================================

-- Add accumulated_metadata for storing extracted context from ALL user inputs
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS accumulated_metadata JSONB DEFAULT '{}'::jsonb;

-- Add user_inputs_history for tracking all user inputs in expansion chain
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS user_inputs_history JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 4. CREATE PERFORMANCE INDEXES
-- ============================================

-- Index for filtering by story level
CREATE INDEX IF NOT EXISTS idx_conversations_story_level
ON conversations(story_level);

-- Index for parent story lookups (lineage queries)
CREATE INDEX IF NOT EXISTS idx_conversations_parent_story
ON conversations(parent_story_id);

-- Composite index for user + story level queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_level
ON conversations(user_id, story_level);

-- Index for lineage traversal (parent + level)
CREATE INDEX IF NOT EXISTS idx_conversations_lineage
ON conversations(parent_story_id, story_level);

-- GIN index for accumulated_metadata queries (JSONB)
CREATE INDEX IF NOT EXISTS idx_conversations_accumulated_metadata
ON conversations USING gin(accumulated_metadata);

-- GIN index for user_inputs_history queries (JSONB)
CREATE INDEX IF NOT EXISTS idx_conversations_user_inputs_history
ON conversations USING gin(user_inputs_history);

-- ============================================
-- 5. ADD DOCUMENTATION COMMENTS
-- ============================================

COMMENT ON COLUMN conversations.story_level IS
'Story length level following 5-Lines-Story methodology:
- 5: Original 5-line story (1-1-1-1-1)
- 10: First expansion with 3-2-3-2-1 distribution
- 15: Second expansion with 3-3-5-2-2 distribution
- 20: Maximum expansion with 4-4-7-3-2 distribution';

COMMENT ON COLUMN conversations.parent_story_id IS
'UUID of the parent story this was expanded from.
NULL for original 5-line stories.
Forms a lineage chain: 5-line → 10-line → 15-line → 20-line';

COMMENT ON COLUMN conversations.accumulated_metadata IS
'Metadata extracted from ALL user inputs (not AI outputs).
Includes characters, settings, facts, themes extracted progressively.
Example:
{
  "characters": [
    {"name": "João", "role": "protagonist", "traits": ["determined"], "sourceInput": "initial"}
  ],
  "settings": [
    {"location": "São Paulo", "timeframe": "6 months", "sourceInput": "initial"}
  ],
  "keyFacts": ["Making videos since childhood", "Struggled for 3 years"],
  "emotionalThemes": ["self-doubt", "creative authenticity"],
  "tone": "inspirational",
  "language": "pt"
}';

COMMENT ON COLUMN conversations.user_inputs_history IS
'Array of all user inputs in the expansion chain.
Each entry tracks: input text, level, metadata extracted, timestamp.
Example:
[
  {
    "inputNumber": 1,
    "storyLevel": 5,
    "rawInput": "I am a filmmaker...",
    "inputType": "text",
    "extractedMetadata": {...},
    "timestamp": "2025-01-15T10:30:00Z"
  },
  {
    "inputNumber": 2,
    "storyLevel": 10,
    "rawInput": "Add more about childhood...",
    "inputType": "audio",
    "extractedMetadata": {...},
    "timestamp": "2025-01-16T14:20:00Z"
  }
]';

-- ============================================
-- 6. BACKFILL EXISTING DATA
-- ============================================

-- Set all existing conversations to story_level = 5 (original stories)
UPDATE conversations
SET story_level = 5
WHERE story_level IS NULL;

-- Initialize empty metadata for existing stories
UPDATE conversations
SET accumulated_metadata = '{}'::jsonb
WHERE accumulated_metadata IS NULL;

-- Initialize empty user inputs history for existing stories
UPDATE conversations
SET user_inputs_history = '[]'::jsonb
WHERE user_inputs_history IS NULL;

-- ============================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get complete story lineage (from root to current)
CREATE OR REPLACE FUNCTION get_story_lineage(story_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  story_level INTEGER,
  parent_id UUID,
  user_input TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  depth INTEGER
) AS $$
WITH RECURSIVE lineage AS (
  -- Start with the requested story
  SELECT
    c.id AS conversation_id,
    c.story_level,
    c.parent_story_id AS parent_id,
    c.user_input,
    c.created_at,
    0 AS depth
  FROM conversations c
  WHERE c.id = story_id

  UNION ALL

  -- Recursively get parent stories
  SELECT
    c.id AS conversation_id,
    c.story_level,
    c.parent_story_id AS parent_id,
    c.user_input,
    c.created_at,
    l.depth + 1 AS depth
  FROM conversations c
  INNER JOIN lineage l ON c.id = l.parent_id
)
SELECT * FROM lineage
ORDER BY depth DESC; -- Root first (5-line), then expansions
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_story_lineage(UUID) IS
'Returns complete story lineage from root (5-line) to current level.
Usage: SELECT * FROM get_story_lineage(''uuid-here'');';

-- Function to get all child expansions of a story
CREATE OR REPLACE FUNCTION get_story_children(story_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  story_level INTEGER,
  user_input TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
SELECT
  id AS conversation_id,
  story_level,
  user_input,
  created_at
FROM conversations
WHERE parent_story_id = story_id
ORDER BY story_level ASC;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_story_children(UUID) IS
'Returns all direct child expansions of a story.
Usage: SELECT * FROM get_story_children(''uuid-here'');';

-- Function to check if story can be expanded
CREATE OR REPLACE FUNCTION can_expand_story(story_id UUID)
RETURNS TABLE (
  can_expand BOOLEAN,
  current_level INTEGER,
  next_level INTEGER,
  reason TEXT
) AS $$
SELECT
  CASE
    WHEN c.story_level = 20 THEN FALSE
    WHEN EXISTS (
      SELECT 1 FROM conversations
      WHERE parent_story_id = story_id
      AND story_level = c.story_level + 5
    ) THEN FALSE
    ELSE TRUE
  END AS can_expand,
  c.story_level AS current_level,
  CASE
    WHEN c.story_level < 20 THEN c.story_level + 5
    ELSE NULL
  END AS next_level,
  CASE
    WHEN c.story_level = 20 THEN 'Story is at maximum depth (20 lines)'
    WHEN EXISTS (
      SELECT 1 FROM conversations
      WHERE parent_story_id = story_id
      AND story_level = c.story_level + 5
    ) THEN 'Story already has an expansion at next level'
    ELSE 'Story can be expanded'
  END AS reason
FROM conversations c
WHERE c.id = story_id;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION can_expand_story(UUID) IS
'Checks if a story can be expanded and returns next level info.
Usage: SELECT * FROM can_expand_story(''uuid-here'');';

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================

-- Verify columns were added successfully
DO $$
DECLARE
  v_story_level_exists BOOLEAN;
  v_parent_story_id_exists BOOLEAN;
  v_accumulated_metadata_exists BOOLEAN;
  v_user_inputs_history_exists BOOLEAN;
BEGIN
  -- Check if story_level column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'story_level'
  ) INTO v_story_level_exists;

  -- Check if parent_story_id column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'parent_story_id'
  ) INTO v_parent_story_id_exists;

  -- Check if accumulated_metadata column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'accumulated_metadata'
  ) INTO v_accumulated_metadata_exists;

  -- Check if user_inputs_history column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'user_inputs_history'
  ) INTO v_user_inputs_history_exists;

  -- Raise notice with results
  RAISE NOTICE '=== Migration Verification ===';
  RAISE NOTICE 'conversations.story_level: %', CASE WHEN v_story_level_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'conversations.parent_story_id: %', CASE WHEN v_parent_story_id_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'conversations.accumulated_metadata: %', CASE WHEN v_accumulated_metadata_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'conversations.user_inputs_history: %', CASE WHEN v_user_inputs_history_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
END
$$;

-- Verify constraints were added
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name IN ('conversations_story_level_check');

-- Verify foreign key constraint
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name = 'conversations_parent_story_id_fkey';

-- Count conversations by story level
SELECT
  story_level,
  COUNT(*) as count
FROM conversations
GROUP BY story_level
ORDER BY story_level ASC;

-- Check for any stories with parent relationships
SELECT
  'Total stories with parents' AS description,
  COUNT(*) as count
FROM conversations
WHERE parent_story_id IS NOT NULL;

-- ============================================
-- 9. TEST HELPER FUNCTIONS
-- ============================================

-- Test get_story_lineage function
DO $$
DECLARE
  v_test_id UUID;
BEGIN
  -- Get a sample story ID for testing (if any exist)
  SELECT id INTO v_test_id
  FROM conversations
  LIMIT 1;

  IF v_test_id IS NOT NULL THEN
    RAISE NOTICE '=== Testing get_story_lineage() ===';
    RAISE NOTICE 'Test story ID: %', v_test_id;
    -- Function is ready to use when stories have lineage
  ELSE
    RAISE NOTICE 'No stories found to test lineage function';
  END IF;
END
$$;

-- ============================================
-- 10. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=== Migration Completed Successfully! ===';
  RAISE NOTICE 'Story Expansion Support has been added to StoryMaking.AI';
  RAISE NOTICE '';
  RAISE NOTICE 'New features enabled:';
  RAISE NOTICE '  ✓ Story level tracking (5, 10, 15, 20 lines)';
  RAISE NOTICE '  ✓ Parent-child relationships (lineage)';
  RAISE NOTICE '  ✓ Metadata accumulation from user inputs';
  RAISE NOTICE '  ✓ User inputs history tracking';
  RAISE NOTICE '  ✓ Performance indexes created';
  RAISE NOTICE '  ✓ Helper functions for lineage queries';
  RAISE NOTICE '';
  RAISE NOTICE 'Expansion path: 5 → 10 → 15 → 20 lines';
  RAISE NOTICE 'Methodology: Zoom into 5 core beats (not adding new beats)';
  RAISE NOTICE '';
  RAISE NOTICE 'Distribution formulas:';
  RAISE NOTICE '  • 10 lines: 3-2-3-2-1 (Situation-Desire-Conflict-Change-Result)';
  RAISE NOTICE '  • 15 lines: 3-3-5-2-2';
  RAISE NOTICE '  • 20 lines: 4-4-7-3-2';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper functions created:';
  RAISE NOTICE '  • get_story_lineage(uuid) - Get full expansion chain';
  RAISE NOTICE '  • get_story_children(uuid) - Get direct child expansions';
  RAISE NOTICE '  • can_expand_story(uuid) - Check expansion eligibility';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Deploy backend with expansion endpoints';
  RAISE NOTICE '  2. Deploy frontend with expansion UI';
  RAISE NOTICE '  3. Test 5→10→15→20 expansion flow';
  RAISE NOTICE '  4. Monitor metadata extraction accuracy';
  RAISE NOTICE '  5. Validate compression test results';
END
$$;

-- ============================================
-- 11. ROLLBACK INSTRUCTIONS (if needed)
-- ============================================

/*
-- ROLLBACK: Only run if you need to remove the changes
-- WARNING: This will remove the columns and data!

-- Drop helper functions
DROP FUNCTION IF EXISTS get_story_lineage(UUID);
DROP FUNCTION IF EXISTS get_story_children(UUID);
DROP FUNCTION IF EXISTS can_expand_story(UUID);

-- Drop indexes
DROP INDEX IF EXISTS idx_conversations_story_level;
DROP INDEX IF EXISTS idx_conversations_parent_story;
DROP INDEX IF EXISTS idx_conversations_user_level;
DROP INDEX IF EXISTS idx_conversations_lineage;
DROP INDEX IF EXISTS idx_conversations_accumulated_metadata;
DROP INDEX IF EXISTS idx_conversations_user_inputs_history;

-- Drop foreign key constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_parent_story_id_fkey;

-- Drop check constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_story_level_check;

-- Drop columns
ALTER TABLE conversations DROP COLUMN IF EXISTS story_level;
ALTER TABLE conversations DROP COLUMN IF EXISTS parent_story_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS accumulated_metadata;
ALTER TABLE conversations DROP COLUMN IF EXISTS user_inputs_history;

-- Verify rollback
SELECT 'Rollback completed' AS status;
*/

-- ============================================
-- END OF MIGRATION
-- ============================================
