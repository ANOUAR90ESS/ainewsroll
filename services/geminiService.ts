import { Tool, Slide, NewsArticle } from "../types";

// API endpoint for secure Gemini calls
const GEMINI_API = '/api/gemini';

// Helper function to call backend API
const callGeminiAPI = async (action: string, payload: any) => {
  const response = await fetch(GEMINI_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gemini API request failed');
  }
  
  return response.json();
};

// --- Directory Generation ---
export const generateDirectoryTools = async (category?: string): Promise<Tool[]> => {
  const data = await callGeminiAPI('generateDirectoryTools', { category });
  const tools = data.tools || [];

  // Generate AI images for each tool
  const toolsWithImages = await Promise.all(
    tools.map(async (t: any, i: number) => {
      try {
        // Create descriptive prompt for the tool image
        const imagePrompt = `Professional product image for ${t.name}: ${t.description}. Modern, clean, tech-focused design.`;

        // Generate image with Gemini
        const imageData = await callGeminiAPI('generateImage', {
          prompt: imagePrompt,
          aspectRatio: '16:9',
          size: '1K'
        });

        // Extract image data from response
        const imageInlineData = imageData?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        let imageUrl;

        if (imageInlineData) {
          const { data, mimeType } = imageInlineData;

          // Check if it's a base64 image or URL
          if (mimeType === 'image/png' || mimeType === 'image/jpeg') {
            // Base64 image from AI - convert to data URL
            imageUrl = `data:${mimeType};base64,${data}`;
          } else {
            // It's a URL (Unsplash fallback)
            imageUrl = data;
          }
        } else {
          // Final fallback
          imageUrl = `https://source.unsplash.com/1200x630/?${t.category.toLowerCase()},technology`;
        }

        return {
          ...t,
          id: t.id || `gen-${Date.now()}-${i}`,
          imageUrl: imageUrl
        };
      } catch (error) {
        console.error(`Failed to generate image for ${t.name}:`, error);
        // Fallback to Unsplash
        return {
          ...t,
          id: t.id || `gen-${Date.now()}-${i}`,
          imageUrl: `https://source.unsplash.com/1200x630/?${t.category.toLowerCase()},technology`
        };
      }
    })
  );

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