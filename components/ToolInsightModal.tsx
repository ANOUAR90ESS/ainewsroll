import React, { useState } from 'react';
import { Tool, Slide } from '../types';
import { X, FileText, MonitorPlay, Mic, Play, Loader2 } from 'lucide-react';
import { generateToolSlides, generatePodcastScript, generateSpeech } from '../services/geminiService';

interface ToolInsightModalProps {
  tool: Tool;
  onClose: () => void;
}

const ToolInsightModal: React.FC<ToolInsightModalProps> = ({ tool, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'slides' | 'podcast'>('summary');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [podcastAudio, setPodcastAudio] = useState<HTMLAudioElement | null>(null);

  const handleTabChange = async (tab: 'summary' | 'slides' | 'podcast') => {
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
    } else if (tab === 'podcast' && !podcastAudio) {
      setLoading(true);
      try {
        const script = await generatePodcastScript(tool);
        const speechRes = await generateSpeech(script, 'Puck'); // Use a different voice for podcast
        const base64 = speechRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
            const audio = new Audio("data:audio/wav;base64," + base64);
            setPodcastAudio(audio);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const playPodcast = () => {
    if (podcastAudio) {
        podcastAudio.play();
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
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
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
          <button 
            onClick={() => handleTabChange('podcast')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'podcast' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Mic className="w-4 h-4" /> Podcast
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

           {activeTab === 'podcast' && (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                  <Mic className="w-16 h-16 text-white" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white mb-2">Nexus AI Weekly</h3>
                   <p className="text-zinc-400 text-sm">Episode: Deep Dive into {tool.name}</p>
                </div>
                
                {loading ? (
                   <div className="flex items-center gap-2 text-indigo-400">
                     <Loader2 className="w-4 h-4 animate-spin" /> Preparing audio...
                   </div>
                ) : (
                   <button 
                     onClick={playPodcast}
                     disabled={!podcastAudio}
                     className="flex items-center gap-3 px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-full font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                   >
                     <Play className="w-5 h-5 fill-current" /> Play Episode
                   </button>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ToolInsightModal;