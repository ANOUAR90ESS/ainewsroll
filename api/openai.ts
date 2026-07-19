import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const getClient = () => {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not configured. Please set it in Vercel project settings.');
  }
  return new OpenAI({ apiKey: OPENAI_API_KEY });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, payload } = req.body;

  try {
    const openai = getClient();

    switch (action) {
      case 'chat': {
        const { message, history } = payload;
        const messages = [
          ...history.map((h: any) => ({
            role: h.role,
            content: h.parts[0].text
          })),
          { role: 'user', content: message }
        ];

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: messages
        });

        return res.json({ text: response.choices[0].message.content });
      }

      case 'generateToolSlides': {
        const { tool } = payload;
        const prompt = `Create a 4-slide presentation about the AI tool "${tool.name}".
Description: ${tool.description}.
Category: ${tool.category}.
Return JSON array of slides with this structure: [{"title": "string", "content": ["string"]}]`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{"slides":[]}');
        return res.json({ slides: result.slides || [] });
      }

      case 'generateImage': {
        const { prompt, aspectRatio = '16:9' } = payload;
        const cleanPrompt = (prompt || 'Modern AI software interface design, 3d digital render, high tech')
          .substring(0, 900)
          .replace(/[\n\r]+/g, ' ');

        let imageUrl = '';

        // 1) Try DALL-E 3
        try {
          let imageSize: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024";
          if (aspectRatio === '16:9') imageSize = "1792x1024";
          else if (aspectRatio === '9:16') imageSize = "1024x1792";

          const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: cleanPrompt,
            size: imageSize,
            quality: "standard",
            n: 1,
          });

          imageUrl = response.data?.[0]?.url || '';
          if (imageUrl) {
            console.log('✅ OpenAI DALL-E 3 generated image successfully!');
          }
        } catch (dalle3Err: any) {
          console.warn('⚠️ DALL-E 3 attempt failed:', dalle3Err.message, 'Trying DALL-E 2 fallback...');

          // 2) Fallback to DALL-E 2
          try {
            const response2 = await openai.images.generate({
              model: "dall-e-2",
              prompt: cleanPrompt,
              size: "1024x1024",
              n: 1,
            });
            imageUrl = response2.data?.[0]?.url || '';
            if (imageUrl) {
              console.log('✅ OpenAI DALL-E 2 generated image successfully!');
            }
          } catch (dalle2Err: any) {
            console.error('❌ Both DALL-E 3 and DALL-E 2 failed:', dalle2Err.message);
          }
        }

        if (imageUrl) {
          return res.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        data: imageUrl,
                        mimeType: 'text/url'
                      }
                    }
                  ]
                }
              }
            ]
          });
        }

        // Fallback to high quality Unsplash if OpenAI image generation fails entirely
        const fallbackUrl = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80';
        return res.json({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: fallbackUrl,
                      mimeType: 'text/url'
                    }
                  }
                ]
              }
            }
          ]
        });
      }
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

          let fallbackImage = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80';

          for (const [category, images] of Object.entries(categoryImages)) {
            if (prompt.toLowerCase().includes(category.toLowerCase())) {
              const hash = prompt
                .split('')
                .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
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

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }]
        });

        return res.json({ analysis: response.choices[0].message.content });
      }

      case 'generateDirectoryTools': {
        const { count = 9, category } = payload;

        const categoryFilter = category ? ` focused on the ${category} category` : ' across diverse categories (Writing, Image, Video, Audio, Coding, Business, Data Analysis, Healthcare, Education)';

        const prompt = `Generate ${count} unique and diverse AI tools${categoryFilter}. Each tool must be COMPLETELY DIFFERENT with distinct names, purposes, and descriptions. Return a JSON object with a "tools" array containing ${count} tools. Each tool should have: name, description, category, tags (array), price, imageUrl, website.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{"tools":[]}');
        return res.json({ tools: result.tools || [] });
      }

      case 'extractToolFromRSS': {
        const { title, description } = payload;
        const prompt = `Analyze this RSS feed item and extract structured data to create an AI Tool listing.
Title: ${title}
Description: ${description}

Return a JSON object with: name, description, category, tags (array), price`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        });

        return res.json({ tool: JSON.parse(response.choices[0].message.content || "{}") });
      }

      case 'extractNewsFromRSS': {
        const { title, description } = payload;
        const prompt = `You are a senior tech news editor. Analyze this RSS feed item and expand it into a complete, in-depth, long-form news article (800 to 1200 words).
Title: ${title}
Description: ${description}

REQUIREMENTS:
- Expand the story into a full, detailed article with background context, technical analysis, industry implications, and structured Markdown sections (##, ###).
- Return a JSON object with: title, description, content, category.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        });

        return res.json({ article: JSON.parse(response.choices[0].message.content || "{}") });
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

        const prompt = `You are a senior tech journalist and editor. Using the context headlines below, write an IN-DEPTH, COMPREHENSIVE long-form news article (1000 to 1500 words) about the topic: "${topic}".
Context headlines:
${headlines || 'No external context available, rely on extensive general knowledge and deep technical analysis of the topic.'}

CRITICAL INSTRUCTIONS FOR ARTICLE LENGTH & STRUCTURE:
- The article MUST be a comprehensive, long-form piece of around 1000-1500 words. DO NOT write brief summaries.
- Structure the content into multiple rich sections using Markdown headings (## and ###).
- Sections to include:
  1. ## Introduction & Executive Summary
  2. ## Background & Technological Context
  3. ## Detailed Breakdown & Key Innovations
  4. ## Market Impact & Industry Reactions
  5. ## Future Outlook & What Lies Ahead
  6. ## Key Takeaways / Conclusion
- Write in a professional, engaging, highly informative tone with concrete analysis.

Return JSON with: title (engaging, <=120 chars), description (1-2 sentences), content (full 1000+ words article content formatted in Markdown), source (string), category (string).`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        });

        const article = JSON.parse(response.choices[0].message.content || "{}");
        return res.json({
          article: {
            ...article,
            source: article.source || 'AI News-Roll Editorial',
            category: article.category || 'AI News'
          }
        });
      }

      case 'editImage': {
        const { prompt } = payload;

        try {
          const keywordResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{
              role: 'user',
              content: `Extract 2-3 descriptive keywords for finding a relevant stock photo based on this edit request: "${prompt}". Return only comma-separated keywords, no explanation.`
            }]
          });

          const keywords = (keywordResponse.choices[0].message.content || prompt)
            .replace(/[^a-zA-Z0-9,\s]/g, '')
            .split(/[,\s]+/)
            .filter(Boolean)
            .slice(0, 3)
            .join(',');

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

        // Convert base64 to buffer
        const audioBuffer = Buffer.from(audioBase64, 'base64');

        // Create a File-like object for OpenAI
        const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

        const response = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
        });

        return res.json({ text: response.text || '' });
      }

      case 'generateSpeech': {
        const { text, voice = 'alloy' } = payload;

        // Map voice names from Gemini to OpenAI
        const voiceMap: Record<string, any> = {
          'Kore': 'alloy',
          'Charon': 'echo',
          'Kore-2': 'fable',
          'Fenrir': 'onyx',
          'Aoede': 'nova',
          'Puck': 'shimmer'
        };

        const openaiVoice = voiceMap[voice] || 'alloy';

        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: openaiVoice,
          input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const audioData = buffer.toString('base64');

        return res.json({ audioData });
      }

      case 'generateConversationScript': {
        const { topic, speaker1, speaker2 } = payload;
        const prompt = `Write a short, engaging podcast dialogue (approx 150 words) between two hosts, ${speaker1} and ${speaker2}, discussing the topic: "${topic}".
Format it exactly like this:
${speaker1}: [Text]
${speaker2}: [Text]
Keep it natural, conversational, and enthusiastic.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }]
        });

        return res.json({ text: response.choices[0].message.content || '' });
      }

      case 'generateMultiSpeakerSpeech': {
        const { script, speaker1Config, speaker2Config } = payload;

        // Parse the script to separate speakers
        const lines = script.split('\n').filter((line: string) => line.trim());
        const audioSegments: string[] = [];

        for (const line of lines) {
          let voice = 'alloy';
          let text = line;

          if (line.includes(`${speaker1Config.name}:`)) {
            text = line.split(':')[1]?.trim() || '';
            voice = speaker1Config.voice || 'alloy';
          } else if (line.includes(`${speaker2Config.name}:`)) {
            text = line.split(':')[1]?.trim() || '';
            voice = speaker2Config.voice || 'echo';
          }

          if (text) {
            const mp3 = await openai.audio.speech.create({
              model: "tts-1",
              voice: voice as any,
              input: text,
            });

            const buffer = Buffer.from(await mp3.arrayBuffer());
            audioSegments.push(buffer.toString('base64'));
          }
        }

        // Combine all segments (simplified - in production you'd want proper audio merging)
        const combinedAudio = audioSegments.join(',');

        return res.json({ audioData: combinedAudio });
      }

      case 'generateToolFromTopic': {
        const { topic, prompt } = payload;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        });

        return res.json(JSON.parse(response.choices[0].message.content || "{}"));
      }

      case 'enrichToolDetails': {
        const { toolName, prompt } = payload;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        });

        return res.json(JSON.parse(response.choices[0].message.content || "{}"));
      }

      case 'scrapeRealNews': {
        const { category, count } = payload;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: `You are a senior tech news aggregator and editor. Find and write ${count} recent, REAL in-depth news articles about ${category} from the past 24-48 hours.

IMPORTANT REQUIREMENTS:
- Each article MUST be a full-length, comprehensive long-form piece (800-1200 words).
- Include real company names, people, dates, verifiable facts, and current developments.
- Divide each article content into structured sections using Markdown headings (##, ###).

Return a JSON object with this EXACT structure:
{
  "articles": [
    {
      "title": "Article title here",
      "summary": "2-3 sentence summary",
      "description": "2-3 sentence summary",
      "content": "Full detailed article content (800-1200 words divided into clear sections with ## and ### headings, background context, technical analysis, and conclusions)",
      "source": "Real news outlet name (TechCrunch, The Verge, Reuters, etc.)",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`
          }],
          response_format: { type: "json_object" },
          temperature: 0.7
        });

        const content = response.choices[0].message.content || '{"articles":[]}';
        const data = JSON.parse(content);

        return res.json(data);
      }

      case 'fetchRSS': {
        const { rssUrl } = payload;
        try {
          const response = await fetch(rssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          const text = await response.text();

          // If JSON Feed
          if (text.trim().startsWith('{')) {
            const json = JSON.parse(text);
            const items = (json.items || []).slice(0, 20).map((item: any, i: number) => ({
              id: item.id || `rss-${i}`,
              title: item.title || '',
              description: item.summary || item.content_html || item.content_text || '',
              link: item.url || item.link || '#'
            }));
            return res.json({ items });
          }

          // If XML Feed
          return res.json({ xml: text });
        } catch (err: any) {
          return res.status(500).json({ error: err.message });
        }
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process request' });
  }
}
