import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const getClient = () => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not configured. Please set it in Vercel project settings.');
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, payload } = req.body;

  try {
    const ai = getClient();

    switch (action) {
      case 'chat': {
        const { message, history } = payload;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            ...history.map((h: any) => ({
              role: h.role,
              parts: [{ text: h.parts[0].text }]
            })),
            { role: 'user', parts: [{ text: message }] }
          ]
        });
        return res.json({ text: response.text });
      }

      case 'generateToolSlides': {
        const { tool } = payload;
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
        return res.json({ slides: JSON.parse(response.text || "[]") });
      }

      case 'generateImage': {
        const { prompt } = payload;
        const keywords = prompt.split(' ').slice(0, 3).join('%20');
        const imageUrl = `https://source.unsplash.com/1200x630/?${keywords || 'abstract'}`;
        return res.json({
          candidates: [
            {
              content: {
                parts: [
                  { inlineData: { data: imageUrl, mimeType: 'text/url' } }
                ]
              }
            }
          ]
        });
      }

      case 'analyzeToolTrends': {
        const { tools } = payload;
        const toolNames = tools.map((t: any) => t.name).join(', ');
        const prompt = `Analyze AI tool trends based on: ${toolNames}. Provide 3 key insights.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        return res.json({ analysis: response.text });
      }

      case 'generateDirectoryTools': {
        const prompt = `Generate 9 diverse AI tools across categories. Return JSON array.`;
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
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  price: { type: Type.STRING },
                  imageUrl: { type: Type.STRING },
                  website: { type: Type.STRING }
                }
              }
            }
          }
        });
        return res.json({ tools: JSON.parse(response.text || "[]") });
      }

      case 'extractToolFromRSS': {
        const { title, description } = payload;
        const prompt = `Analyze this RSS feed item and extract structured data to create an AI Tool listing.
Title: ${title}
Description: ${description}

Return a JSON object with: name, description, category, tags, price`;

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
                price: { type: Type.STRING }
              }
            }
          }
        });
        return res.json({ tool: JSON.parse(response.text || "{}") });
      }

      case 'extractNewsFromRSS': {
        const { title, description } = payload;
        const prompt = `Analyze this RSS feed item and extract structured data to create a News Article.
Title: ${title}
Description: ${description}

Return a JSON object with: title, description, content`;

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
                content: { type: Type.STRING }
              }
            }
          }
        });
        return res.json({ article: JSON.parse(response.text || "{}") });
      }

      case 'editImage': {
        const { prompt } = payload;
        const keywords = prompt.split(' ').slice(0, 3).join('%20');
        const imageUrl = `https://source.unsplash.com/1200x630/?${keywords || 'abstract'}`;
        return res.json({
          candidates: [
            {
              content: {
                parts: [
                  { inlineData: { data: imageUrl, mimeType: 'text/url' } }
                ]
              }
            }
          ]
        });
      }

      case 'transcribeAudio': {
        const { audioBase64 } = payload;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
              { text: "Transcribe this audio exactly." }
            ]
          }
        });
        return res.json({ text: response.text || '' });
      }

      case 'generateSpeech': {
        return res.json({ audioData: null, message: 'Audio generation not yet supported' });
      }

      case 'generateConversationScript': {
        const { topic, speaker1, speaker2 } = payload;
        const prompt = `Write a short, engaging podcast dialogue (approx 150 words) between two hosts, ${speaker1} and ${speaker2}, discussing the topic: "${topic}". 
    Format it exactly like this:
    ${speaker1}: [Text]
    ${speaker2}: [Text]
    Keep it natural, conversational, and enthusiastic.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        return res.json({ text: response.text || '' });
      }

      case 'generateMultiSpeakerSpeech': {
        return res.json({ audioData: null, message: 'Audio generation not yet supported' });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process request' });
  }
}
