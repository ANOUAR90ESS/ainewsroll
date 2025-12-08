import React from 'react';
import { NewsArticle } from '../types';
import { X, Calendar, User, Tag, ExternalLink } from 'lucide-react';

interface NewsModalProps {
  article: NewsArticle;
  onClose: () => void;
}

const NewsModal: React.FC<NewsModalProps> = ({ article, onClose }) => {
  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Check if source is a URL
  const isSourceUrl = article.source?.startsWith('http://') || article.source?.startsWith('https://');
  const displaySource = isSourceUrl 
    ? new URL(article.source).hostname.replace('www.', '') 
    : article.source;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative">
        
        {/* Header / Image */}
        <div className="relative h-64 md:h-80 shrink-0 group">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
             <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300 mb-3">
                <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur border border-white/10">
                  <Calendar className="w-3.5 h-3.5" /> 
                  {new Date(article.date).toLocaleDateString()}
                </span>
                {article.category && (
                    <span className="flex items-center gap-1.5 bg-purple-500/80 px-2.5 py-1 rounded-full backdrop-blur border border-white/10 text-white">
                      <Tag className="w-3.5 h-3.5" /> 
                      {article.category}
                    </span>
                )}
             </div>
             <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight shadow-black drop-shadow-lg">
               {article.title}
             </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-900 p-6 md:p-8 custom-scrollbar">
           <div className="prose prose-invert max-w-none">
             <p className="text-lg md:text-xl text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans font-light tracking-wide">
               {article.content}
             </p>
           </div>
           
           {/* Source Link Button */}
           {isSourceUrl && (
             <div className="mt-8 pt-6 border-t border-zinc-800">
               <a 
                 href={article.source}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
               >
                 <ExternalLink className="w-4 h-4" />
                 Read Full Article on {displaySource}
               </a>
             </div>
           )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end items-center shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700"
          >
            Close Article
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;