# Supabase Database Schema Improvements

This document outlines recommended improvements to your Supabase database schema to support the enhanced security and features implemented in the application.

## Current Schema (As Understood from Code)

### Table: `users`
```sql
- id (uuid, primary key)
- name (text)
- email (text)
- created_at (timestamp)
```

### Table: `user_limits`
```sql
- user_id (text, foreign key to Clerk user ID)
- plan_type (text)
- monthly_story_limit (integer)
- tokens_limit_monthly (bigint)
- stories_used_this_month (integer)
- tokens_used_this_month (bigint)
- limit_reset_date (timestamp)
- updated_at (timestamp)
```

### Table: `conversations`
```sql
- id (uuid, primary key)
- user_id (text, foreign key to Clerk user ID)
- user_input (text)
- ai_response (text/json)
- prompt_used (text)
- prompt_type (text)
- tokens_used (integer)
- input_tokens (integer)
- output_tokens (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

### Table: `usage_tracking`
```sql
- id (uuid, primary key)
- user_id (text, foreign key to Clerk user ID)
- conversation_id (uuid, foreign key)
- prompt_type (text)
- tokens_used (integer)
- input_tokens (integer)
- output_tokens (integer)
- cost_usd (decimal)
- created_at (timestamp)
```

---

## Recommended Schema Improvements

### 1. Add Indexes for Performance

```sql
-- Index for user_limits lookups
CREATE INDEX idx_user_limits_user_id ON user_limits(user_id);

-- Indexes for conversations
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_user_created ON conversations(user_id, created_at DESC);

-- Indexes for usage_tracking
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at);
CREATE INDEX idx_usage_tracking_user_created ON usage_tracking(user_id, created_at DESC);
CREATE INDEX idx_usage_tracking_conversation_id ON usage_tracking(conversation_id);
```

### 2. Add Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own data
CREATE POLICY "Users can view own limits"
  ON user_limits FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (user_id = auth.uid()::text);

-- Policy: Users can only delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (user_id = auth.uid()::text);

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access to user_limits"
  ON user_limits FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to conversations"
  ON conversations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to usage_tracking"
  ON usage_tracking FOR ALL
  USING (auth.role() = 'service_role');
```

### 3. Add Constraints for Data Integrity

```sql
-- Add NOT NULL constraints
ALTER TABLE conversations
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_input SET NOT NULL,
  ALTER COLUMN ai_response SET NOT NULL;

ALTER TABLE user_limits
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN plan_type SET NOT NULL;

ALTER TABLE usage_tracking
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN tokens_used SET NOT NULL;

-- Add CHECK constraints
ALTER TABLE user_limits
  ADD CONSTRAINT check_positive_limits CHECK (
    monthly_story_limit >= 0 AND
    tokens_limit_monthly >= 0 AND
    stories_used_this_month >= 0 AND
    tokens_used_this_month >= 0
  );

ALTER TABLE conversations
  ADD CONSTRAINT check_positive_tokens CHECK (
    tokens_used >= 0 AND
    input_tokens >= 0 AND
    output_tokens >= 0
  );

ALTER TABLE usage_tracking
  ADD CONSTRAINT check_positive_tokens_usage CHECK (
    tokens_used >= 0 AND
    input_tokens >= 0 AND
    output_tokens >= 0 AND
    cost_usd >= 0
  );

-- Add length constraints
ALTER TABLE conversations
  ADD CONSTRAINT check_user_input_length CHECK (
    char_length(user_input) BETWEEN 10 AND 5000
  );
```

### 4. Add New Tables for Enhanced Features

#### Table: `story_drafts` (for save draft functionality)
```sql
CREATE TABLE story_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_input text NOT NULL CHECK (char_length(user_input) BETWEEN 10 AND 5000),
  selected_path jsonb,
  custom_description text,
  partial_story jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for draft lookups
CREATE INDEX idx_story_drafts_user_id ON story_drafts(user_id);
CREATE INDEX idx_story_drafts_updated_at ON story_drafts(updated_at DESC);

-- RLS policies
ALTER TABLE story_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own drafts"
  ON story_drafts FOR ALL
  USING (user_id = auth.uid()::text);
```

