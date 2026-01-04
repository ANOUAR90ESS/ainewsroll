/**
 * Unsplash Image Service
 * Provides free, high-quality images that never expire
 * Alternative to DALL-E for permanent image URLs
 */

const UNSPLASH_ACCESS_KEY = 'ZfG-8S_37xJt8yEUzqVqFAKEWpGsbbmNKLlzfPzKLDE'; // Public demo key

export const getUnsplashImage = async (query: string, width: number = 800, height: number = 400): Promise<string> => {
  try {
    // Clean the query for better results
    const cleanQuery = query
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 3) // Use only first 3 words
      .join(' ');

    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(cleanQuery)}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`,
      {
        headers: {
          'Accept-Version': 'v1'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Unsplash');
    }

    const data = await response.json();

    // Return optimized image URL with specific dimensions
    return `${data.urls.raw}&w=${width}&h=${height}&fit=crop&q=80`;
  } catch (error) {
    console.warn('Unsplash API failed, using placeholder:', error);
    // Fallback to a themed placeholder
    const seed = encodeURIComponent(query.slice(0, 20));
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
  }
};

export const getUnsplashImageForNews = async (title: string, category: string): Promise<string> => {
  // Extract key words from title for unique images
  const titleKeywords = title
    .split(' ')
    .filter(word => word.length > 4) // Only words longer than 4 chars
    .slice(0, 2) // Take first 2 keywords
    .join(' ');

  // Combine title keywords and category for unique, relevant results
  const searchQuery = titleKeywords ? `${titleKeywords} ${category}` : `${category} technology news`;
  return getUnsplashImage(searchQuery, 800, 400);
};

export const getUnsplashImageForTool = async (toolName: string, category: string): Promise<string> => {
  // Extract key words from tool name for unique images
  const toolKeywords = toolName
    .split(' ')
    .filter(word => word.length > 3)
    .slice(0, 2)
    .join(' ');

  // Combine tool name and category for relevant results
  const searchQuery = toolKeywords ? `${toolKeywords} ${category}` : `${category} technology`;
  return getUnsplashImage(searchQuery, 400, 250);
};
