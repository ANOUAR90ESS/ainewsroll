# Supabase Database Schema Setup

## Overview
This document explains the database schema required for the AI News-Roll application.

## Required Tables

### 1. `tools` Table
Stores information about AI tools and services.

**Columns:**
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key (auto-generated) |
| `name` | TEXT | Yes | Tool name |
| `description` | TEXT | No | Short description |
| `category` | TEXT | No | Category (e.g., "Image Generation", "Chat") |
| `tags` | TEXT[] | No | Array of tags |
| `price` | TEXT | No | Pricing info (free, paid, etc.) |
| `image_url` | TEXT | No | Image URL |
| `website` | TEXT | No | Website URL |
| `created_at` | TIMESTAMP | Auto | Creation timestamp |
| `updated_at` | TIMESTAMP | Auto | Last update timestamp |

### 2. `news` Table
Stores news articles and content.

**Columns:**
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key (auto-generated) |
| `title` | TEXT | Yes | Article title |
| `description` | TEXT | No | Short description |
| `content` | TEXT | No | Full article content |
| `category` | TEXT | No | Category (e.g., "AI", "Tech") |
| `image_url` | TEXT | No | Featured image URL |
| `source` | TEXT | No | Source of the article |
| `date` | TIMESTAMP | Auto | Publication date |
| `created_at` | TIMESTAMP | Auto | Creation timestamp |
| `updated_at` | TIMESTAMP | Auto | Last update timestamp |

### 3. `user_profiles` Table (Optional but Recommended)
Stores user profile information and roles.

**Columns:**
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | References auth.users(id) |
| `email` | TEXT | No | User email |
| `role` | TEXT | No | 'user' or 'admin' |
| `created_at` | TIMESTAMP | Auto | Creation timestamp |
| `updated_at` | TIMESTAMP | Auto | Last update timestamp |

## Setup Steps

### Step 1: Create the Schema
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Click **SQL Editor** in the left sidebar
4. Create a new query
5. Copy and paste the entire contents of `SUPABASE_SCHEMA.sql`
6. Click **Run** to execute

### Step 2: Enable Realtime (Important!)
1. Go to **Database** → **Tables**
2. Select the `tools` table
3. Click **Realtime** in the right panel
4. Enable the **INSERT**, **UPDATE**, **DELETE** events
5. Repeat for the `news` table

### Step 3: Test the Schema
1. In Supabase SQL Editor, insert test data:

```sql
-- Insert a test tool
INSERT INTO tools (name, description, category, price, website)
VALUES (
  'ChatGPT',
  'Advanced AI assistant by OpenAI',
  'Chat',
  'Free/Paid',
  'https://openai.com'
);

-- Insert a test article
INSERT INTO news (title, description, category, source)
VALUES (
  'New AI Breakthrough',
  'Scientists announce major AI advancement',
  'AI',
  'TechNews'
);
```

2. In your app, you should see the data appear automatically (via Realtime subscriptions)

## Environment Variables

Make sure your `.env.local` has:

```
VITE_SUPABASE_URL=https://upfjytumummgbnzykijj.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Row Level Security (RLS)

The schema includes RLS policies:
- **Public read access**: Anyone can read `tools` and `news`
- **Authenticated write access**: Only logged-in users can add/edit/delete

To allow completely public access (read AND write):
1. Disable RLS on the tables, OR
2. Modify the INSERT/UPDATE/DELETE policies to use `USING (true)`

## Troubleshooting

### Data not showing in app?
1. Check browser console (`F12` → Console tab)
2. Look for error messages about RLS or table access
3. Verify the table names are exactly: `tools`, `news`
4. Ensure Realtime is enabled on both tables

### Images not generating?
1. The `image_url` column must exist in both tables
2. In code, we map `image_url` (snake_case) ↔ `imageUrl` (camelCase)

### Can't insert/update data?
1. Make sure you're authenticated (logged in)
2. Check RLS policies allow authenticated users
3. Verify all required columns are being populated

## Field Mappings (Database vs App)

The app uses camelCase but Supabase uses snake_case. These are mapped automatically:

| Database | App |
|----------|-----|
| `image_url` | `imageUrl` |
| `created_at` | `created_at` |
| `updated_at` | `updated_at` |

See `dbService.ts` for the mapping functions.
