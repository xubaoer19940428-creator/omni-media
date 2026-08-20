'use client';

import React from 'react';
import { SUPPORTED_PLATFORMS } from '@/lib/constants';
import { PlatformIcon } from './PlatformIcons';

interface PlatformMarqueeProps {
  onSelectPlatform?: (platformKey: string) => void;
}

export const PlatformMarquee: React.FC<PlatformMarqueeProps> = ({ onSelectPlatform }) => {
  const marqueeItems = [...SUPPORTED_PLATFORMS, ...SUPPORTED_PLATFORMS];

  return (
    <div className="w-full overflow-hidden py-4 border-y border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-slate-950/40 relative">
      {/* Left/Right blur mask overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#fafbfc] dark:from-[#06090e] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#fafbfc] dark:from-[#06090e] to-transparent z-10 pointer-events-none" />

      <div className="animate-marquee flex items-center gap-3">
        {marqueeItems.map((platform, idx) => (
          <button
            key={`${platform.key}-${idx}`}
            onClick={() => onSelectPlatform?.(platform.key)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-cyan-500/40 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-sm shrink-0 group cursor-pointer"
          >
            <PlatformIcon platformKey={platform.key} className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition">
              {platform.name}
            </span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
              API
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
