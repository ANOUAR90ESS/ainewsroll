/**
 * Unsplash Image Service
 * Provides high-quality, high-speed images from Unsplash CDN.
 * Avoids 401 Unauthorized errors by serving curated Unsplash CDN URLs when no valid API key is present.
 */

// Safe check for optional client API key in environment
const envAccessKey = typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY
  : undefined;

const HAS_VALID_KEY = Boolean(envAccessKey && !envAccessKey.includes('FAKE'));

// Curated high-resolution Unsplash CDN images mapped by topic/category
const curatedCategoryImages: Record<string, string[]> = {
  writing: [
    'https://images.unsplash.com/photo-1455390582262-044cdead277a',
    'https://images.unsplash.com/photo-1519791883288-dc8bd696e667',
    'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e'
  ],
  image: [
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968',
    'https://images.unsplash.com/photo-1561998338-13ad7883b20f',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe'
  ],
  video: [
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d',
    'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb',
    'https://images.unsplash.com/photo-1579547621869-0ddb5f237392'
  ],
  code: [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713'
  ],
  data: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    'https://images.unsplash.com/photo-1543286386-2e659306cd6c'
  ],
  education: [
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173'
  ],
  audio: [
    'https://images.unsplash.com/photo-1589903308904-1010c2294adc',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04',
    'https://images.unsplash.com/photo-1487180144351-b8472da7d491'
  ],
  business: [
    'https://images.unsplash.com/photo-1552664730-d307ca884978',
    'https://images.unsplash.com/photo-1542435503-956c469947f6',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d'
  ],
  default: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
    'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1'
  ]
};

/**
 * Gets a reliable Unsplash image URL for a given query.
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
      // Fallthrough to curated CDN URLs
    }
  }

  // Fallback: Pick a curated Unsplash CDN image based on query match and hash
  let categoryKey = 'default';
  for (const key of Object.keys(curatedCategoryImages)) {
    if (cleanQuery.includes(key)) {
      categoryKey = key;
      break;
    }
  }

  const pool = curatedCategoryImages[categoryKey] || curatedCategoryImages.default;
  const hash = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedUrl = pool[hash % pool.length];

  return `${selectedUrl}?w=${width}&h=${height}&fit=crop&q=80&fm=webp`;
};

export const getUnsplashImageForNews = async (title: string, category: string): Promise<string> => {
  const titleKeywords = title
    .split(' ')
    .filter(word => word.length > 4)
    .slice(0, 2)
    .join(' ');

  const searchQuery = titleKeywords ? `${category} ${titleKeywords}` : `${category} technology`;
  return getUnsplashImage(searchQuery, 800, 400);
};

export const getUnsplashImageForTool = async (toolName: string, category: string): Promise<string> => {
  const searchQuery = `${category} ${toolName}`;
  return getUnsplashImage(searchQuery, 400, 250);
};
