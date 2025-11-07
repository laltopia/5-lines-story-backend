-- ============================================
-- Row Level Security (RLS) for StoryMaking.AI
-- ============================================
-- Run this in Supabase SQL Editor
-- Purpose: Database-level security (defense-in-depth)
-- Date: November 2025

-- IMPORTANT NOTE:
-- This RLS setup assumes you're using Supabase's service_role key on the backend.
-- Since you're using Clerk for auth (not Supabase Auth), the auth.uid() function
-- won't work. Instead, we'll use a different approach:
--
-- OPTION 1: Disable RLS and rely on backend authorization (current approach)
-- OPTION 2: Create a security definer function that validates Clerk tokens
-- OPTION 3: Use service_role key (bypasses RLS) - CURRENT RECOMMENDED

-- For now, we'll enable RLS but create permissive policies that allow
-- all operations when using service_role key (which bypasses RLS anyway).
-- This provides a foundation for future enhancements.

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create service role bypass policies
-- ============================================
-- These policies allow all operations when using service_role key
-- The backend handles authorization with Clerk tokens

-- Conversations table policies
CREATE POLICY "Service role can do everything on conversations"
  ON conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User limits table policies
CREATE POLICY "Service role can do everything on user_limits"
  ON user_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Usage tracking table policies
CREATE POLICY "Service role can do everything on usage_tracking"
  ON usage_tracking
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Optional: Future user-level policies
-- ============================================
-- Uncomment these if you want to add anon/authenticated role access
-- (Requires integrating Clerk with Supabase Auth or custom JWT claims)

/*
-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
*/

-- ============================================
-- Verify RLS is enabled
-- ============================================
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'user_limits', 'usage_tracking');

-- ============================================
-- View policies
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
