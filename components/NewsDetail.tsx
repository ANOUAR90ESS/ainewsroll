import React, { useMemo } from 'react';
import { Calendar, User, Tag, ArrowLeft, Share2, ExternalLink, List } from 'lucide-react';
import { NewsArticle } from '../types';
import SEO from './SEO';
import Breadcrumb from './Breadcrumb';
import AdUnit from './AdUnit';
import { getArticleAuthor, slugify } from '../utils/authors';
import { optimizeImageUrl } from '../utils/imageOptimizer';

interface NewsDetailProps {
  article: NewsArticle | null;
  onBack: () => void;
  onNavigate: (view: any, pageId?: string) => void;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ article, onBack, onNavigate }) => {
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      <SEO 
        title={`${seoTitle} | AI News-Roll`}
        description={seoDescription}
        ogImage={optimizedImgUrl}
        ogType="article"
        canonical={articleUrl}
        schema={schemas}
      />

      <div className="flex items-center justify-between mb-4">
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

      <Breadcrumb items={breadcrumbItems} onNavigate={onNavigate} />

      <article className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Banner Image */}
        <div className="relative h-64 md:h-96 w-full overflow-hidden">
          <img 
            src={optimizedImgUrl} 
            alt={article.title} 
            loading="eager"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>

        {/* Article Meta Header */}
        <div className="p-6 md:p-8 space-y-4 border-b border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-zinc-400">
            <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
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
              {author.arabicName} ({author.name})
            </button>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
            {article.title}
          </h1>
        </div>

        {/* Body content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Table of Contents */}
          {isLongArticle && headings.length > 0 && (
            <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 md:p-6 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base md:text-lg border-b border-zinc-800 pb-2">
                <List className="w-4 h-4 text-indigo-400" />
                <span>جدول المحتويات / Table of Contents</span>
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
                    {p}
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

          {/* Source Link */}
          {article.source && (
            <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Source / المصدر</p>
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
                  {author.arabicName} ({author.name})
                </h4>
                <p className="text-xs text-zinc-500 font-medium">{author.arabicRole} / {author.role}</p>
              </div>
              <button 
                onClick={() => onNavigate('AUTHOR' as any, author.id)}
                className="text-xs text-indigo-400 hover:underline font-semibold"
              >
                عرض كل المقالات / View all articles
              </button>
            </div>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
              {author.arabicBio}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};

export default NewsDetail;
