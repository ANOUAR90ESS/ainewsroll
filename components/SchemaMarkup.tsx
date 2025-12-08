import React from 'react';

// JSON-LD Schema markup components for SEO

export const OrganizationSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'AI News-Roll',
    'url': 'https://ainewsroll.space',
    'logo': 'https://ainewsroll.space/android-chrome-512x512.png',
    'description': 'Discover the latest AI tools and breaking AI news. Your gateway to the next generation of AI technologies.',
    'sameAs': [
      'https://twitter.com/ainewsroll',
      'https://github.com/ANOUAR90ESS'
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': '+1-XXX-XXX-XXXX',
      'contactType': 'Customer Service',
      'email': 'support@ainewsroll.space'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const WebSiteSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'AI News-Roll',
    'url': 'https://ainewsroll.space',
    'description': 'AI tools directory and news platform powered by Google Gemini',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': 'https://ainewsroll.space/?search={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const NewsArticleSchema = (props: {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  author?: string;
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': props.headline,
    'description': props.description,
    'image': props.image || 'https://ainewsroll.space/android-chrome-512x512.png',
    'datePublished': props.datePublished,
    'author': {
      '@type': 'Organization',
      'name': props.author || 'AI News-Roll',
      'url': 'https://ainewsroll.space'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const BreadcrumbSchema = (props: {
  items: Array<{ name: string; url: string }>;
}) => {
  const itemListElement = props.items.map((item, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': item.name,
    'item': item.url
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': itemListElement
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const FAQSchema = (props: {
  faqs: Array<{ question: string; answer: string }>;
}) => {
  const mainEntity = props.faqs.map(faq => ({
    '@type': 'Question',
    'name': faq.question,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': faq.answer
    }
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': mainEntity
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default {
  OrganizationSchema,
  WebSiteSchema,
  NewsArticleSchema,
  BreadcrumbSchema,
  FAQSchema
};