#### Table: `story_metadata` (for tags, favorites, collections)
```sql
CREATE TABLE story_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id text NOT NULL,
  is_favorite boolean DEFAULT false,
  tags text[],
  collection_name text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id)
    REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT unique_conversation_metadata UNIQUE (conversation_id)
);

-- Index for metadata lookups
CREATE INDEX idx_story_metadata_user_id ON story_metadata(user_id);
CREATE INDEX idx_story_metadata_conversation_id ON story_metadata(conversation_id);
CREATE INDEX idx_story_metadata_tags ON story_metadata USING GIN(tags);
CREATE INDEX idx_story_metadata_favorite ON story_metadata(user_id, is_favorite);

-- RLS policies
ALTER TABLE story_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own story metadata"
  ON story_metadata FOR ALL
  USING (user_id = auth.uid()::text);
```

#### Table: `user_preferences` (for UI/UX settings)
```sql
CREATE TABLE user_preferences (
  user_id text PRIMARY KEY,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'en' CHECK (language IN ('en', 'pt', 'es')),
  onboarding_completed boolean DEFAULT false,
  email_notifications boolean DEFAULT true,
  default_story_genre text,
  default_story_tone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for preference lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid()::text);
```

#### Table: `audit_log` (for security tracking)
```sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  action text NOT NULL CHECK (action IN (
    'story_created', 'story_deleted', 'story_edited',
    'draft_saved', 'draft_deleted',
    'login', 'logout', 'password_changed',
    'settings_updated'
  )),
  resource_type text,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for audit log
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- RLS policies (admin only access)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to audit_log"
  ON audit_log FOR ALL
  USING (auth.role() = 'service_role');
```

### 5. Add Triggers for Automatic Timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_limits_updated_at
  BEFORE UPDATE ON user_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_drafts_updated_at
  BEFORE UPDATE ON story_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_metadata_updated_at
  BEFORE UPDATE ON story_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Add Database Functions for Common Operations

```sql
-- Function to check if user has reached story limit
CREATE OR REPLACE FUNCTION check_user_story_limit(p_user_id text)
RETURNS boolean AS $$
DECLARE
  v_limit integer;
  v_used integer;
BEGIN
  SELECT monthly_story_limit, stories_used_this_month
  INTO v_limit, v_used
  FROM user_limits
  WHERE user_id = p_user_id;

  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's usage summary
CREATE OR REPLACE FUNCTION get_usage_summary(p_user_id text)
RETURNS TABLE(
  total_stories bigint,
  total_tokens bigint,
  total_cost numeric,
  this_month_stories integer,
  this_month_tokens bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT c.id)::bigint as total_stories,
    COALESCE(SUM(c.tokens_used), 0)::bigint as total_tokens,
    COALESCE(SUM(ut.cost_usd), 0)::numeric as total_cost,
    ul.stories_used_this_month,
    ul.tokens_used_this_month
  FROM conversations c
  LEFT JOIN usage_tracking ut ON c.id = ut.conversation_id
  CROSS JOIN user_limits ul
  WHERE c.user_id = p_user_id
    AND ul.user_id = p_user_id
  GROUP BY ul.stories_used_this_month, ul.tokens_used_this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migration Priority

### Phase 1 (Critical - Implement Immediately)
1. Add indexes for performance
2. Enable Row Level Security policies
3. Add NOT NULL constraints

### Phase 2 (High Priority - Within 1 Week)
4. Add CHECK constraints
5. Add triggers for timestamps
6. Create `audit_log` table

### Phase 3 (Medium Priority - Within 2 Weeks)
7. Create `story_drafts` table
8. Create `story_metadata` table
9. Create `user_preferences` table
10. Add database functions

---

## Implementation Notes

1. **Backup First**: Always backup your database before running migrations
2. **Test in Staging**: Test all migrations in a staging environment first
3. **Monitor Performance**: After adding indexes, monitor query performance
4. **Gradual Rollout**: Implement RLS policies gradually to avoid breaking existing functionality
5. **Service Role**: Ensure your backend uses the service_role key to bypass RLS when needed

---

## SQL Migration Scripts

### Script 1: Performance Indexes (Run First)
```sql
-- Save as: 001_add_performance_indexes.sql
BEGIN;

CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON user_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_created ON conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_created ON usage_tracking(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_conversation_id ON usage_tracking(conversation_id);

COMMIT;
```

### Script 2: Data Integrity Constraints
```sql
-- Save as: 002_add_constraints.sql
BEGIN;

-- Add NOT NULL constraints (only if data is clean)
-- ALTER TABLE conversations ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE conversations ALTER COLUMN user_input SET NOT NULL;
-- ALTER TABLE conversations ALTER COLUMN ai_response SET NOT NULL;

-- Add CHECK constraints (PostgreSQL doesn't support IF NOT EXISTS for constraints pre-v12)
-- Drop constraints first if they exist to avoid errors
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_limits') THEN
        ALTER TABLE user_limits DROP CONSTRAINT check_positive_limits;
    END IF;
END $$;

ALTER TABLE user_limits ADD CONSTRAINT check_positive_limits
  CHECK (monthly_story_limit >= 0 AND tokens_limit_monthly >= 0 AND
         stories_used_this_month >= 0 AND tokens_used_this_month >= 0);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_tokens') THEN
        ALTER TABLE conversations DROP CONSTRAINT check_positive_tokens;
    END IF;
END $$;

ALTER TABLE conversations ADD CONSTRAINT check_positive_tokens
  CHECK (tokens_used >= 0 AND input_tokens >= 0 AND output_tokens >= 0);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_tokens_usage') THEN
        ALTER TABLE usage_tracking DROP CONSTRAINT check_positive_tokens_usage;
    END IF;
END $$;

ALTER TABLE usage_tracking ADD CONSTRAINT check_positive_tokens_usage
  CHECK (tokens_used >= 0 AND input_tokens >= 0 AND output_tokens >= 0 AND cost_usd >= 0);

COMMIT;
```

### Script 3: New Tables for Features
```sql
-- Save as: 003_add_new_tables.sql
-- Run this when ready to implement draft and metadata features
BEGIN;

-- Note: We use text for user_id because we're using Clerk (not Supabase Auth)
-- Clerk user IDs are strings like "user_2abc123..."

CREATE TABLE IF NOT EXISTS story_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_input text NOT NULL CHECK (char_length(user_input) BETWEEN 10 AND 5000),
  selected_path jsonb,
  custom_description text,
  partial_story jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_drafts_user_id ON story_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_story_drafts_updated_at ON story_drafts(updated_at DESC);

CREATE TABLE IF NOT EXISTS story_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id text NOT NULL,
  is_favorite boolean DEFAULT false,
  tags text[],
  collection_name text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id)
    REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT unique_conversation_metadata UNIQUE (conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_story_metadata_user_id ON story_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_story_metadata_conversation_id ON story_metadata(conversation_id);
CREATE INDEX IF NOT EXISTS idx_story_metadata_tags ON story_metadata USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_story_metadata_favorite ON story_metadata(user_id, is_favorite);

COMMIT;
```

---

## Supabase Dashboard Instructions

To implement these changes in Supabase:

1. Log in to your Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste each migration script
5. Execute them in order (001, 002, 003)
6. Verify the changes in the Table Editor
7. Test your application thoroughly

---

## Questions or Issues?

If you encounter any issues during migration:
- Check Supabase logs for error details
- Ensure your service_role key is properly configured
- Verify table names match your actual schema
- Test queries in SQL Editor before applying to production
