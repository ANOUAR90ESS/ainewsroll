import React from 'react';
import { Mic, Volume2, AlertCircle } from 'lucide-react';

/**
 * LiveDemo Component - Placeholder for OpenAI Realtime API Integration
 *
 * This component was previously using Google Gemini Live API.
 * OpenAI's Realtime API will be integrated in a future update.
 */
const LiveDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-8 border border-zinc-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Live Demo - Coming Soon</h2>
          <p className="text-zinc-400">
            We're working on integrating OpenAI's Realtime API for live conversations.
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            This feature is currently being migrated from Google Gemini to OpenAI.
          </p>
        </div>

        <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
          <h3 className="text-white font-semibold mb-3">What's Coming:</h3>
          <ul className="space-y-2 text-zinc-400 text-sm">
            <li className="flex items-start gap-2">
              <Mic className="w-4 h-4 mt-0.5 text-indigo-400" />
              <span>Real-time voice conversations with AI</span>
            </li>
            <li className="flex items-start gap-2">
              <Volume2 className="w-4 h-4 mt-0.5 text-indigo-400" />
              <span>Natural speech synthesis and recognition</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 text-indigo-400" />
              <span>Low-latency audio streaming</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
          <p className="text-indigo-300 text-sm">
            <strong>Note:</strong> The OpenAI Realtime API provides similar capabilities to the previous
            Gemini Live implementation. Check back soon for the updated integration!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveDemo;

/*
 * OLD IMPLEMENTATION (Gemini Live API)
 * Commented out for reference - to be replaced with OpenAI Realtime API
 *
 * The previous implementation used:
 * - Google Gemini Live API (@google/genai)
 * - Native audio streaming with Web Audio API
 * - Real-time bidirectional voice communication
 *
 * OpenAI Realtime API will provide similar functionality:
 * - https://platform.openai.com/docs/guides/realtime
 */
