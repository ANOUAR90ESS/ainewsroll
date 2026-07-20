import React, { useState } from 'react';
import { X, Sparkles, Star, ExternalLink, Check, Plus, Trash2, Scale } from 'lucide-react';
import { Tool } from '../types';

interface ToolComparerProps {
  isOpen: boolean;
  onClose: () => void;
  allTools: Tool[];
  initialTools?: Tool[];
}

const ToolComparer: React.FC<ToolComparerProps> = ({
  isOpen,
  onClose,
  allTools,
  initialTools = []
}) => {
  const [selectedTools, setSelectedTools] = useState<Tool[]>(() => {
    return initialTools.slice(0, 3);
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleRemove = (toolId: string) => {
    setSelectedTools(prev => prev.filter(t => t.id !== toolId));
  };

  const handleAddTool = (tool: Tool) => {
    if (selectedTools.some(t => t.id === tool.id)) return;
    if (selectedTools.length >= 3) return;
    setSelectedTools(prev => [...prev, tool]);
    setIsAdding(false);
    setSearchQuery('');
  };

  const availableTools = allTools.filter(t => 
    !selectedTools.some(st => st.id === t.id) &&
    (t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.category.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Comparador de Herramientas de IA / AI Tool Comparer
              </h2>
              <p className="text-xs text-zinc-400">
                Compara hasta 3 herramientas lado a lado en precios, características y reseñas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full transition-all"
            aria-label="Cerrar comparador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Add tool trigger */}
          {selectedTools.length < 3 && (
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Añadir herramienta a comparar ({selectedTools.length}/3)
                </span>
                {!isAdding && (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Buscar herramienta
                  </button>
                )}
              </div>

              {isAdding && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o categoría (ej: ChatGPT, Midjourney)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  {availableTools.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                      {availableTools.map(tool => (
                        <div
                          key={tool.id}
                          onClick={() => handleAddTool(tool)}
                          className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="truncate">
                            <p className="text-xs font-bold text-white truncate">{tool.name}</p>
                            <p className="text-[10px] text-zinc-400">{tool.category}</p>
                          </div>
                          <Plus className="w-4 h-4 text-indigo-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 py-1">No se encontraron más herramientas.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comparison Table */}
          {selectedTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedTools.map(tool => (
                <div
                  key={tool.id}
                  className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between relative shadow-xl"
                >
                  <button
                    onClick={() => handleRemove(tool.id)}
                    className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-full transition-colors"
                    title="Eliminar de comparación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-3">
                    {/* Image */}
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                      <img
                        src={tool.imageUrl}
                        alt={tool.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-medium">
                        {tool.category}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">{tool.name}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-3 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>

                    {/* Features Grid */}
                    <div className="space-y-2 border-t border-zinc-800/80 pt-3 text-xs">
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-500 font-medium">Precio:</span>
                        <span className="text-emerald-400 font-bold">{tool.price || 'Free'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-500 font-medium">Puntuación:</span>
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" /> {tool.rating || '4.8'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visit button */}
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md mt-4"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Visitar {tool.name}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <p className="text-zinc-400 text-sm">Selecciona al menos una herramienta para comparar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolComparer;
