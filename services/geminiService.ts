import { Tool, Slide, NewsArticle } from "../types";

// API endpoint for secure Gemini calls
// Use local development server if in dev mode, otherwise use Vercel API routes
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const GEMINI_API = isDevelopment
  ? 'http://localhost:3001/api/gemini'
  : '/api/gemini';

console.log(`🔧 API Mode: ${isDevelopment ? 'Development' : 'Production'}`);
console.log(`📡 API Endpoint: ${GEMINI_API}`);

// Helper function to call backend API
const callGeminiAPI = async (action: string, payload: any) => {
  const response = await fetch(GEMINI_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });

  if (!response.ok) {
    let errorMessage = 'Gemini API request failed';
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch (e) {
      // If response body is not JSON, use status text
      errorMessage = `${errorMessage}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch (e) {
    throw new Error('Failed to parse API response. The server may have returned invalid data.');
  }
};

// --- Directory Generation ---
export const generateDirectoryTools = async (category?: string): Promise<Tool[]> => {
  const data = await callGeminiAPI('generateDirectoryTools', { category });
  const tools = data.tools || [];

  console.log(`🎨 Generating AI images for ${tools.length} tools...`);

  // Category-based fallback images
  const categoryImages: Record<string, string> = {
    'Writing': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1280&h=720&fit=crop&q=80',
    'Content Generation': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
    'Image Generation': 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1280&h=720&fit=crop&q=80',
    'Video Editing': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1280&h=720&fit=crop&q=80',
    'Audio Production': 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&h=720&fit=crop&q=80',
    'Voice Synthesis': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1280&h=720&fit=crop&q=80',
    'Music Generation': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1280&h=720&fit=crop&q=80',
    'Code Generation': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1280&h=720&fit=crop&q=80',
    'Data Analysis': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop&q=80',
    'Data Analytics': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop&q=80',
    'Customer Support': 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1280&h=720&fit=crop&q=80',
    'Healthcare': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1280&h=720&fit=crop&q=80',
    'Personal Productivity': 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&h=720&fit=crop&q=80',
    'Marketing': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
    'Natural Language Processing': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
    'Text Generation': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
    '3D Modeling': 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1280&h=720&fit=crop&q=80',
  };

  // Generate AI images for each tool sequentially to avoid rate limits
  const toolsWithImages = [];

  for (let i = 0; i < tools.length; i++) {
    const t = tools[i];
    try {
      console.log(`🖼️ Generating image ${i + 1}/${tools.length} for: ${t.name}`);

      // Create descriptive prompt for the tool image
      const imagePrompt = `Professional, modern AI tool interface for "${t.name}", ${t.category} tool. ${t.description}. Sleek UI design, vibrant colors, tech-focused, high quality 4K screenshot.`;

      let imageUrl;

      try {
        // Try to generate AI image with Gemini Imagen
        const imageData = await callGeminiAPI('generateImage', {
          prompt: imagePrompt,
          aspectRatio: '16:9',
          size: '1K'
        });

        // Extract image data from response
        const imageInlineData = imageData?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

        if (imageInlineData) {
          const { data, mimeType } = imageInlineData;

          // Check if it's a URL (fallback) or base64
          if (mimeType === 'text/url') {
            imageUrl = data;
            console.log(`📸 Using fallback URL for ${t.name}`);
          } else if (mimeType === 'image/png' || mimeType === 'image/jpeg') {
            // Base64 image from AI - check size
            const sizeInKB = (data.length * 3) / 4 / 1024;

            if (sizeInKB > 500) {
              // Image too large, use category-based image
              console.warn(`⚠️ AI image for ${t.name} is too large (${sizeInKB.toFixed(0)}KB), using category fallback`);
              imageUrl = categoryImages[t.category] || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80';
            } else {
              // Use base64 image
              imageUrl = `data:${mimeType};base64,${data}`;
              console.log(`✅ AI image generated for ${t.name} (${sizeInKB.toFixed(0)}KB)`);
            }
          }
        }
      } catch (aiError) {
        console.warn(`⚠️ AI image generation failed for ${t.name}, using category fallback:`, aiError);
      }

      // Final fallback to category-based image
      if (!imageUrl) {
        imageUrl = categoryImages[t.category] || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80';
        console.log(`📸 Using category fallback for ${t.name}: ${t.category}`);
      }

      const toolWithImage = {
        ...t,
        id: t.id || `gen-${Date.now()}-${i}`,
        imageUrl: imageUrl
      };

      console.log(`📦 Tool ${i + 1} ready:`, {
        name: toolWithImage.name,
        category: toolWithImage.category,
        imageType: toolWithImage.imageUrl?.startsWith('data:') ? 'AI-generated' : 'Fallback',
      });

      toolsWithImages.push(toolWithImage);

      // Small delay to avoid rate limiting
      if (i < tools.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`❌ Failed to process ${t.name}:`, error);
      // Final fallback to category-based image
      const fallbackImage = categoryImages[t.category] || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80';
      toolsWithImages.push({
        ...t,
        id: t.id || `gen-${Date.now()}-${i}`,
        imageUrl: fallbackImage
      });
    }
  }

  console.log(`✨ Completed generating ${toolsWithImages.length} tools with images`);
  return toolsWithImages;
};

// --- Smart Chat (Search & Maps) ---
export const sendChatMessage = async (history: {role: string, parts: any[]}[], message: string, useSearch: boolean, useMaps: boolean) => {
  const data = await callGeminiAPI('chat', {
    message,
    history,
    useSearch,
    useMaps
  });

  return data;
};

// --- Veo Video Generation ---
// Note: Video generation requires direct client access, consider moving to backend if needed
export const generateVideo = async (prompt: string, imageBase64?: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<any> => {
  throw new Error('Video generation moved to backend for security. Please contact admin.');
};

export const pollVideoOperation = async (operation: any): Promise<any> => {
  throw new Error('Video generation moved to backend for security. Please contact admin.');
};

// --- Image Studio (Gen & Edit) ---
export const editImage = async (prompt: string, imageBase64: string) => {
  const data = await callGeminiAPI('editImage', { prompt, imageBase64 });
  return data;
};

// --- Audio Transcription & TTS ---
export const transcribeAudio = async (audioBase64: string) => {
  const data = await callGeminiAPI('transcribeAudio', { audioBase64 });
  return data.text || '';
};

export const generateSpeech = async (text: string, voice: string = 'Kore') => {
  const data = await callGeminiAPI('generateSpeech', { text, voice });
  return { audioData: data.audioData };
};

export const generateConversationScript = async (topic: string, speaker1: string, speaker2: string) => {
  const data = await callGeminiAPI('generateConversationScript', { topic, speaker1, speaker2 });
  return data.text || '';
};

export const generateMultiSpeakerSpeech = async (script: string, speaker1Config: {name: string, voice: string}, speaker2Config: {name: string, voice: string}) => {
  const data = await callGeminiAPI('generateMultiSpeakerSpeech', { script, speaker1Config, speaker2Config });
  return { audioData: data.audioData };
};

// --- Admin & Tool Insights ---

export const extractToolFromRSSItem = async (title: string, description: string): Promise<Partial<Tool>> => {
  const data = await callGeminiAPI('extractToolFromRSS', { title, description });
  return data.tool || {};
};

export const extractNewsFromRSSItem = async (title: string, description: string): Promise<Partial<NewsArticle>> => {
  const data = await callGeminiAPI('extractNewsFromRSS', { title, description });
  return data.article || {};
};

export const generateToolSlides = async (tool: Tool): Promise<Slide[]> => {
  const data = await callGeminiAPI('generateToolSlides', { tool });
  return data.slides || [];
};

export const generateImage = async (prompt: string, aspectRatio?: string, size?: string) => {
  const data = await callGeminiAPI('generateImage', { prompt, aspectRatio, size });
  return data;
};

export const analyzeToolTrends = async (tools: Tool[]): Promise<string> => {
  const data = await callGeminiAPI('analyzeToolTrends', { tools });
  return data.analysis || "Unable to generate analysis.";
};

// --- Generate Image for Tool ---
export const generateImageForTool = async (toolName: string, toolDescription: string, category: string): Promise<string> => {
  try {
    // Create descriptive prompt for the tool image
    const imagePrompt = `Professional product screenshot or icon for an AI tool called "${toolName}". ${toolDescription}. Category: ${category}. Modern, clean, tech-focused design with vibrant colors.`;

    // Generate image with Gemini
    const imageData = await callGeminiAPI('generateImage', {
      prompt: imagePrompt,
      aspectRatio: '16:9',
      size: '1K'
    });

    // Extract image data from response
    const imageInlineData = imageData?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (imageInlineData) {
      const { data, mimeType } = imageInlineData;

      // Check if it's a base64 image or URL
      if (mimeType === 'image/png' || mimeType === 'image/jpeg') {
        // Base64 image from AI - convert to data URL
        return `data:${mimeType};base64,${data}`;
      } else {
        // It's a URL (Unsplash fallback)
        return data;
      }
    }

    // Fallback to Unsplash if no image generated
    throw new Error('No image generated');
  } catch (error) {
    console.error('Failed to generate image with Gemini:', error);
    // Fallback to Unsplash with better keywords
    return `https://source.unsplash.com/1200x630/?${category.toLowerCase()},technology,${toolName.split(' ')[0].toLowerCase()}`;
  }
};