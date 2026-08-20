'use client';

import React, { useState } from 'react';
import {
  Globe,
  Search,
  Check,
  ArrowUpRight
} from 'lucide-react';
import { SUPPORTED_PLATFORMS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n';
import { PlatformIcon } from './PlatformIcons';

interface PlatformMatrixProps {
  onTestUrl?: (url: string) => void;
}

export const PlatformMatrix: React.FC<PlatformMatrixProps> = ({ onTestUrl }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = SUPPORTED_PLATFORMS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.domains.some((d) => d.includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 text-xs text-blue-600 dark:text-cyan-400 font-mono font-medium">
          <Globe className="w-3.5 h-3.5" />
          <span>{t.platforms.tag}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{t.platforms.title}</h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          {t.platforms.subtitle}
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.platforms.searchPlaceholder}
          className="w-full pl-11 pr-4 py-3 rounded-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 shadow-sm backdrop-blur-xl font-mono"
        />
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((platform) => (
          <div
            key={platform.key}
            className="tikhub-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 group"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <PlatformIcon platformKey={platform.key} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition">
                      {platform.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      {platform.domains[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{t.platforms.liveStatus}</span>
              </div>

              {/* Capabilities List */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>{t.platforms.noWatermark}</span>
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>{t.platforms.galleryHd}</span>
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>{t.platforms.audioExtractor}</span>
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                </div>
              </div>
            </div>

            {/* Quick Demo Test */}
            {platform.demoUrl && (
              <button
                onClick={() => onTestUrl?.(platform.demoUrl!)}
                className="w-full btn-secondary-pill text-xs flex items-center justify-center gap-1 group-hover:border-blue-500/40"
              >
                <span>{t.platforms.testInWorkbench}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
