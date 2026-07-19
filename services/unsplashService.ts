/**
 * Unsplash Image Service
 * Provides high-quality, high-speed images from Unsplash CDN.
 * Uses a massive pool of 45+ unique tech photos with intelligent topic keyword detection
 * to ensure every tool and article gets a distinct, relevant photo.
 */

// Safe check for optional client API key in environment
const envAccessKey = typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY
  : undefined;

const HAS_VALID_KEY = Boolean(envAccessKey && !envAccessKey.includes('FAKE'));

// Extensive pool of verified Unsplash CDN photo URLs grouped by topic
const photoLibrary: Record<string, string[]> = {
  apple: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52d9',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2'
  ],
  tesla: [
    'https://images.unsplash.com/photo-1563720223185-11003d516935',
    'https://images.unsplash.com/photo-1536700503339-1e4b06520771',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70'
  ],
  chip: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
    'https://images.unsplash.com/photo-1591799264318-7e6e29868606',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5'
  ],
  ai: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
    'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4'
  ],
  code: [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd'
  ],
  data: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    'https://images.unsplash.com/photo-1543286386-2e659306cd6c',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa'
  ],
  audio: [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04',
    'https://images.unsplash.com/photo-1589903308904-1010c2294adc',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    'https://images.unsplash.com/photo-1478737270239-2f02b77fc618'
  ],
  video: [
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d',
    'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb',
    'https://images.unsplash.com/photo-1579547621869-0ddb5f237392',
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968'
  ],
  robotics: [
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb',
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e',
    'https://images.unsplash.com/photo-1527430253228-e93688616381'
  ],
  writing: [
    'https://images.unsplash.com/photo-1455390582262-044cdead277a',
    'https://images.unsplash.com/photo-1519791883288-dc8bd696e667',
    'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e'
  ],
  business: [
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
    'https://images.unsplash.com/photo-1552664730-d307ca884978',
    'https://images.unsplash.com/photo-1542435503-956c469947f6'
  ]
};

// All images flattened into a single global pool for maximum variance
const globalPool = Object.values(photoLibrary).flat();

/**
 * Gets a reliable, distinct Unsplash image URL for a given query.
 */
export const getUnsplashImage = async (query: string, width: number = 800, height: number = 400): Promise<string> => {
  const cleanQuery = query.toLowerCase().trim();

  // If a valid Unsplash API key is configured, fetch live random image
  if (HAS_VALID_KEY) {
    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(cleanQuery.slice(0, 30))}&orientation=landscape&client_id=${envAccessKey}`,
        { headers: { 'Accept-Version': 'v1' } }
      );

      if (response.ok) {
        const data = await response.json();
        return `${data.urls.raw}&w=${width}&h=${height}&fit=crop&q=80&fm=webp`;
      }
    } catch (e) {
      // Fallthrough to curated library
    }
  }

  // Detect specific topic keywords with word boundaries to avoid false positives (e.g. "career" matching "car")
  if (/\b(apple|macbook|iphone|mac)\b/i.test(cleanQuery)) matchedTopic = 'apple';
  else if (/\b(tesla|supercharger)\b/i.test(cleanQuery) || /\b(electric car|ev car)\b/i.test(cleanQuery)) matchedTopic = 'tesla';
  else if (/\b(chip|nvidia|intel|gpu|processor|hardware|semiconductor)\b/i.test(cleanQuery)) matchedTopic = 'chip';
  else if (/\b(robot|drone|robotics|automation)\b/i.test(cleanQuery)) matchedTopic = 'robotics';
  else if (/\b(code|coding|developer|programming|software)\b/i.test(cleanQuery)) matchedTopic = 'code';
  else if (/\b(data|chart|analytics|stat|statistics|database)\b/i.test(cleanQuery)) matchedTopic = 'data';
  else if (/\b(audio|sound|music|voice|speech|podcast)\b/i.test(cleanQuery)) matchedTopic = 'audio';
  else if (/\b(video|movie|cinema|film)\b/i.test(cleanQuery)) matchedTopic = 'video';
  else if (/\b(writing|article|blog|text|author)\b/i.test(cleanQuery)) matchedTopic = 'writing';
  else if (/\b(business|startup|company|innovation|market|economy|spain|argentina|tech)\b/i.test(cleanQuery)) matchedTopic = 'business';

  const pool = matchedTopic ? photoLibrary[matchedTopic] : globalPool;

  // Compute position hash from title/query string
  const hash = query.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
  const selectedUrl = pool[Math.abs(hash) % pool.length];

  return `${selectedUrl}?w=${width}&h=${height}&fit=crop&q=80&fm=webp`;
};

export const getUnsplashImageForNews = async (title: string, category: string): Promise<string> => {
  return getUnsplashImage(`${category} ${title}`, 800, 400);
};

export const getUnsplashImageForTool = async (toolName: string, category: string): Promise<string> => {
  return getUnsplashImage(`${category} ${toolName}`, 400, 250);
};
