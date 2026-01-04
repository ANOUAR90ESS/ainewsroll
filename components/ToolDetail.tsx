import React from 'react';
import { ArrowLeft, ExternalLink, Tag, Sparkles, Globe2 } from 'lucide-react';
import { Tool } from '../types';
import GenerateCourseButton from './GenerateCourseButton';

interface ToolDetailProps {
  tool: Tool | null;
  onBack: () => void;
  onVisitWebsite?: (url?: string) => void;
  isAdmin?: boolean;
}

const ToolDetail: React.FC<ToolDetailProps> = ({ tool, onBack, onVisitWebsite, isAdmin = false }) => {
  if (!tool) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={onBack} className="text-zinc-400 hover:text-white flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to directory
        </button>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
          <p>We could not find that tool. It may have been removed or unpublished.</p>
        </div>
      </div>
    );
  }

  const handleVisit = () => {
    if (onVisitWebsite) onVisitWebsite(tool.website);
    if (tool.website) {
      window.open(tool.website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="text-zinc-400 hover:text-white flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to directory
        </button>
        <div className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-200 border border-indigo-500/30">
          {tool.category}
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="relative aspect-video bg-zinc-950">
          {tool.imageUrl ? (
            <img src={tool.imageUrl} alt={tool.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              <Sparkles className="w-10 h-10" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <h1 className="text-3xl font-bold text-white mb-2">{tool.name}</h1>
            <p className="text-zinc-300 max-w-3xl">{tool.description}</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
            <span className="px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-100 border border-zinc-700">{tool.price}</span>
            <span className="px-3 py-1.5 rounded-full bg-indigo-900/30 text-indigo-200 border border-indigo-800">{tool.category}</span>
          </div>

          {tool.tags && tool.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tool.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-zinc-800 text-zinc-200 px-2.5 py-1 rounded-full border border-zinc-700">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleVisit}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              Visit website <ExternalLink className="w-4 h-4" />
            </button>
            <GenerateCourseButton tool={tool} isAdmin={isAdmin} />
            <a
              href={tool.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
            >
              <Globe2 className="w-4 h-4" /> {tool.website}
            </a>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* How to Use */}
        {tool.how_to_use && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> How to Use
            </h2>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-line text-sm">
              {tool.how_to_use}
            </p>
          </div>
        )}

        {/* Features */}
        {tool.features_detailed && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-400" /> Key Features
            </h2>
            <div className="space-y-2 text-sm text-zinc-300">
              {tool.features_detailed.split('\n').map((feature, idx) => (
                feature.trim() && (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{feature.trim()}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Use Cases */}
        {tool.use_cases && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Use Cases</h2>
            <div className="space-y-2 text-sm text-zinc-300">
              {tool.use_cases.split('\n').map((useCase, idx) => (
                useCase.trim() && (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="text-green-400 mt-0.5">→</span>
                    <span>{useCase.trim()}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Pros & Cons */}
        {tool.pros_cons && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Pros & Cons</h2>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-line text-sm">
              {tool.pros_cons}
            </p>
          </div>
        )}
      </div>

      {/* Screenshots */}
      {tool.screenshots_urls && tool.screenshots_urls.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Screenshots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tool.screenshots_urls.map((screenshotUrl, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-zinc-700 hover:border-indigo-500 transition-colors">
                <img 
                  src={screenshotUrl} 
                  alt={`${tool.name} screenshot ${idx + 1}`}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolDetail;
