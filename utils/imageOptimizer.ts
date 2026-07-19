/**
 * Optimizes external Unsplash URLs to use WebP format and correct width constraints.
 * This dramatically reduces bandwidth usage and increases page load speed.
 */
export const optimizeImageUrl = (url: string, width: number = 800): string => {
  if (!url) return '';
  
  // If it's a data URL (like base64 generated images), return as-is
  if (url.startsWith('data:')) {
    return url;
  }
  
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('fm', 'webp');
      urlObj.searchParams.set('q', '75'); // Balanced compression quality
      return urlObj.toString();
    } catch (e) {
      // Fallback string-based parsing if URL parsing fails
      let optimized = url;
      if (optimized.includes('w=')) {
        optimized = optimized.replace(/w=\d+/, `w=${width}`);
      } else {
        optimized += `&w=${width}`;
      }
      if (optimized.includes('q=')) {
        optimized = optimized.replace(/q=\d+/, 'q=75');
      } else {
        optimized += '&q=75';
      }
      if (!optimized.includes('fm=')) {
        optimized += '&fm=webp';
      } else {
        optimized = optimized.replace(/fm=\w+/, 'fm=webp');
      }
      return optimized;
    }
  }
  return url;
};
