import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { Tool, Slide, NewsArticle } from "../types";

// Helper to get client instance
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Directory Generation ---
export const generateDirectoryTools = async (category?: string): Promise<Tool[]> => {
  const ai = getClient();
  const prompt = `Generate a list of 6 fictional, high-tech AI tools${category ? ` specifically for ${category}` : ''}. 
  Return JSON format. Each tool should have: name, description (max 15 words), category, tags (array), price (e.g. "Freemium", "$29/mo"), and website (use #).`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            price: { type: Type.STRING },
            website: { type: Type.STRING },
          }
        }
      }
    }
  });

  const tools = JSON.parse(response.text || "[]");
  return tools.map((t: any, i: number) => ({
    ...t,
    id: t.id || `gen-${Date.now()}-${i}`,
    imageUrl: `https://picsum.photos/seed/${t.name.replace(/\s/g, '')}/400/250`
  }));
};

// --- Smart Chat (Search & Maps) ---
export const sendChatMessage = async (history: {role: string, parts: any[]}[], message: string, useSearch: boolean, useMaps: boolean) => {
  const ai = getClient();
  const tools: any[] = [];
  if (useSearch) tools.push({ googleSearch: {} });
  if (useMaps) tools.push({ googleMaps: {} });

  // Use Gemini 3 Pro for complex reasoning, or Flash if strict grounding needed (Flash is often faster/better for simple grounding)
  // Prompt requested gemini-2.5-flash for grounding.
  const model = (useSearch || useMaps) ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';

  const response = await ai.models.generateContent({
    model: model,
    contents: message, // Simplified for this demo, usually we pass full history if chat mode
    config: {
      tools: tools.length > 0 ? tools : undefined,
    }
  });

  return response;
};

// --- Veo Video Generation ---
export const generateVideo = async (prompt: string, imageBase64?: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  const ai = getClient();
  
  // Construct input
  let contents: any = { prompt }; // Prompt is handled slightly differently in generateVideos args, strictly speaking param is `prompt`
  
  const config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: aspectRatio
  };

  // If image provided
  let imageInput = undefined;
  if (imageBase64) {
    imageInput = {
      imageBytes: imageBase64,
      mimeType: 'image/png'
    };
  }

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: imageInput,
    config: config
  });

  return operation;
};

export const pollVideoOperation = async (operation: any) => {
  const ai = getClient();
  return await ai.operations.getVideosOperation({ operation: operation });
};

// --- Image Studio (Gen & Edit) ---
export const generateImage = async (prompt: string, aspectRatio: string, size: string) => {
  const ai = getClient();
  // Using generateContent for nano banana series per guidelines for image generation
  // Model: gemini-3-pro-image-preview for high quality with size control
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      }
    }
  });
  return response;
};

export const editImage = async (prompt: string, imageBase64: string) => {
  const ai = getClient();
  // Using gemini-2.5-flash-image for editing (Nano banana powered)
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: imageBase64 } },
        { text: prompt }
      ]
    }
  });
  return response;
};

// --- Audio Transcription & TTS ---
export const transcribeAudio = async (audioBase64: string) => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: 'audio/wav', data: audioBase64 } }, // Assuming wav from recorder
                { text: "Transcribe this audio exactly." }
            ]
        }
    });
    return response.text;
};

export const generateSpeech = async (text: string, voice: string = 'Kore') => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
            }
        }
    });
    return response;
}

export const generateConversationScript = async (topic: string, speaker1: string, speaker2: string) => {
    const ai = getClient();
    const prompt = `Write a short, engaging podcast dialogue (approx 150 words) between two hosts, ${speaker1} and ${speaker2}, discussing the topic: "${topic}". 
    Format it exactly like this:
    ${speaker1}: [Text]
    ${speaker2}: [Text]
    Keep it natural, conversational, and enthusiastic.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};

export const generateMultiSpeakerSpeech = async (script: string, speaker1Config: {name: string, voice: string}, speaker2Config: {name: string, voice: string}) => {
    const ai = getClient();
    // Prepend instruction to ensure model understands it's a TTS task for specific speakers
    const prompt = `TTS the following conversation:\n${script}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        {
                            speaker: speaker1Config.name,
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker1Config.voice } }
                        },
                        {
                            speaker: speaker2Config.name,
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker2Config.voice } }
                        }
                    ]
                }
            }
        }
    });
    return response;
};

// --- Admin & Tool Insights ---

export const extractToolFromRSSItem = async (title: string, description: string): Promise<Partial<Tool>> => {
  const ai = getClient();
  const prompt = `
    Analyze this RSS feed item and extract structured data to create an AI Tool listing.
    Title: ${title}
    Description: ${description}
    
    Return a JSON object with:
    - name: A catchy tool name based on the title
    - description: A concise 1-sentence description
    - category: The best fitting category (e.g., Writing, Image, Video, Coding, Analytics)
    - tags: A list of 3 relevant tags
    - price: Estimated price model (e.g., "Free", "Paid", "Freemium") - guess based on context or default to "Waitlist"
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            price: { type: Type.STRING },
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export const extractNewsFromRSSItem = async (title: string, description: string): Promise<Partial<NewsArticle>> => {
  const ai = getClient();
  const prompt = `
    Analyze this RSS feed item and extract structured data to create a News Article.
    Title: ${title}
    Description: ${description}
    
    Return a JSON object with:
    - title: A clean, engaging headline
    - description: A short summary (max 2 sentences) for the preview card
    - content: A longer, well-formatted blog post body (approx 100-150 words) based on the description. Expand on the concepts to make it readable.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            content: { type: Type.STRING },
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export const generateToolSlides = async (tool: Tool): Promise<Slide[]> => {
    const ai = getClient();
    const prompt = `Create a 4-slide presentation about the AI tool "${tool.name}". 
    Description: ${tool.description}. 
    Category: ${tool.category}.
    
    Return JSON array of slides.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text || "[]");
}

export const generatePodcastScript = async (tool: Tool): Promise<string> => {
    const ai = getClient();
    const prompt = `Write a very short, enthusiastic podcast intro script (approx 50 words) introducing the AI tool "${tool.name}". 
    The host is excited about its features: ${tool.description}.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || "";
}

// --- Analytics ---

export const analyzeToolTrends = async (tools: Tool[]): Promise<string> => {
  const ai = getClient();
  const toolList = tools.map(t => `- ${t.name} (${t.category}): ${t.description}`).join('\n');
  const prompt = `
    You are an expert market analyst for AI technologies.
    Analyze the following list of AI tools currently in our directory:
    
    ${toolList}
    
    Please provide a concise but insightful report covering:
    1. **Current Trend**: What is the dominant theme?
    2. **Market Gap**: What kind of tool is missing or underrepresented?
    3. **Prediction**: What should be the next big tool we build?
    
    Format the response in Markdown with clear headings.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Using Pro for better reasoning on analysis
    contents: prompt
  });
  
  return response.text || "Unable to generate analysis.";
}