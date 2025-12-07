import React, { useEffect, useRef, useState } from 'react';

interface AdUnitProps {
  format?: 'horizontal' | 'rectangle' | 'vertical';
  className?: string;
  slot?: string; // Explicit AdSense slot id override
  adLayout?: 'rspv' | 'mcrspv' | 'auto'; // Layout hint (amp auto-format values)
}

const AdUnit: React.FC<AdUnitProps> = ({ format = 'horizontal', className = '', slot, adLayout = 'auto' }) => {
  // Environment-provided slots (set these in .env.local and Vercel project settings):
  // VITE_ADSENSE_SLOT          -> default fallback
  // VITE_ADSENSE_SLOT_RSPV     -> responsive slot (maps to 'rspv')
  // VITE_ADSENSE_SLOT_MCRSPV   -> multi-column responsive slot (AMP only; we still allow selection but note limitation)
  const envSlots = typeof import.meta !== 'undefined'
    ? {
        default: (import.meta as any).env?.VITE_ADSENSE_SLOT,
        rspv: (import.meta as any).env?.VITE_ADSENSE_SLOT_RSPV,
        mcrspv: (import.meta as any).env?.VITE_ADSENSE_SLOT_MCRSPV,
      }
    : { default: undefined, rspv: undefined, mcrspv: undefined };

  // Choose slot precedence: explicit prop > layout-specific env > default env
  const adSlot = slot || (adLayout !== 'auto' ? envSlots[adLayout] : undefined) || envSlots.default;
  const adRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  
  let sizeClasses = '';
  if (format === 'horizontal') sizeClasses = 'w-full h-[90px] max-w-[728px]'; // Leaderboard
  if (format === 'rectangle') sizeClasses = 'w-[300px] h-[250px]'; // Medium Rectangle
  if (format === 'vertical') sizeClasses = 'w-[160px] h-[600px]'; // Skyscraper

  useEffect(() => {
    if (!adSlot) return; // No slot -> keep placeholder
    
    const loadAd = () => {
      try {
        // @ts-ignore - Push ad to AdSense queue
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setLoaded(true);
      } catch (e) {
        console.error('AdSense error:', e);
        setLoaded(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadAd, 100);
    return () => clearTimeout(timer);
  }, [adSlot]);

  // If we have an ad slot, render real AdSense unit
  if (adSlot) {
    return (
      <div className={`flex flex-col items-center justify-center my-6 ${className}`}>
        <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1 w-full text-center">Advertisement</div>
        {/* @ts-ignore */}
        <ins
          className="adsbygoogle block"
          data-ad-client="ca-pub-9054863881104831"
          data-ad-slot={String(adSlot)}
          data-ad-format="autorelaxed"
          data-full-width-responsive="true"
          ref={adRef as any}
        />
      </div>
    );
  }

  // Fallback placeholder if no slot configured
  return (
    <div className={`flex flex-col items-center justify-center my-6 ${className}`}>
      <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1 w-full text-center">Advertisement</div>
      <div 
        className={`${sizeClasses} bg-zinc-900 border border-zinc-800 border-dashed rounded-lg flex flex-col items-center justify-center relative overflow-hidden group`}
        title="AdSense Placeholder"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-zinc-900/20 z-0"></div>
        <div className="z-10 text-center p-4">
          <span className="text-zinc-500 font-bold text-xs block mb-1">Sponsored</span>
          <span className="text-zinc-300 font-medium text-sm">Discover Premium AI Tools</span>
          <button className="mt-2 bg-indigo-600/20 text-indigo-400 text-[10px] px-2 py-1 rounded border border-indigo-600/30 hover:bg-indigo-600 hover:text-white transition-colors">
            Learn More
          </button>
        </div>
        <div className="absolute top-0 right-0 p-1">
          <div className="w-3 h-3 bg-zinc-700 rounded-bl text-[8px] flex items-center justify-center text-zinc-400">i</div>
        </div>
      </div>
      {!loaded && (
        <div className="text-[10px] text-zinc-500 mt-2">
          Provide slot via prop or set env: VITE_ADSENSE_SLOT / VITE_ADSENSE_SLOT_RSPV / VITE_ADSENSE_SLOT_MCRSPV
        </div>
      )}
    </div>
  );
};

export default AdUnit;