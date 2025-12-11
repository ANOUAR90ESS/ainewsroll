# Generate Unique Tool Images

This script generates unique images for each tool in your database using smart keyword-based image selection.

## Features

- 🎨 **Unique Images**: Each tool gets its own custom image based on its name, description, and category
- 🔍 **Smart Keywords**: Extracts keywords from tool name and description for relevant images
- 🌈 **Category Variation**: Uses category-specific keywords to ensure diversity
- 🔄 **Smart Fallback**: Uses category-appropriate stock images if needed
- 📊 **Progress Tracking**: Shows detailed progress for each tool
- ⚡ **Fast Processing**: Processes all tools quickly without API rate limits

## Prerequisites

Ensure you have the following in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## Usage

Run the script using npm:

```bash
npm run generate:images
```

Or directly with Node:

```bash
node generate-unique-tool-images.js
```

## What It Does

1. **Fetches** all tools from your Supabase database
2. **Generates** a unique image URL for each tool using:
   - Keywords extracted from tool name
   - Keywords from tool description
   - Category-specific keywords
   - Unique hash-based seeds
3. **Updates** the database with new image URLs
4. **Reports** success/failure statistics

## Image Generation Details

Each image URL is generated with:

- **Name Keywords**: Extracts meaningful words from the tool name
- **Description Keywords**: Pulls relevant terms from the description
- **Category Keywords**: 5+ variations per category (e.g., 'music', 'audio', 'studio' for Audio & Music)
- **Unique Seed**: Hash-based seed ensures each tool gets a different image
- **Aspect Ratio**: 16:9 for consistent display

## Output

The script provides detailed progress information:

```
[1/20] Processing: ChatGPT Clone
   Category: Content Generation
   Current image: https://images.unsplash.com/photo-...
   Generating unique image URL...
   ✅ Unique image URL generated
   Keywords: chatgpt,clone,content,technology
   ✅ Updated with unique image!
```

Final summary shows:
- 🎨 Unique images generated
- 📸 Fallback images used
- ❌ Errors encountered
- 📊 Total processed

## Processing Speed

The script processes tools quickly with only a **200ms** delay between each tool.

For a database with 20 tools, expect the script to complete in approximately **5-10 seconds**.

## Fallback Behavior

If image URL generation fails for any tool (rare), the script automatically:
1. Uses a category-appropriate stock image from Unsplash
2. Logs the fallback usage
3. Continues processing remaining tools

## Troubleshooting

### "Missing Supabase credentials"
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in `.env`

### All images look the same
- Check that tool names and descriptions are unique
- The script uses a hash of the tool name to generate different seeds

### Database update errors
- Verify your Supabase permissions
- Check that the `tools` table has an `image_url` column

## Notes

- Images are sourced from Unsplash with unique keyword combinations
- Each tool gets a different image based on its name, description, and category
- No API costs - uses free Unsplash image service
- Images are stored as URLs (not base64) to save database space
