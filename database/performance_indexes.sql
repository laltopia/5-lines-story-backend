-- ============================================
-- Performance Indexes for StoryMaking.AI
-- ============================================
-- Run this in Supabase SQL Editor
-- Purpose: Optimize query performance as data grows
-- Date: November 2025

-- User limits optimization
CREATE INDEX IF NOT EXISTS idx_user_limits_user_id
  ON user_limits(user_id);

CREATE INDEX IF NOT EXISTS idx_user_limits_plan_type
  ON user_limits(plan_type);

-- Conversations optimization (most critical)
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
  ON conversations(user_id);

-- History page optimization (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_conversations_created_at
  ON conversations(created_at DESC);

-- Combined index for user + created_at (most efficient for history queries)
CREATE INDEX IF NOT EXISTS idx_conversations_user_created
  ON conversations(user_id, created_at DESC);

-- Title search optimization (if implementing search later)
CREATE INDEX IF NOT EXISTS idx_conversations_title
  ON conversations(title);

-- Usage tracking optimization
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id
  ON usage_tracking(user_id);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at
  ON usage_tracking(created_at);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_conversation_id
  ON usage_tracking(conversation_id);

-- Verify indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'user_limits', 'usage_tracking')
ORDER BY tablename, indexname;
