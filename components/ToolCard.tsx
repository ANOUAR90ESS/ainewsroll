import React, { useState } from 'react';
import { ExternalLink, Tag, Sparkles } from 'lucide-react';
import { Tool } from '../types';
import ToolInsightModal from './ToolInsightModal';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="group relative bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-indigo-900/20 flex flex-col h-full">
        <div className="relative aspect-video overflow-hidden bg-zinc-950">
          <img 
            src={tool.imageUrl} 
            alt={tool.name} 
            width="1280"
            height="720"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
            loading="lazy"
          />
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white border border-white/10">
            {tool.price}
          </div>
          <button 
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

export default ToolCard;