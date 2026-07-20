import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Tag, Sparkles, Globe2, Star, Scale, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Tool } from '../types';
import GenerateCourseButton from './GenerateCourseButton';

interface ToolDetailProps {
  tool: Tool | null;
  onBack: () => void;
  onVisitWebsite?: (url?: string) => void;
  isAdmin?: boolean;
  onOpenComparer?: (tool: Tool) => void;
}

interface UserReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

const toolDetailFallbackImages: Record<string, string[]> = {
  Writing: [
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1280&h=720&fit=crop&q=80'
  ],
  Education: [
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1280&h=720&fit=crop&q=80'
  ]
};

const getToolDetailFallbackImage = (category: string, toolName: string) => {
  const images = toolDetailFallbackImages[category] || [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?w=1280&h=720&fit=crop&q=80'
  ];
  const hash = toolName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return images[hash % images.length];
};

const ToolDetail: React.FC<ToolDetailProps> = ({ tool, onBack, onVisitWebsite, isAdmin = false, onOpenComparer }) => {
  const [imageError, setImageError] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviews, setReviews] = useState<UserReview[]>([
    {
      id: '1',
      name: 'Carlos M.',
      rating: 5,
      comment: 'Excelente herramienta. Ha mejorado drásticamente la productividad en mi equipo.',
      date: new Date().toLocaleDateString()
    }
  ]);

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
          <img
            src={!imageError && tool.imageUrl ? tool.imageUrl : getToolDetailFallbackImage(tool.category, tool.name)}
            alt={tool.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
          {imageError && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center text-white">
                <Sparkles className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Displaying fallback image</p>
              </div>
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
            {onOpenComparer && (
              <button
                onClick={() => onOpenComparer(tool)}
                className="bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30 px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Scale className="w-4 h-4 text-purple-400" /> Comparar herramienta
              </button>
            )}
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

      {/* User Reviews & Ratings Section */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Reseñas y Puntuación / Reviews & Rating</h2>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{tool.rating || '4.8'} / 5.0</span>
          </div>
        </div>

        {/* Rating Submission Form */}
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!newComment.trim()) return;
          const rev: UserReview = {
            id: Date.now().toString(),
            name: reviewerName.trim() || 'Usuario Anónimo',
            rating: newRating,
            comment: newComment.trim(),
            date: new Date().toLocaleDateString()
          };
          setReviews([rev, ...reviews]);
          setNewComment('');
          setReviewerName('');
          setReviewSuccess(true);
          setTimeout(() => setReviewSuccess(false), 3000);
        }} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Añadir tu valoración sobre {tool.name}</h3>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Puntuación:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star className={`w-5 h-5 ${star <= newRating ? 'fill-amber-400' : 'text-zinc-600'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Tu nombre (opcional)..."
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <textarea
            rows={3}
            placeholder="¿Qué opinas sobre esta herramienta? Escribe tu reseña..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />

          {reviewSuccess && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> ¡Gracias por enviar tu reseña!
            </div>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Enviar Reseña
          </button>
        </form>

        {/* Existing Reviews List */}
        {reviews.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Reseñas de la comunidad ({reviews.length})</h4>
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rev.name}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
                        />
                      ))}
                      <span className="text-[10px] text-zinc-500 ml-2">{rev.date}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolDetail;
