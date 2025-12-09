import React, { useState } from 'react';
import { Tool, Slide } from '../types';
import { X, FileText, MonitorPlay, Loader2 } from 'lucide-react';
import { generateToolSlides } from '../services/geminiService';

interface ToolInsightModalProps {
  tool: Tool;
  onClose: () => void;
}

const ToolInsightModal: React.FC<ToolInsightModalProps> = ({ tool, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'slides'>('summary');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTabChange = async (tab: 'summary' | 'slides') => {
    setActiveTab(tab);
    if (tab === 'slides' && slides.length === 0) {
      setLoading(true);
      try {
        const generatedSlides = await generateToolSlides(tool);
        setSlides(generatedSlides);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">AI Insights</span>
            {tool.name}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-zinc-800 bg-zinc-900">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <FileText className="w-4 h-4" /> Summary
          </button>
          <button 
            onClick={() => handleTabChange('slides')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'slides' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <MonitorPlay className="w-4 h-4" /> Slides
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-zinc-900/50">
           {activeTab === 'summary' && (
             <div className="space-y-4">
               <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                 <h4 className="text-sm font-semibold text-zinc-400 uppercase mb-2">About the Tool</h4>
                 <p className="text-lg text-white leading-relaxed">{tool.description}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-zinc-800/30 p-4 rounded-xl">
                   <h5 className="text-xs text-zinc-500 uppercase mb-1">Category</h5>
                   <p className="text-indigo-400 font-medium">{tool.category}</p>
                 </div>
                 <div className="bg-zinc-800/30 p-4 rounded-xl">
                   <h5 className="text-xs text-zinc-500 uppercase mb-1">Pricing</h5>
                   <p className="text-green-400 font-medium">{tool.price}</p>
                 </div>
               </div>
             </div>
           )}

           {activeTab === 'slides' && (
             <div className="h-full flex flex-col">
               {loading ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3">
                   <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                   Generating presentation...
                 </div>
               ) : (
                 <div className="space-y-6">
                   {slides.map((slide, i) => (
                     <div key={i} className="bg-white text-black p-6 rounded-lg shadow-xl border border-zinc-200">
                       <h2 className="text-2xl font-bold mb-4 text-indigo-700">{slide.title}</h2>
                       <ul className="list-disc pl-5 space-y-2">
                         {slide.content.map((point, j) => (
                           <li key={j} className="text-lg text-zinc-800">{point}</li>
                         ))}
                       </ul>
                       <div className="mt-4 text-right text-xs text-zinc-400">Slide {i + 1}</div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ToolInsightModal;