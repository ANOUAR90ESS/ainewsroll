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
export const generateDirectoryTools = async (count: number = 9, category?: string): Promise<Tool[]> => {
  const data = await callGeminiAPI('generateDirectoryTools', { count, category });
  const tools = data.tools || [];

  console.log(`🎨 Generating AI images for ${tools.length} tools...`);

  // Category-based fallback images with multiple variations
  const categoryImages: Record<string, string[]> = {
    'Writing': [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1280&h=720&fit=crop&q=80'
    ],
    'Content Generation': [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542435503-956c469947f6?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1280&h=720&fit=crop&q=80'
    ],
    'Image Generation': [
      'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1561998338-13ad7883b20f?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1280&h=720&fit=crop&q=80'
    ],
    'Video Editing': [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579547621869-0ddb5f237392?w=1280&h=720&fit=crop&q=80'
    ],
    'Audio Production': [
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1280&h=720&fit=crop&q=80'
    ],
    'Voice Synthesis': [
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1280&h=720&fit=crop&q=80'
    ],
    'Music Generation': [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1280&h=720&fit=crop&q=80'
    ],
    'Code Generation': [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1280&h=720&fit=crop&q=80'
    ],
    'Data Analysis': [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=1280&h=720&fit=crop&q=80'
    ],
    'Data Analytics': [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop&q=80'
    ],
    'Customer Support': [
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1280&h=720&fit=crop&q=80'
    ],
    'Healthcare': [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1280&h=720&fit=crop&q=80'
    ],
    'Personal Productivity': [
      'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1280&h=720&fit=crop&q=80'
    ],
    'Marketing': [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop&q=80'
    ],
    'Natural Language Processing': [
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?w=1280&h=720&fit=crop&q=80'
    ],
    'Text Generation': [
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1280&h=720&fit=crop&q=80'
    ],
    '3D Modeling': [
      'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1280&h=720&fit=crop&q=80'
    ],
    'Design Tools': [
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=1280&h=720&fit=crop&q=80'
    ],
    'Education': [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1280&h=720&fit=crop&q=80'
    ],
    'Audio & Voice': [
      'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=1280&h=720&fit=crop&q=80'
    ]
  };

  // Generate AI images for each tool sequentially to avoid rate limits
  const toolsWithImages = [];

  for (let i = 0; i < tools.length; i++) {
    const t = tools[i];
    try {
      console.log(`🖼️ Generating image ${i + 1}/${tools.length} for: ${t.name}`);

      // Create HIGHLY DETAILED and UNIQUE prompt for each tool with variation keywords
      const variationKeywords = [
        'futuristic interface', 'modern dashboard', 'sleek design', 'vibrant display', 'professional mockup',
        'clean UI', 'tech visualization', 'digital workspace', 'innovative layout', 'smart interface'
      ];
      const randomVariation = variationKeywords[i % variationKeywords.length];
      
      const imagePrompt = `Create a UNIQUE ${randomVariation} for the AI tool "${t.name}". SPECIFIC DETAILS: This is a ${t.category} tool. EXACT PURPOSE: ${t.description}. PRICING: ${t.price}. KEY FEATURES: ${t.tags?.join(', ') || 'advanced AI capabilities'}. VISUAL STYLE: Show the specific ${t.category} functionality - ${t.description}. IMPORTANT: Make this image #${i + 1} completely different from others. High-quality, modern, tech-focused. SEED: ${Date.now() + i * 1000}`;

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
        // Use hash of tool name to get consistent but varied image
        const images = categoryImages[t.category] || [
          'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
          'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1280&h=720&fit=crop&q=80',
          'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?w=1280&h=720&fit=crop&q=80'
        ];
        
        // Create hash from tool name for consistent selection
        const hash = t.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        imageUrl = images[hash % images.length];
        
        console.log(`📸 Using category fallback for ${t.name}: ${t.category} (variant ${(hash % images.length) + 1}/${images.length})`);
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
    // Create DETAILED descriptive prompt using ALL available information with uniqueness factors
    const uniqueSeed = Date.now();
    const styleVariations = ['modern interface', 'sleek dashboard', 'professional mockup', 'futuristic display', 'clean design'];
    const randomStyle = styleVariations[Math.floor(Math.random() * styleVariations.length)];
    
    const imagePrompt = `Create a ${randomStyle} for "${toolName}" - a ${category} AI tool. EXACT FUNCTIONALITY: ${toolDescription}. Show the SPECIFIC features described: ${toolDescription}. Make it visually distinct and unique. High-quality, tech-focused, vibrant colors. UNIQUE SEED: ${uniqueSeed}. IMPORTANT: This must look completely different from other ${category} tools.`;

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