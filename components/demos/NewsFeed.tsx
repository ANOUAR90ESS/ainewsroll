import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../../types';
import { Calendar, ExternalLink, Newspaper, Tag } from 'lucide-react';
import NewsModal from '../NewsModal';
import AdUnit from '../AdUnit';
import { trackNewsClick } from '../../services/analyticsService';

interface NewsFeedProps {
  articles: NewsArticle[];
}

const NewsFeed: React.FC<NewsFeedProps> = ({ articles }) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Check for article ID in URL params and open it on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('article');
    
    if (articleId && articles.length > 0) {
      const article = articles.find(a => a.id === articleId);
      if (article) {
        setSelectedArticle(article);
        trackNewsClick(article.title, article.source);
      }
    }
  }, [articles]);

  const openArticle = (article: NewsArticle) => {
    setSelectedArticle(article);
    trackNewsClick(article.title, article.source);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-end justify-between border-b border-zinc-800 pb-6">
        <div>
           <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
             <Newspaper className="w-8 h-8 text-purple-500" /> Latest News
           </h1>
           <p className="text-zinc-400">Insights, updates, and articles from the AI world.</p>
        </div>
      </div>

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
                <div className="aspect-video overflow-hidden bg-zinc-950 relative cursor-pointer" onClick={() => openArticle(article)}>
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    loading="lazy"
                    width="1280"
                    height="720"
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
                    <div className="aspect-video overflow-hidden bg-zinc-950 relative cursor-pointer" onClick={() => openArticle(article)}>
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        loading="lazy"
                        width="1280"
                        height="720"
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

      {selectedArticle && (
        <NewsModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  );
};

export default NewsFeed;