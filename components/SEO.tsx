import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonical?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'AI Tool Directory | AI News-Roll',
  description = 'Discover the latest AI tools and breaking AI news. Your comprehensive directory for AI-powered solutions.',
  keywords = 'AI tools, artificial intelligence, AI news, machine learning, AI directory, generative AI',
  ogImage = 'https://ainewsroll.space/og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonical
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to set or update meta tag
    const setMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }

      element.content = content;
    };

    // Basic meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);

    // Open Graph tags
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:image', ogImage, 'property');
    setMetaTag('og:type', ogType, 'property');
    setMetaTag('og:url', canonical || window.location.href, 'property');
    setMetaTag('og:site_name', 'AI News-Roll', 'property');

    // Twitter Card tags
    setMetaTag('twitter:card', twitterCard);
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);

    // Canonical URL
    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.rel = 'canonical';
        document.head.appendChild(linkElement);
      }

      linkElement.href = canonical;
    }
  }, [title, description, keywords, ogImage, ogType, twitterCard, canonical]);

  return null;
};

export default SEO;
