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
  
  return tools.map((t: any, i: number) => ({
    ...t,
    id: t.id || `gen-${Date.now()}-${i}`,
    imageUrl: `https://picsum.photos/seed/${t.name.replace(/\s/g, '')}/400/250`
  }));
};

// --- Smart Chat (Search & Maps) ---
export const sendChatMessage = async (history: {role: string, parts: any[]}[], message: string, useSearch: boolean, useMaps: boolean) => {
  const data = await callGeminiAPI('chat', { 
    message, 
    history, 
    useSearch, 
    useMaps 
  });
  
  return { text: data.text };
};

// --- Veo Video Generation ---
// Note: Video generation requires direct client access, consider moving to backend if needed
export const generateVideo = async (prompt: string, imageBase64?: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  throw new Error('Video generation moved to backend for security. Please contact admin.');
};

export const pollVideoOperation = async (operation: any) => {
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