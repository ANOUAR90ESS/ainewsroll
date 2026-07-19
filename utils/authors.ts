export interface Author {
  id: string;
  name: string;
  arabicName: string;
  avatar: string;
  bio: string;
  arabicBio: string;
  role: string;
  arabicRole: string;
  twitter?: string;
  github?: string;
}

export const authors: Author[] = [
  {
    id: 'anas-al-sharif',
    name: 'Anas Al-Sharif',
    arabicName: 'أنس الشريف',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80&fm=webp',
    role: 'Senior AI Journalist',
    arabicRole: 'صحفي متخصص في الذكاء الاصطناعي',
    bio: 'Anas is a senior technology journalist covering the latest developments in generative AI, neural networks, and robotics. Formerly tech editor at major Middle East publishers.',
    arabicBio: 'أنس هو صحفي تقني متخصص يغطي أحدث التطورات في مجالات الذكاء الاصطناعي التوليدي، الشبكات العصبية، والروبوتات. عمل سابقاً كمحرر تقني في كبرى المنصات الإعلامية.',
    twitter: 'https://twitter.com/anas_tech',
    github: 'https://github.com/anas-tech'
  },
  {
    id: 'sara-ahmed',
    name: 'Sara Ahmed',
    arabicName: 'سارة أحمد',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80&fm=webp',
    role: 'AI Research Analyst',
    arabicRole: 'محللة أبحاث الذكاء الاصطناعي',
    bio: 'Sara focuses on machine learning architectures and NLP advancements. She holds a Master\'s degree in Computer Science and loves explaining complex technical concepts.',
    arabicBio: 'سارة تركز على بنية نماذج تعلم الآلة وتطورات معالجة اللغات الطبيعية. تحمل درجة الماجستير في علوم الحاسوب وشغوفة بتبسيط المفاهيم التقنية المعقدة.',
    twitter: 'https://twitter.com/sara_ai_research'
  },
  {
    id: 'youssef-al-qahtani',
    name: 'Youssef Al-Qahtani',
    arabicName: 'يوسف القحطاني',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&q=80&fm=webp',
    role: 'Tech Startup Analyst',
    arabicRole: 'محلل الشركات التقنية الناشئة',
    bio: 'Youssef is an entrepreneur and market analyst tracking how AI is redefining modern business models, startups, and product design.',
    arabicBio: 'يوسف رائد أعمال ومحلل اقتصادي يتابع كيف يعيد الذكاء الاصطناعي صياغة نماذج الأعمال الحديثة، الشركات الناشئة، وتصميم المنتجات.',
    twitter: 'https://twitter.com/youssef_startup',
    github: 'https://github.com/youssef-dev'
  }
];

/**
 * Consistently assigns an author to a news article based on a hash of its title/id.
 */
export const getArticleAuthor = (articleId: string, articleTitle: string): Author => {
  const seed = articleId + articleTitle;
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return authors[hash % authors.length];
};

/**
 * Simple helper to slugify text (handles both Arabic and English text)
 */
export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')                     // Replace spaces with -
    .replace(/[^\w\u0621-\u064A-]+/g, '')     // Keep alphanumeric, arabic characters, and hyphens
    .replace(/--+/g, '-')                     // Replace multiple - with single -
    .replace(/^-+/, '')                       // Trim - from start
    .replace(/-+$/, '');                      // Trim - from end
};
