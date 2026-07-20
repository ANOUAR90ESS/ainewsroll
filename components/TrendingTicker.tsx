import React, { useState } from 'react';
import { Flame, TrendingUp, ChevronRight } from 'lucide-react';
import { NewsArticle } from '../types';
import { slugify } from '../utils/authors';

interface TrendingTickerProps {
  articles: NewsArticle[];
  onSelectArticle: (slug: string) => void;
}

const TrendingTicker: React.FC<TrendingTickerProps> = ({ articles, onSelectArticle }) => {
  const [isPaused, setIsPaused] = useState(false);

  if (!articles || articles.length === 0) return null;

  const tickerArticles = articles.slice(0, 6);

  return (
    <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-zinc-900/60 border-b border-zinc-800/80 text-xs px-3 py-1.5 flex items-center gap-3 overflow-hidden select-none">
      {/* Badge */}
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold px-2.5 py-0.5 rounded-full shrink-0 shadow-sm shadow-red-900/20 text-[11px] uppercase tracking-wider">
        <Flame className="w-3.5 h-3.5 animate-pulse" />
        <span>Trending Now</span>
      </div>

      {/* Marquee Container */}
      <div 
        className="flex-1 overflow-hidden relative cursor-pointer"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div 
          className={`flex items-center gap-8 whitespace-nowrap ${isPaused ? '' : 'animate-marquee'}`}
          style={{ animationDuration: '30s' }}
        >
          {tickerArticles.concat(tickerArticles).map((article, idx) => (
            <div
              key={`${article.id}-${idx}`}
              onClick={() => onSelectArticle(slugify(article.title))}
              className="inline-flex items-center gap-2 hover:text-indigo-400 transition-colors group text-zinc-300 font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="truncate max-w-[280px] sm:max-w-[420px]">
                {article.title}
              </span>
              {article.category && (
                <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                  {article.category}
                </span>
              )}
              <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingTicker;
