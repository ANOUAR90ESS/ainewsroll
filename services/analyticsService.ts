import React, { useEffect } from 'react';

/**
 * Google Analytics 4 Integration
 * Tracks user interactions and traffic patterns for SEO insights
 */

export const GA4_MEASUREMENT_ID = 'G-81P94TP3VF';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const initializeGA4 = () => {
  if (typeof window === 'undefined') return;

  // Add GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', GA4_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    page_title: document.title
  });

  window.gtag = gtag;
};

/**
 * Track custom events for SEO insights
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track page view
 */
export const trackPageView = (title: string, path: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: title,
      page_path: path
    });
  }
};

/**
 * Track tool click/interaction
 */
export const trackToolInteraction = (toolName: string, toolCategory: string) => {
  trackEvent('tool_interaction', {
    tool_name: toolName,
    tool_category: toolCategory,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track search event
 */
export const trackSearch = (searchQuery: string, resultsCount: number) => {
  trackEvent('search', {
    search_term: searchQuery,
    results_count: resultsCount
  });
};

/**
 * Track news article click
 */
export const trackNewsClick = (articleTitle: string, articleSource: string) => {
  trackEvent('news_click', {
    article_title: articleTitle,
    article_source: articleSource
  });
};

/**
 * Track chat interaction
 */
export const trackChatMessage = (messageLength: number) => {
  trackEvent('chat_message', {
    message_length: messageLength,
    timestamp: new Date().toISOString()
  });
};

/**
 * GA4 Hook for automatic initialization
 */
export const useGA4 = () => {
  useEffect(() => {
    initializeGA4();
  }, []);
};

export default {
  initializeGA4,
  trackEvent,
  trackPageView,
  trackToolInteraction,
  trackSearch,
  trackNewsClick,
  trackChatMessage,
  useGA4
};
