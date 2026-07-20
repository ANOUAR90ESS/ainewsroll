import React, { useMemo } from 'react';
import { Calendar, User, Tag, ArrowLeft, Share2, ExternalLink, List, Sparkles, Hash } from 'lucide-react';
import { NewsArticle } from '../types';
import SEO from './SEO';
import Breadcrumb from './Breadcrumb';
import AdUnit from './AdUnit';
import NewsletterWidget from './NewsletterWidget';
import { getArticleAuthor, slugify } from '../utils/authors';
import { optimizeImageUrl } from '../utils/imageOptimizer';

interface NewsDetailProps {
  article: NewsArticle | null;
  allArticles?: NewsArticle[];
  onBack: () => void;
  onNavigate: (view: any, pageId?: string) => void;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ article, allArticles = [], onBack, onNavigate }) => {
  if (!article) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Article Not Found</h2>
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const author = useMemo(() => getArticleAuthor(article.id, article.title), [article.id, article.title]);
  const articleSlug = useMemo(() => slugify(article.title), [article.title]);
  const articleUrl = `https://ainewsroll.space/news/${articleSlug}`;

  // Optimize image URL for page speed (WebP format, width 1200) with robust fallback
  const optimizedImgUrl = useMemo(() => {
    if (article.imageUrl && !article.imageUrl.includes('source.unsplash.com') && !article.imageUrl.includes('picsum.photos')) {
      return optimizeImageUrl(article.imageUrl, 1200);
    }
    const pool = [
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?w=1280&h=720&fit=crop&q=80'
    ];
    const hash = (article.title || 'news').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return optimizeImageUrl(pool[hash % pool.length], 1200);
  }, [article.imageUrl, article.title]);
  const optimizedAuthorImg = useMemo(() => optimizeImageUrl(author.avatar, 200), [author.avatar]);

  // Split content by paragraphs
  const paragraphs = useMemo(() => {
    return article.content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }, [article.content]);

  // Extract headings for Table of Contents
  const headings = useMemo(() => {
    const headingList: { id: string; text: string; level: number }[] = [];
    const lines = article.content.split('\n');
    let headingIndex = 0;

    lines.forEach((line) => {
      // Matches markdown headings e.g. ## Heading or ### Heading
      const match = line.match(/^(#{2,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[*_`]/g, '').trim();
        const id = `heading-${headingIndex++}`;
        headingList.push({ id, text, level });
      }
    });

    return headingList;
  }, [article.content]);

  // Calculate recommended articles (same category or latest articles)
  const recommendedArticles = useMemo(() => {
    if (!allArticles || allArticles.length <= 1 || !article) return [];

    const otherArticles = allArticles.filter(a => a.id !== article.id);

    // Prefer articles in the same category
    const sameCategory = otherArticles.filter(a =>
      a.category && article.category &&
      a.category.toLowerCase().trim() === article.category.toLowerCase().trim()
    );

    const combined = [...sameCategory];
    for (const item of otherArticles) {
      if (combined.length >= 3) break;
      if (!combined.some(c => c.id === item.id)) {
        combined.push(item);
      }
    }

    return combined.slice(0, 3);
  }, [allArticles, article]);

  // Extract and format hashtags
  const hashtags = useMemo(() => {
    const defaultTags = ['AI', 'TechNews', 'GenerativeAI'];
    if (article.category) {
      defaultTags.unshift(article.category.replace(/\s+/g, ''));
    }
    const text = (article.title + ' ' + article.description).toLowerCase();
    if (text.includes('chatgpt') || text.includes('gpt')) defaultTags.push('ChatGPT');
    if (text.includes('gemini') || text.includes('google')) defaultTags.push('GoogleGemini');
    if (text.includes('openai')) defaultTags.push('OpenAI');
    if (text.includes('midjourney')) defaultTags.push('Midjourney');
    if (text.includes('robot') || text.includes('robotics')) defaultTags.push('Robotics');
    if (text.includes('claude') || text.includes('anthropic')) defaultTags.push('ClaudeAI');
    return Array.from(new Set(defaultTags));
  }, [article.category, article.title, article.description]);

  // Helper for smart internal tool linking
  const renderSmartContent = (text: string) => {
    const keywordsMap: Record<string, string> = {
      'ChatGPT': 'chatgpt',
      'Google Gemini': 'google-gemini',
      'Gemini': 'google-gemini',
      'OpenAI': 'openai',
      'Midjourney': 'ai-tools',
      'Claude': 'ai-tools'
    };

    const regex = new RegExp(`\\b(${Object.keys(keywordsMap).join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      const matchedKey = Object.keys(keywordsMap).find(k => k.toLowerCase() === part.toLowerCase());
      if (matchedKey) {
        const catSlug = keywordsMap[matchedKey];
        return (
          <span
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('NEWS_CATEGORY' as any, catSlug);
            }}
            className="text-indigo-400 font-semibold underline decoration-indigo-500/40 underline-offset-4 hover:text-indigo-300 hover:decoration-indigo-400 cursor-pointer transition-all px-1 bg-indigo-500/10 rounded"
            title={`Explorar noticias de ${matchedKey}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const isLongArticle = article.content.length > 1000 || paragraphs.length >= 4;

  const handleShare = async () => {
    const text = `${article.title} - AI News-Roll`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: text,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share failed');
      }
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Article link copied to clipboard!');
      });
    }
  };

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'News', view: 'LATEST_NEWS' as any },
    { label: article.title }
  ];

  // Unique Title (< 60 chars) and Description (140-160 chars) for SEO
  const seoTitle = article.title.length > 55 ? `${article.title.substring(0, 55)}...` : article.title;
  const seoDescription = article.description.length > 150 
    ? `${article.description.substring(0, 150)}...`
    : article.description.length >= 140 
      ? article.description
      : `${article.description} Read the full article about ${article.title} on AI News-Roll directory.`;

  // Merge NewsArticle and BreadcrumbList schemas into an advanced @graph
  const schemas = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        '@id': `${articleUrl}#article`,
        'isPartOf': {
          '@type': 'WebPage',
          '@id': articleUrl,
          'url': articleUrl,
          'name': article.title
        },
        'headline': article.title,
        'description': article.description,
        'image': [optimizedImgUrl],
        'datePublished': article.date || new Date().toISOString(),
        'dateModified': article.date || new Date().toISOString(),
        'author': {
          '@type': 'Person',
          'name': author.name,
          'jobTitle': author.role,
          'sameAs': author.twitter ? [author.twitter] : []
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'AI News-Roll',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://ainewsroll.space/android-chrome-512x512.png'
          }
        }
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://ainewsroll.space'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'News',
            'item': 'https://ainewsroll.space/news'
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': article.title,
            'item': articleUrl
          }
        ]
      }
    ]
  };

  const isSourceUrl = article.source?.startsWith('http://') || article.source?.startsWith('https://');
  const displaySource = isSourceUrl 
    ? new URL(article.source).hostname.replace('www.', '') 
    : article.source;

  return (
    <div className="max-w-4xl mx-auto px-1 sm:px-4 md:px-8 py-2 sm:py-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      <SEO 
        title={`${seoTitle} | AI News-Roll`}
        description={seoDescription}
        ogImage={optimizedImgUrl}
        ogType="article"
        canonical={articleUrl}
        schema={schemas}
      />

      <div className="flex items-center justify-between px-2 sm:px-0 mb-2">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to News
        </button>
        <button 
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      <div className="px-2 sm:px-0">
        <Breadcrumb items={breadcrumbItems} onNavigate={onNavigate} />
      </div>

      <article className="bg-transparent sm:bg-zinc-900/40 border-0 sm:border border-zinc-800 rounded-none sm:rounded-2xl overflow-hidden sm:shadow-2xl">
        {/* Banner Image */}
        <div className="relative w-full aspect-video overflow-hidden rounded-2xl sm:rounded-none bg-zinc-950">
          <img 
            src={optimizedImgUrl} 
            alt={article.title} 
            loading="eager"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>

        {/* Article Meta Header */}
        <div className="px-2 sm:px-6 md:px-8 py-4 sm:py-6 space-y-3 sm:space-y-4 border-b border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs md:text-sm text-zinc-400">
            <span className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-white/10">
              <Calendar className="w-3.5 h-3.5" /> 
              {new Date(article.date).toLocaleDateString()}
            </span>
            {article.category && (
              <span className="flex items-center gap-1.5 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 text-purple-400 font-medium">
                <Tag className="w-3.5 h-3.5" /> 
                {article.category}
              </span>
            )}
            <button 
              onClick={() => onNavigate('AUTHOR' as any, author.id)}
              className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 text-indigo-400"
            >
              <User className="w-3.5 h-3.5" />
              {author.name}
            </button>
          </div>

          <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white leading-snug sm:leading-tight">
            {article.title}
          </h1>
        </div>

        {/* Body content */}
        <div className="px-2 sm:px-6 md:px-8 py-4 sm:py-6 space-y-6">
          {/* Table of Contents */}
          {isLongArticle && headings.length > 0 && (
            <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 md:p-6 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base md:text-lg border-b border-zinc-800 pb-2">
                <List className="w-4 h-4 text-indigo-400" />
                <span>Table of Contents</span>
              </div>
              <ul className="space-y-2 text-sm text-zinc-400">
                {headings.map((heading) => (
                  <li 
                    key={heading.id} 
                    style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    <a 
                      href={`#${heading.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <span className="text-indigo-500">▪</span>
                      <span>{heading.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Paragraphs and Inline Ads */}
          <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed font-sans space-y-6">
            {paragraphs.map((p, index) => {
              // Check if paragraph is markdown heading
              const isHeading = p.trim().startsWith('##');
              if (isHeading) {
                // Find matching heading ID
                const match = p.match(/^(#{2,4})\s+(.+)$/);
                const text = match ? match[2].replace(/[*_`]/g, '').trim() : p;
                const headingIndex = headings.findIndex(h => h.text === text);
                const headingId = headingIndex !== -1 ? headings[headingIndex].id : `heading-unidentified-${index}`;
                const level = match ? match[1].length : 2;

                if (level === 2) {
                  return (
                    <h2 key={index} id={headingId} className="text-xl md:text-2xl font-bold text-white pt-4 pb-2 border-b border-zinc-800/50">
                      {text}
                    </h2>
                  );
                } else {
                  return (
                    <h3 key={index} id={headingId} className="text-lg md:text-xl font-bold text-white pt-2 pb-1">
                      {text}
                    </h3>
                  );
                }
              }

              // Normal Paragraph
              return (
                <React.Fragment key={index}>
                  <p className="text-base md:text-lg whitespace-pre-wrap font-light tracking-wide">
                    {renderSmartContent(p)}
                  </p>

                  {/* Ad placement logic */}
                  {/* Ad 1: After first paragraph */}
                  {index === 0 && (
                    <AdUnit format="horizontal" className="my-6 border-y border-zinc-800/40 py-2" />
                  )}

                  {/* Ad 2: In the middle of the article */}
                  {paragraphs.length >= 5 && index === Math.floor(paragraphs.length / 2) && (
                    <AdUnit format="horizontal" className="my-6 border-y border-zinc-800/40 py-2" />
                  )}
                </React.Fragment>
              );
            })}

            {/* Ad 3: Before comments / end of article */}
            <AdUnit format="horizontal" className="my-6 border-y border-zinc-800/40 py-2" />
          </div>

          {/* Hashtags Section */}
          {hashtags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span>Etiquetas / Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const tagClean = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
                      onNavigate('NEWS_CATEGORY' as any, tagClean || 'ai-tools');
                    }}
                    className="px-3 py-1.5 bg-zinc-800/80 hover:bg-indigo-600/30 text-zinc-300 hover:text-indigo-300 rounded-full text-xs border border-zinc-700/80 hover:border-indigo-500/50 transition-all font-medium"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Source Link */}
          {article.source && (
            <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Source</p>
              {isSourceUrl ? (
                <a 
                  href={article.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm transition-colors border border-zinc-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit {displaySource}
                </a>
              ) : (
                <p className="text-sm text-zinc-300">{article.source}</p>
              )}
            </div>
          )}

          {/* Newsletter Subscription Widget */}
          <div className="mt-10 pt-4">
            <NewsletterWidget variant="card" />
          </div>
        </div>

        {/* Author Bio Card at Bottom */}
        <div className="p-6 md:p-8 bg-zinc-950/40 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <img 
            src={optimizedAuthorImg} 
            alt={author.name} 
            loading="lazy"
            className="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover shrink-0 cursor-pointer"
            onClick={() => onNavigate('AUTHOR' as any, author.id)}
          />
          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 
                  className="font-bold text-white text-base hover:text-indigo-400 transition-colors cursor-pointer"
                  onClick={() => onNavigate('AUTHOR' as any, author.id)}
                >
                  {author.name}
                </h4>
                <p className="text-xs text-zinc-500 font-medium">{author.role}</p>
              </div>
              <button 
                onClick={() => onNavigate('AUTHOR' as any, author.id)}
                className="text-xs text-indigo-400 hover:underline font-semibold"
              >
                View all articles
              </button>
            </div>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
              {author.bio}
            </p>
          </div>
        </div>
      </article>

      {/* Recommended Articles Section */}
      {recommendedArticles.length > 0 && (
        <section className="mt-12 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Recommended Articles
            </h3>
            <button
              onClick={() => onNavigate('LATEST_NEWS' as any)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1"
            >
              View All &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedArticles.map((recArticle) => {
              const recImg = optimizeImageUrl(recArticle.imageUrl || '', 600);
              const recSlug = slugify(recArticle.title);
              return (
                <div
                  key={recArticle.id}
                  onClick={() => {
                    onNavigate('NEWS_DETAIL' as any, recSlug);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer flex flex-col h-full hover:shadow-xl hover:shadow-indigo-900/10"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                    <img
                      src={recImg}
                      alt={recArticle.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=337&fit=crop&q=80';
                      }}
                    />
                    {recArticle.category && (
                      <span className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-purple-300 border border-purple-500/30">
                        {recArticle.category}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1 justify-between space-y-3">
                    <h4 className="font-bold text-white text-sm md:text-base line-clamp-2 group-hover:text-indigo-400 transition-colors leading-snug">
                      {recArticle.title}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {recArticle.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800/80">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {new Date(recArticle.date).toLocaleDateString()}
                      </span>
                      <span className="text-indigo-400 font-semibold group-hover:underline">
                        Read More &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default NewsDetail;
