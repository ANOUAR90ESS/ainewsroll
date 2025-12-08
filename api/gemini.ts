import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality, Type } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set');
}

const getClient = () => {
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
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp-imagen',
          contents: { parts: [{ text: prompt }] },
          config: { responseModalities: [Modality.IMAGE] }
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return res.json({ imageData: base64 || null });
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
        const { prompt, imageBase64 } = payload;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { mimeType: 'image/png', data: imageBase64 } },
              { text: prompt }
            ]
          }
        });
        const editedImage = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return res.json({ imageData: editedImage || null });
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
        const { text, voice } = payload;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: { parts: [{ text }] },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || 'Kore' } }
            }
          }
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return res.json({ audioData: audioData || null });
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
        const { script, speaker1Config, speaker2Config } = payload;
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
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return res.json({ audioData: audioData || null });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process request' });
  }
}
