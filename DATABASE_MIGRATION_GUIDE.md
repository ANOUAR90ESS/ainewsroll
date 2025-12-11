# How to Fix "features_detailed" Column Error

You're seeing this error because the code now supports detailed tool information (how-to guides, features, use cases, pros/cons), but the Supabase database hasn't been updated yet with the necessary columns.

## ✅ Quick Fix Steps

### Step 1: Apply the Database Migration

1. Open your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of this file:
   ```
   migrations/add_tool_details_columns.sql
   ```
6. Paste it into the SQL editor
7. Click the **Run** button (or press Ctrl+Enter)
8. Wait for the query to complete (you should see a success message)

### Step 2: Clear the Schema Cache

The error mentions "schema cache" - Supabase may have cached the old schema. After running the migration:

1. In Supabase dashboard, go to **SQL Editor**
2. Run this command:
   ```sql
   SELECT pg_catalog.pg_sleep(2);
   ```
3. Or simply wait 30 seconds for the cache to refresh automatically

### Step 3: Deploy the Latest Code

Make sure you're running the latest version with the database mapper fixes:
- Rebuild: `npm run build`
- Deploy to Vercel (if using CI/CD, this happens automatically)

## 🎯 What the Migration Does

The migration adds these columns to the `tools` table:

| Column | Type | Purpose |
|--------|------|---------|
| `how_to_use` | TEXT | Step-by-step usage guide |
| `features_detailed` | TEXT | Detailed feature breakdown |
| `use_cases` | TEXT | Real-world use case examples |
| `pros_cons` | TEXT | Advantages and disadvantages |
| `screenshots_urls` | TEXT[] | Array of screenshot URLs |

All columns are **optional** (nullable) and default to empty values.

## 🧪 Verify the Fix

After applying the migration:

1. Go back to the admin dashboard
2. Try creating or editing a tool
3. The detailed fields should now save without errors
4. Check that the ToolDetail page shows the new information

## ❌ Still Getting the Error?

If you still see the error after running the migration:

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
2. **Check the migration ran**: In Supabase SQL Editor, run:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'tools' AND column_name LIKE '%detailed%';
   ```
   You should see `features_detailed` in the results.

3. **Verify column names**: The columns must be exactly named as shown above (snake_case)

4. **Check Row Level Security**: Make sure your RLS policies allow INSERT/UPDATE on these new columns

## 📝 For Production Deployments

If deploying to production with many users:

1. Run the migration during low-traffic hours
2. The migration is safe - it only adds columns, doesn't drop any data
3. New columns default to NULL, so existing tools won't be affected
4. Deploy the code update immediately after the migration

## 🔧 Troubleshooting

**Error: "Column does not exist"**
- The migration hasn't been applied yet. Follow Step 1 above.

**Error: "Permission denied"**
- You don't have superuser access to the database. Contact your Supabase project owner.

**Error: "Column already exists"**
- The migration has already been applied. This is good! You can ignore the error.

Need more help? Check the [Supabase documentation](https://supabase.com/docs) or contact support.
