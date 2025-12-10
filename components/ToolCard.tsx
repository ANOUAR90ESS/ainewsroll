import React, { useState, memo } from 'react';
import { ExternalLink, Tag, Sparkles, Heart } from 'lucide-react';
import { Tool } from '../types';
import ToolInsightModal from './ToolInsightModal';

interface ToolCardProps {
  tool: Tool;
  isFavorite?: boolean;
  isAuthenticated?: boolean;
  onToggleFavorite?: (toolId: string) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  isFavorite = false,
  isAuthenticated = false,
  onToggleFavorite
}) => {
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onToggleFavorite) {
      onToggleFavorite(tool.id);
    }
  };

  return (
    <>
      <div className="group relative bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-indigo-900/20 flex flex-col h-full">
        <div className="relative aspect-video overflow-hidden bg-zinc-950">
          {/* Image Loading Placeholder */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-zinc-700 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Image */}
          {!imageError && (
            <img
              src={tool.imageUrl}
              alt={tool.name}
              width="1280"
              height="720"
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-80 group-hover:opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          {/* Fallback for broken images */}
          {imageError && (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm font-medium">{tool.category}</p>
              </div>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white border border-white/10">
            {tool.price}
          </div>

          {/* Favorite Button */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={`absolute top-3 left-3 backdrop-blur p-2 rounded-full shadow-lg transition-all ${
                isFavorite
                  ? 'bg-red-500/90 text-white hover:bg-red-600'
                  : 'bg-black/70 text-white hover:bg-black/90'
              }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            type="button"
             onClick={(e) => {
               e.preventDefault();
               setShowModal(true);
             }}
             className="absolute bottom-3 left-3 bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
             title="AI Explain"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
             <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">{tool.category}</div>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{tool.name}</h3>
          <p className="text-zinc-400 text-sm mb-4 line-clamp-2 flex-1">{tool.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {tool.tags.slice(0, 3).map(tag => (
              <span key={tag} className="flex items-center gap-1 text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full">
                <Tag className="w-3 h-3" /> {tag}
              </span>
            ))}
          </div>
          
          <a 
            href={tool.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-auto flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Visit Website <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
      
      {showModal && <ToolInsightModal tool={tool} onClose={() => setShowModal(false)} />}
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(ToolCard, (prevProps, nextProps) => {
  return (
    prevProps.tool.id === nextProps.tool.id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.isAuthenticated === nextProps.isAuthenticated
  );
});