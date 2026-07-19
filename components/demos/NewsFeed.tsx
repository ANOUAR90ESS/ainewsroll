import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewsArticle } from '../../types';
import { Calendar, ExternalLink, Newspaper } from 'lucide-react';
import AdUnit from '../AdUnit';
import { trackNewsClick } from '../../services/analyticsService';
import { slugify } from '../../utils/authors';
import { optimizeImageUrl } from '../../utils/imageOptimizer';

interface NewsFeedProps {
  articles: NewsArticle[];
  categoryTitle?: string;
}

const newsFallbackImages: Record<string, string[]> = {
  apple: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52d9?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1280&h=720&fit=crop&q=80'
  ],
  tesla: [
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1280&h=720&fit=crop&q=80'
  ],
  chip: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1591799264318-7e6e29868606?w=1280&h=720&fit=crop&q=80'
  ],
  Robotics: [
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=1280&h=720&fit=crop&q=80'
  ],
  Startups: [
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1280&h=720&fit=crop&q=80'
  ],
  default: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&h=720&fit=crop&q=80'
  ]
};

const getNewsCardImage = (imageUrl: string | undefined, category: string, title: string) => {
  if (imageUrl && !imageUrl.includes('source.unsplash.com') && !imageUrl.includes('picsum.photos')) {
    return optimizeImageUrl(imageUrl, 800);
  }
  const cleanTitle = (title || '').toLowerCase();
  let topic = 'default';
  if (cleanTitle.includes('apple') || cleanTitle.includes('macbook')) topic = 'apple';
  else if (cleanTitle.includes('tesla') || cleanTitle.includes('supercharger') || cleanTitle.includes('ev')) topic = 'tesla';
  else if (cleanTitle.includes('chip') || cleanTitle.includes('intel') || cleanTitle.includes('nvidia') || cleanTitle.includes('hardware')) topic = 'chip';
  else if (newsFallbackImages[category]) topic = category;

  const pool = newsFallbackImages[topic] || newsFallbackImages.default;
  const hash = (title || 'news').split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
  return optimizeImageUrl(pool[Math.abs(hash) % pool.length], 800);
};

import RssWidget from '../RssWidget';

const NewsFeed: React.FC<NewsFeedProps> = ({ articles, categoryTitle }) => {
  const navigate = useNavigate();

  const openArticle = (article: NewsArticle) => {
    const slug = slugify(article.title);
    trackNewsClick(article.title, article.source);
    navigate(`/news/${slug}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      <div className="flex items-end justify-between border-b border-zinc-800 pb-6">
        <div>
           <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
             <Newspaper className="w-8 h-8 text-purple-500" /> {categoryTitle ? `${categoryTitle}` : 'Latest News'}
           </h1>
           <p className="text-zinc-400">
             {categoryTitle 
               ? `Aggregated articles and updates about ${categoryTitle}.`
               : 'Insights, updates, and articles from the AI world.'}
           </p>
        </div>
      </div>

      {/* RSS.app Magazine Feed Widget */}
      <RssWidget widgetId="7IXKQzxknDfEuBCS" />

      {articles.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
          <Newspaper className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-zinc-300">No news yet</h3>
          <p className="text-zinc-500 mt-2">Check back later or add news via the Admin Dashboard.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.slice(0, 3).map((article) => (
              <div key={article.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group flex flex-col h-full hover:shadow-xl hover:shadow-purple-900/10">
                <div className="h-64 sm:h-72 md:h-60 w-full overflow-hidden bg-zinc-950 relative cursor-pointer" onClick={() => openArticle(article)}>
                  <img 
                    src={getNewsCardImage(article.imageUrl, article.category, article.title)} 
                    alt={article.title}
                    loading="lazy"
                    width="1280"
                    height="720"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
                    onError={(e) => {
                      e.currentTarget.src = getNewsCardImage('', article.category, article.title);
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-xs font-medium text-white border border-white/10 z-10">
                     {article.category || 'News'}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 pt-12">
                     <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                       <Calendar className="w-3.5 h-3.5 text-purple-400" />
                       {new Date(article.date).toLocaleDateString()}
                     </div>
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h3 
                    className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors cursor-pointer"
                    onClick={() => openArticle(article)}
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
                         onClick={() => openArticle(article)}
                         className="text-purple-400 text-sm font-medium flex items-center gap-1 hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-full"
                       >
                         Read More <ExternalLink className="w-3 h-3" />
                       </button>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ad after first 3 articles */}
          {articles.length > 3 && (
            <div className="flex justify-center">
              <AdUnit format="horizontal" />
            </div>
          )}

          {/* Remaining articles */}
          {articles.length > 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.slice(3).map((article, idx) => (
                <React.Fragment key={article.id}>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group flex flex-col h-full hover:shadow-xl hover:shadow-purple-900/10">
                    <div className="h-64 sm:h-72 md:h-60 w-full overflow-hidden bg-zinc-950 relative cursor-pointer" onClick={() => openArticle(article)}>
                      <img 
                        src={getNewsCardImage(article.imageUrl, article.category, article.title)} 
                        alt={article.title}
                        loading="lazy"
                        width="1280"
                        height="720"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
                        onError={(e) => {
                          e.currentTarget.src = getNewsCardImage('', article.category, article.title);
                        }}
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
                        className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors cursor-pointer"
                        onClick={() => openArticle(article)}
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
                             onClick={() => openArticle(article)}
                             className="text-purple-400 text-sm font-medium flex items-center gap-1 hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-full"
                           >
                             Read More <ExternalLink className="w-3 h-3" />
                           </button>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ad every 3 articles after the first set */}
                  {(idx + 1) % 3 === 0 && idx < articles.length - 4 && (
                    <div className="col-span-full flex justify-center">
                      <AdUnit format="horizontal" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;