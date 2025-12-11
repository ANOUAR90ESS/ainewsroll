# Database Migrations

This directory contains SQL migration scripts for the Supabase database.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the contents of the migration file and paste it
6. Click **Run** button

### Option 2: Using Supabase CLI
```bash
supabase db push
```

## Available Migrations

### add_tool_details_columns.sql
Adds the following columns to the `tools` table:
- `how_to_use` (TEXT) - Step-by-step guide on how to use the tool
- `features_detailed` (TEXT) - Detailed breakdown of key features
- `use_cases` (TEXT) - Real-world use case examples
- `pros_cons` (TEXT) - Advantages and disadvantages
- `screenshots_urls` (TEXT[]) - Array of screenshot URLs

**Status**: ⏳ Pending - Apply this migration after deploying the new code

## Migration Order
1. `add_tool_details_columns.sql` - Add detailed fields to tools table
