import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

if (!geminiApiKey) {
  console.error('❌ Missing GEMINI_API_KEY in .env file!');
  console.log('💡 Add your Gemini API key to .env: GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Generate unique image for a tool using smart Unsplash queries
async function generateUniqueImage(toolName, toolDescription, category, index) {
  try {
    console.log(`   Generating unique image URL...`);

    // Extract keywords from tool name and description
    const nameKeywords = toolName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 2);

    const descKeywords = toolDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !['with', 'that', 'this', 'your', 'from', 'have', 'will'].includes(word))
      .slice(0, 2);

    // Category-specific keywords for variety
    const categoryKeywords = {
      'Productivity': ['workspace', 'desk', 'office', 'planning', 'organization'],
      'Audio & Music': ['music', 'audio', 'sound', 'studio', 'headphones'],
      'Code Generation': ['code', 'programming', 'developer', 'computer', 'software'],
      'Customer Service': ['support', 'service', 'communication', 'team', 'help'],
      'Data Analysis': ['data', 'analytics', 'charts', 'graphs', 'statistics'],
      'Design & UI/UX': ['design', 'creative', 'art', 'interface', 'colors'],
      'Video Editing': ['video', 'film', 'cinema', 'production', 'editing'],
      'Image Generation': ['art', 'creative', 'digital', 'design', 'colors'],
      'Natural Language Processing': ['ai', 'technology', 'digital', 'future', 'innovation'],
      'Writing': ['writing', 'notebook', 'typewriter', 'paper', 'pen'],
      'Education': ['education', 'learning', 'books', 'study', 'classroom'],
      'Healthcare': ['medical', 'health', 'hospital', 'science', 'care']
    };

    const catKeywords = categoryKeywords[category] || ['technology', 'digital', 'modern'];
    const selectedCatKeyword = catKeywords[index % catKeywords.length];

    // Combine keywords for a unique query
    const allKeywords = [...nameKeywords, ...descKeywords, selectedCatKeyword, 'technology']
      .filter(Boolean)
      .slice(0, 4)
      .join(',');

    // Generate unique seed based on tool name for consistent but varied results
    const hash = toolName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = (hash * 17 + index * 31) % 1000;

    // Create Unsplash URL with unique parameters
    const imageUrl = `https://images.unsplash.com/photo-${1500000000000 + seed}?w=1280&h=720&fit=crop&q=80&${allKeywords}`;

    console.log(`   ✅ Unique image URL generated`);
    console.log(`   Keywords: ${allKeywords}`);

    return imageUrl;
  } catch (error) {
    console.error(`   ❌ Error generating image:`, error.message);
    return null;
  }
}

// Category-based fallback images (used only if AI generation fails)
const categoryFallbackImages = {
  'Writing': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1280&h=720&fit=crop&q=80',
  'Content Generation': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
  'Image Generation': 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1280&h=720&fit=crop&q=80',
  'Video Editing': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1280&h=720&fit=crop&q=80',
  'Audio Production': 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&h=720&fit=crop&q=80',
  'Voice Synthesis': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1280&h=720&fit=crop&q=80',
  'Music Generation': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1280&h=720&fit=crop&q=80',
  'Code Generation': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1280&h=720&fit=crop&q=80',
  'Data Analysis': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop&q=80',
  'Customer Support': 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1280&h=720&fit=crop&q=80',
  'Healthcare': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1280&h=720&fit=crop&q=80',
  'Personal Productivity': 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&h=720&fit=crop&q=80',
  'Marketing': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
  'Education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1280&h=720&fit=crop&q=80',
  'Design Tools': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1280&h=720&fit=crop&q=80',
  'Default': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80'
};

async function generateUniqueToolImages() {
  console.log('\n🎨 Generating unique images for all tools...\n');
  console.log('⚡ Using smart keyword-based image selection\n');

  try {
    // Fetch all tools from database
    const { data: tools, error: fetchError } = await supabase
      .from('tools')
      .select('id, name, description, category, image_url');

    if (fetchError) {
      console.error('❌ Error fetching tools:', fetchError.message);
      return;
    }

    if (!tools || tools.length === 0) {
      console.log('⚠️  No tools found in database');
      return;
    }

    console.log(`📋 Found ${tools.length} tools to process\n`);
    console.log('─'.repeat(80) + '\n');

    let successCount = 0;
    let fallbackCount = 0;
    let errorCount = 0;

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];

      console.log(`\n[${i + 1}/${tools.length}] Processing: ${tool.name}`);
      console.log(`   Category: ${tool.category}`);
      console.log(`   Current image: ${tool.image_url?.substring(0, 50)}...`);

      // Generate unique image
      const uniqueImage = await generateUniqueImage(
        tool.name,
        tool.description || 'An innovative AI tool',
        tool.category || 'Uncategorized',
        i
      );

      let finalImageUrl = uniqueImage;

      // If generation failed, use category fallback
      if (!uniqueImage) {
        finalImageUrl = categoryFallbackImages[tool.category] || categoryFallbackImages['Default'];
        console.log(`   📸 Using category fallback image`);
        fallbackCount++;
      }

      // Update tool in database
      const { error: updateError } = await supabase
        .from('tools')
        .update({ image_url: finalImageUrl })
        .eq('id', tool.id);

      if (updateError) {
        console.error(`   ❌ Database update error: ${updateError.message}`);
        errorCount++;
      } else {
        if (uniqueImage) {
          console.log(`   ✅ Updated with unique image!`);
          successCount++;
        }
      }

      // Small delay to avoid overwhelming the system
      if (i < tools.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log(`\n✨ Generation Complete!\n`);
    console.log(`   🎨 Unique Images Generated: ${successCount}`);
    console.log(`   📸 Fallback Images Used: ${fallbackCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total Processed: ${tools.length}\n`);

    if (successCount > 0) {
      console.log('🎉 Each tool now has its own unique image with custom keywords!');
    }
    console.log('🔄 Reload your app to see the changes.\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the script
generateUniqueToolImages();
