import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonical?: string;
  schema?: any;
}

const SEO: React.FC<SEOProps> = ({
  title = 'AI Tool Directory & Latest AI News | AI News-Roll',
  description = 'Discover 1000+ AI tools, breaking AI news, and industry insights. Your complete guide to artificial intelligence, machine learning, and generative AI solutions.',
  keywords = 'AI tools directory, artificial intelligence, AI news, machine learning, generative AI, AI software, AI applications, best AI tools, AI directory',
  ogImage = 'https://ainewsroll.space/og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonical,
  schema
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
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('language', 'English');
    setMetaTag('author', 'AI News-Roll');

    // Open Graph tags
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:image', ogImage, 'property');
    setMetaTag('og:type', ogType, 'property');
    setMetaTag('og:url', canonical || window.location.href, 'property');
    setMetaTag('og:site_name', 'AI News-Roll', 'property');
    setMetaTag('og:locale', 'en_US', 'property');

    // Twitter Card tags
    setMetaTag('twitter:card', twitterCard);
    setMetaTag('twitter:site', '@ainewsroll');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);

    // Additional SEO meta tags
    setMetaTag('theme-color', '#1a1a1a');

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

    // Add JSON-LD schema markup
    if (schema) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;

      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }

      scriptElement.innerHTML = JSON.stringify(schema);
    }
  }, [title, description, keywords, ogImage, ogType, twitterCard, canonical, schema]);

  return null;
};

export default SEO;
