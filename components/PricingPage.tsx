import React from 'react';
import { Check, X, CreditCard, Shield, Crown, Zap } from 'lucide-react';
import AdUnit from './AdUnit';

interface PricingPageProps {
  onSelectPlan: (plan: string) => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan }) => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Pricing</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
          Choose the plan that fits your creative needs. Start for free with our ad-supported tier or upgrade for professional power.
        </p>
      </div>

      {/* Top Ad Unit */}
      <AdUnit format="horizontal" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Free / Gratis Tier */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-zinc-700"></div>
           <h3 className="text-xl font-bold text-white mb-2">Gratis (Free)</h3>
           <div className="text-3xl font-bold text-white mb-6">$0 <span className="text-sm font-normal text-zinc-500">/ month</span></div>
           <p className="text-zinc-400 text-sm mb-6">Perfect for exploring and testing basic AI capabilities.</p>
           
           <ul className="space-y-4 mb-8 flex-1">
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-emerald-500" /> Access to Tool Directory
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-emerald-500" /> Basic Search
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-emerald-500" /> Ad-Supported Experience
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-500">
               <X className="w-4 h-4" /> Veo Video Generation
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-500">
               <X className="w-4 h-4" /> Priority Support
             </li>
           </ul>

           <button 
             onClick={() => window.location.reload()}
             className="w-full py-3 rounded-lg border border-zinc-700 text-white font-bold hover:bg-zinc-800 transition-colors"
           >
             Get Started
           </button>
        </div>

        {/* Pro Tier */}
        <div className="bg-zinc-900 border border-indigo-500 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-900/20 transform md:-translate-y-4">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
           <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
           
           <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
             <Zap className="w-5 h-5 text-indigo-400" /> Pro
           </h3>
           <div className="text-3xl font-bold text-white mb-6">$19 <span className="text-sm font-normal text-zinc-500">/ month</span></div>
           <p className="text-zinc-400 text-sm mb-6">For creators who need more power and no distractions.</p>
           
           <ul className="space-y-4 mb-8 flex-1">
             <li className="flex items-center gap-3 text-sm text-zinc-200">
               <Check className="w-4 h-4 text-indigo-400" /> All Free Features
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-200">
               <Check className="w-4 h-4 text-indigo-400" /> <strong>No Ads</strong>
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-200">
               <Check className="w-4 h-4 text-indigo-400" /> Gemini 3 Pro Access
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-200">
               <Check className="w-4 h-4 text-indigo-400" /> 4K Image Generation
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-200">
               <Check className="w-4 h-4 text-indigo-400" /> Faster Processing
             </li>
           </ul>

           <button 
             onClick={() => onSelectPlan('Pro')}
             className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-900/30"
           >
             Upgrade to Pro
           </button>
        </div>

        {/* Enterprise Tier */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-purple-600"></div>
           <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
             <Crown className="w-5 h-5 text-purple-400" /> Enterprise
           </h3>
           <div className="text-3xl font-bold text-white mb-6">$49 <span className="text-sm font-normal text-zinc-500">/ month</span></div>
           <p className="text-zinc-400 text-sm mb-6">Ultimate power for professional studios and teams.</p>
           
           <ul className="space-y-4 mb-8 flex-1">
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-purple-500" /> Everything in Pro
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-purple-500" /> <strong>Veo Video Studio</strong> (Unlimited)
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-purple-500" /> Live API Access
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-purple-500" /> API Key Integration
             </li>
             <li className="flex items-center gap-3 text-sm text-zinc-300">
               <Check className="w-4 h-4 text-purple-500" /> 24/7 Priority Support
             </li>
           </ul>

           <button 
             onClick={() => onSelectPlan('Enterprise')}
             className="w-full py-3 rounded-lg border border-zinc-700 hover:border-purple-500 text-white font-bold hover:bg-purple-900/20 transition-all"
           >
             Subscribe Enterprise
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-zinc-900 rounded-lg">
                  <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                  <h4 className="text-white font-bold">Secure Payment</h4>
                  <p className="text-sm text-zinc-400">All transactions are secured by Stripe.</p>
              </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-zinc-900 rounded-lg">
                  <CreditCard className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                  <h4 className="text-white font-bold">Cancel Anytime</h4>
                  <p className="text-sm text-zinc-400">No long-term contracts or hidden fees.</p>
              </div>
          </div>
      </div>
      
      {/* Bottom Ad Unit */}
      <AdUnit format="horizontal" />
    </div>
  );
};

export default PricingPage;