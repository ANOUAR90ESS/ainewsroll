import React from 'react';
import { NewsArticle } from '../types';
import { X, Calendar, User, Tag, ExternalLink, Share2 } from 'lucide-react';

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

  // Handle share
  const handleShare = async () => {
    const articleUrl = `${window.location.origin}/news?article=${article.id}`;
    const text = `${article.title} - AI News-Roll`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: text,
          url: articleUrl
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(articleUrl).then(() => {
        alert('Article link copied to clipboard!');
      });
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
        
        {/* Modal Header: Title & Badges */}
        <div className="p-6 md:px-8 md:pt-6 md:pb-4 border-b border-zinc-800 flex justify-between items-start gap-4 bg-zinc-900/90">
          <div className="space-y-3">
             <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-zinc-300">
                <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
                  <Calendar className="w-3.5 h-3.5" /> 
                  {new Date(article.date).toLocaleDateString()}
                </span>
                {article.category && (
                    <span className="flex items-center gap-1.5 bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30 font-medium">
                      <Tag className="w-3.5 h-3.5" /> 
                      {article.category}
                    </span>
                )}
             </div>
             <h2 className="text-xl md:text-3xl font-bold text-white leading-tight">
               {article.title}
             </h2>
          </div>
          <button 
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full transition-all shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Featured Image */}
        <div className="relative w-full aspect-video shrink-0 overflow-hidden bg-zinc-950">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            width="1600"
            height="900"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-900 p-6 md:p-8 custom-scrollbar">
           {/* Affiliate / Sponsored Tool Callout */}
           {article.affiliateUrl && (
             <div className="mb-6 p-4 md:p-5 rounded-xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div className="space-y-1">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Sponsored Link</span>
                 <h4 className="text-base font-bold text-white">{article.sponsoredToolName || "Featured Tool"}</h4>
                 {article.sponsoredToolDesc && <p className="text-xs text-zinc-300">{article.sponsoredToolDesc}</p>}
               </div>
               <a 
                 href={article.affiliateUrl}
                 target="_blank"
                 rel="noopener sponsored noreferrer"
                 className="shrink-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-lg shadow-md flex items-center gap-1.5 transition-all"
               >
                 <span>{article.affiliateCta || "Try Tool"}</span>
                 <ExternalLink className="w-3.5 h-3.5" />
               </a>
             </div>
           )}
           <div className="prose prose-invert max-w-none">
             <p className="text-lg md:text-xl text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans font-light tracking-wide">
               {article.content}
             </p>
           </div>
           
           {/* Source Link Button */}
           {isSourceUrl && (
             <div className="mt-8 pt-6 border-t border-zinc-800 space-y-3">
               <p className="text-xs text-zinc-500 uppercase tracking-widest">Source</p>
               <a 
                 href={article.source}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
               >
                 <ExternalLink className="w-4 h-4" />
                 Visit {displaySource}
               </a>
               <p className="text-xs text-zinc-500 break-all">{article.source}</p>
             </div>
           )}
           {!isSourceUrl && article.source && (
             <div className="mt-8 pt-6 border-t border-zinc-800">
               <p className="text-sm text-zinc-400">
                 <span className="text-xs uppercase tracking-widest text-zinc-500">Source: </span>
                 {article.source}
               </p>
             </div>
           )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center shrink-0">
          <button 
            onClick={handleShare}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors border border-indigo-500 flex items-center gap-2"
            title="Share article"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
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