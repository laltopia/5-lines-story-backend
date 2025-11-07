# Database Migrations

This folder contains SQL migration files for updating your Supabase database schema.

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Log into your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"New Query"**
5. Copy and paste the SQL from the migration file
6. Click **"Run"** to execute

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

---

## Current Migrations

### `add_title_column.sql` - Add Story Title Support

**Status:** ⚠️ REQUIRED for title editing feature

**What it does:**
- Adds a `title` column to the `conversations` table
- Creates an index for faster title searches
- Optionally backfills titles for existing stories

**Why you need this:**
The app now supports story titles, but the database schema needs to be updated to store them.

**When to run:**
- If you get the error: "Database schema outdated. Please add title column..."
- If title editing doesn't work
- Before deploying the latest version

**How to run:**
1. Open Supabase SQL Editor
2. Copy contents of `add_title_column.sql`
3. Paste and run
4. Verify by checking the `conversations` table structure

---

## Troubleshooting

**Error: "column 'title' does not exist"**
- Solution: Run the `add_title_column.sql` migration

**Error: "permission denied"**
- Solution: Make sure you're logged in as a project admin in Supabase

**Migration already applied:**
- The SQL uses `IF NOT EXISTS` so it's safe to run multiple times

---

## Need Help?

Check your backend logs for detailed error messages:
- Development: Console will show full error details
- Check Supabase logs in Dashboard → Database → Logs
