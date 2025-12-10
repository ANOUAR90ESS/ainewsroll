import React from 'react';
import { Tool } from '../types';
import ToolCard from './ToolCard';
import { Heart, Sparkles } from 'lucide-react';

interface FavoritesPageProps {
  tools: Tool[];
  favoriteIds: string[];
  onToggleFavorite: (toolId: string) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({
  tools,
  favoriteIds,
  onToggleFavorite
}) => {
  const favoriteTools = tools.filter(tool => favoriteIds.includes(tool.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">My Favorites</h1>
            <p className="text-zinc-400 text-sm">
              {favoriteTools.length} {favoriteTools.length === 1 ? 'tool' : 'tools'} saved
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {favoriteTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-zinc-900/50 border-2 border-dashed border-zinc-700 flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No favorites yet</h2>
          <p className="text-zinc-400 text-center max-w-md mb-6">
            Start building your collection by clicking the{' '}
            <Heart className="w-4 h-4 inline-block" /> button on any tool card
          </p>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Sparkles className="w-4 h-4" />
            <span>Save tools you love and access them quickly</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteTools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={true}
              isAuthenticated={true}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
