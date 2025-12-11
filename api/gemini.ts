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
        const { prompt, aspectRatio = '16:9', size = '1K' } = payload;

        try {
          // Use Imagen 3 via generateContent API
          const imageResponse = await ai.models.generateContent({
            model: 'imagen-3.0-generate-001',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              responseModalities: 'image'
            }
          });

          // Check if image was generated
          const imagePart = imageResponse?.candidates?.[0]?.content?.parts?.[0];
          
          if (imagePart?.inlineData) {
            console.log('✅ Imagen 3 generated image successfully');
            return res.json({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        inlineData: {
                          data: imagePart.inlineData.data,
                          mimeType: imagePart.inlineData.mimeType || 'image/png'
                        }
                      }
                    ]
                  }
                }
              ]
            });
          }

          throw new Error('No image data in Imagen response');
        } catch (error: any) {
          console.error('⚠️ Imagen 3 failed, using category-based fallback:', error.message);

          // Category-based fallback images (high quality Unsplash)
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
            'Customer Support': [
              'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1280&h=720&fit=crop&q=80',
              'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1280&h=720&fit=crop&q=80',
              'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1280&h=720&fit=crop&q=80'
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

          // Get random image from category or default
          let fallbackImage = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80';
          
          for (const [category, images] of Object.entries(categoryImages)) {
            if (prompt.toLowerCase().includes(category.toLowerCase())) {
              // Use hash of prompt to get consistent but different image
              const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              fallbackImage = images[hash % images.length];
              break;
            }
          }

          console.log(`📸 Using fallback image: ${fallbackImage}`);

          return res.json({
            candidates: [
              {
                content: {
                  parts: [
                    { 
                      inlineData: { 
                        data: fallbackImage, 
                        mimeType: 'text/url' 
                      } 
                    }
                  ]
                }
              }
            ]
          });
        }
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
        const { count = 9, category } = payload;
        
        const categoryFilter = category ? ` focused on the ${category} category` : ' across diverse categories (Writing, Image, Video, Audio, Coding, Business, Data Analysis, Healthcare, Education)';
        
        const prompt = `Generate ${count} unique and diverse AI tools${categoryFilter}. Each tool must be COMPLETELY DIFFERENT with distinct names, purposes, and descriptions. Return JSON array with ${count} tools.`;
        
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

      case 'generateNewsFromTopic': {
        const { topic } = payload;

        // Fetch top Google News RSS items for context
        let contextItems: Array<{ title: string; link: string; description: string }> = [];
        try {
          const query = encodeURIComponent(topic);
          const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
          const rssResponse = await fetch(rssUrl);
          const xml = await rssResponse.text();

          const itemRegex = /<item>([\s\S]*?)<\/item>/g;
          let match;
          while ((match = itemRegex.exec(xml)) && contextItems.length < 5) {
            const itemXml = match[1];
            const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
            const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
            const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);

            contextItems.push({
              title: titleMatch?.[1] || 'Untitled',
              link: linkMatch?.[1] || '',
              description: (descMatch?.[1] || '').replace(/<[^>]+>/g, '').trim()
            });
          }
        } catch (err) {
          console.warn('Google News fetch failed, continuing without context', err);
        }

        const headlines = contextItems.map((i, idx) => `${idx + 1}. ${i.title} — ${i.description}`).join("\n");

        const prompt = `You are a concise tech news editor. Using the context below, craft a fresh article about the topic: "${topic}".
Context headlines:\n${headlines || 'No external context available, rely on general knowledge about the topic.'}

Return JSON with: title (engaging, <=120 chars), description (1-2 sentences), content (3-5 short paragraphs, Markdown OK), source (string), category (string).`;

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
                source: { type: Type.STRING },
                category: { type: Type.STRING }
              }
            }
          }
        });

        const article = JSON.parse(response.text || "{}");
        return res.json({
          article: {
            ...article,
            imageUrl: `https://source.unsplash.com/1200x630/?${encodeURIComponent(topic + ' technology news')}`,
            source: article.source || 'Google News',
            category: article.category || 'AI News'
          }
        });
      }

      case 'editImage': {
        const { prompt } = payload;

        try {
          // Use Gemini to extract better keywords for image search
          const keywordResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extract 2-3 descriptive keywords for finding a relevant stock photo based on this edit request: "${prompt}". Return only comma-separated keywords, no explanation.`
          });

          const keywords = (keywordResponse.text || prompt)
            .replace(/[^a-zA-Z0-9,\s]/g, '')
            .split(/[,\s]+/)
            .filter(Boolean)
            .slice(0, 3)
            .join(',');

          // Use Unsplash with enhanced keywords
          const imageUrl = `https://source.unsplash.com/1200x630/?${keywords || 'technology'}`;

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
        } catch (error: any) {
          console.error('Image edit failed:', error);
          const keywords = prompt.split(' ').slice(0, 3).join(',');
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

      case 'generateToolFromTopic': {
        const { topic, prompt } = payload;
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
                price: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                website: { type: Type.STRING },
                how_to_use: { type: Type.STRING },
                features_detailed: { type: Type.STRING },
                use_cases: { type: Type.STRING },
                pros_cons: { type: Type.STRING }
              }
            }
          }
        });
        return res.json(JSON.parse(response.text || "{}"));
      }

      case 'enrichToolDetails': {
        const { toolName, prompt } = payload;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                how_to_use: { type: Type.STRING },
                features_detailed: { type: Type.STRING },
                use_cases: { type: Type.STRING },
                pros_cons: { type: Type.STRING },
                screenshots_urls: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        });
        return res.json(JSON.parse(response.text || "{}"));
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process request' });
  }
}
