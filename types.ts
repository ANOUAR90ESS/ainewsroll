import { LiveServerMessage, Modality } from "@google/genai";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: string;
  imageUrl: string;
  website: string;
  // Extended details for ToolDetail page
  how_to_use?: string;  // Step-by-step guide
  features_detailed?: string;  // Detailed feature breakdown
  use_cases?: string;  // Common use cases and examples
  pros_cons?: string;  // Pros and cons
  screenshots_urls?: string[];  // Array of screenshot URLs
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  content: string;
  source: string;
  date: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export enum AppView {
  HOME = 'HOME',
  SMART_CHAT = 'SMART_CHAT',
  LATEST_NEWS = 'LATEST_NEWS',
  ANALYTICS = 'ANALYTICS',
  ADMIN = 'ADMIN',
  PAGES = 'PAGES',
  PAYMENT = 'PAYMENT',
  FAVORITES = 'FAVORITES',
  CATEGORY = 'CATEGORY',
  TOOL_DETAIL = 'TOOL_DETAIL'
}

export interface UserFavorite {
  id: string;
  user_id: string;
  tool_id: string;
  created_at: string;
}

export interface ToolReview {
  id: string;
  user_id: string;
  tool_id: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
  user_email?: string; // Populated from join
}

export interface ToolRatingSummary {
  tool_id: string;
  review_count: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingUrls?: Array<{ uri: string; title: string }>;
}

export interface Slide {
  title: string;
  content: string[];
}

export interface Forum {
  id: string;
  tool_id: string;
  title: string;
  description: string;
  created_at: string;
  created_by?: string;
}

export interface ForumPost {
  id: string;
  forum_id: string;
  user_id: string;
  user_email?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Global window extension for AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    webkitAudioContext: typeof AudioContext;
    aistudio?: AIStudio;
  }
}