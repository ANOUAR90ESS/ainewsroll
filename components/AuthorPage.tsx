import React, { useMemo } from 'react';
import { Calendar, Tag, ExternalLink, ArrowLeft, Twitter, Github, Globe } from 'lucide-react';
import { NewsArticle } from '../types';
import SEO from './SEO';
import Breadcrumb from './Breadcrumb';
import { authors, getArticleAuthor, slugify } from '../utils/authors';
import { optimizeImageUrl } from '../utils/imageOptimizer';

interface AuthorPageProps {
  authorId: string | null;
  articles: NewsArticle[];
  onBack: () => void;
  onNavigate: (view: any, pageId?: string) => void;
}

const AuthorPage: React.FC<AuthorPageProps> = ({ authorId, articles, onBack, onNavigate }) => {
  const author = useMemo(() => {
    if (!authorId) return null;
    return authors.find(a => a.id === authorId || slugify(a.name) === authorId) || null;
  }, [authorId]);

  // Find all articles written by this author
  const authorArticles = useMemo(() => {
    if (!author) return [];
    return articles.filter(a => getArticleAuthor(a.id, a.title).id === author.id);
  }, [author, articles]);

  if (!author) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Author Not Found</h2>
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const optimizedAvatar = useMemo(() => optimizeImageUrl(author.avatar, 300), [author.avatar]);
  const authorUrl = `https://ainewsroll.space/author/${author.id}`;

  const breadcrumbItems = [
    { label: 'Authors' },
    { label: author.name }
  ];

  // Schema markup for breadcrumbs and author profile
  const schemas = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${authorUrl}#profile`,
        'url': authorUrl,
        'name': author.name,
        'description': author.bio,
        'mainEntity': {
          '@type': 'Person',
          'name': author.name,
          'image': optimizedAvatar,
          'jobTitle': author.role,
          'sameAs': [
            author.twitter || '',
            author.github || ''
          ].filter(Boolean)
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
            'name': author.name,
            'item': authorUrl
          }
        ]
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      <SEO 
        title={`${author.arabicName} | ${author.role} | AI News-Roll`}
        description={`${author.arabicName} - ${author.arabicBio.substring(0, 120)}...`}
        ogImage={optimizedAvatar}
        canonical={authorUrl}
        schema={schemas}
      />

      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <Breadcrumb items={breadcrumbItems} onNavigate={onNavigate} />

      {/* Author Bio Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl z-0" />
        
        <div className="relative z-10 shrink-0">
          <img 
            src={optimizedAvatar} 
            alt={author.name} 
            loading="eager"
            className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-indigo-500/50 object-cover shadow-xl"
          />
        </div>

        <div className="space-y-4 flex-1 text-center md:text-left relative z-10">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white">
              {author.arabicName}
            </h1>
            <p className="text-zinc-400 text-lg">{author.name}</p>
            <p className="text-sm text-indigo-400 font-medium uppercase tracking-wider">{author.arabicRole} / {author.role}</p>
          </div>

          <p className="text-zinc-300 leading-relaxed font-sans max-w-3xl">
            {author.arabicBio}
          </p>
          <p className="text-zinc-400 text-sm leading-relaxed font-sans max-w-3xl">
            {author.bio}
          </p>

          {/* Social Icons */}
          <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
            {author.twitter && (
              <a 
                href={author.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-indigo-400 transition-colors p-2 bg-zinc-950/50 rounded-lg border border-zinc-800"
                title="Twitter Profile"
              >
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {author.github && (
              <a 
                href={author.github} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-indigo-400 transition-colors p-2 bg-zinc-950/50 rounded-lg border border-zinc-800"
                title="GitHub Profile"
              >
                <Github className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Articles Section */}
      <div className="space-y-6 pt-6">
        <h2 className="text-xl md:text-2xl font-bold text-white border-b border-zinc-800 pb-4">
          مقالات بقلم الكاتب ({authorArticles.length}) / Articles by Author
        </h2>

        {authorArticles.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 bg-zinc-900/10 rounded-xl border border-zinc-800/40">
            No articles found by this author.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {authorArticles.map((article) => {
              const articleSlug = slugify(article.title);
              const optimizedArticleImg = optimizeImageUrl(article.imageUrl, 600);
              
              return (
                <div key={article.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all group flex flex-col h-full hover:shadow-xl hover:shadow-indigo-900/10">
                  <div 
                    className="aspect-video overflow-hidden bg-zinc-950 relative cursor-pointer" 
                    onClick={() => onNavigate('NEWS_DETAIL' as any, articleSlug)}
                  >
                    <img 
                      src={optimizedArticleImg} 
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100" 
                    />
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white border border-white/10 z-10">
                       {article.category || 'News'}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 pt-12">
                       <div className="flex items-center gap-2 text-xs text-zinc-300">
                         <Calendar className="w-3 h-3" />
                         {new Date(article.date).toLocaleDateString()}
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <h3 
                      className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors cursor-pointer"
                      onClick={() => onNavigate('NEWS_DETAIL' as any, articleSlug)}
                    >
                      {article.title}
                    </h3>
                    <p className="text-zinc-400 text-sm mb-4 line-clamp-3">
                      {article.description}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-zinc-800">
                       <div className="flex justify-between items-center mt-2">
                         <span className="text-xs font-semibold text-zinc-500 uppercase truncate max-w-[50%]">{article.source}</span>
                         <button 
                           onClick={() => onNavigate('NEWS_DETAIL' as any, articleSlug)}
                           className="text-indigo-400 text-xs font-medium flex items-center gap-1 hover:text-indigo-300 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full"
                         >
                           اقرأ المزيد / Read More <ExternalLink className="w-3 h-3" />
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorPage;
