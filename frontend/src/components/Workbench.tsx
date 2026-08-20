'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Clipboard,
  X,
  Loader2,
  AlertCircle,
  History,
  Trash2,
  ChevronDown,
  Zap,
  Sparkles
} from 'lucide-react';
import { ParsedMedia, PlatformKey } from '@/types';
import { extractUrlFromText, parseMediaUrl } from '@/lib/api';
import { DEMO_LINKS, SUPPORTED_PLATFORMS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n';
import { ResultCard } from './ResultCard';
import { PlatformIcon } from './PlatformIcons';
import gsap from 'gsap';

interface WorkbenchProps {
  initialUrl?: string;
}

export const Workbench: React.FC<WorkbenchProps> = ({ initialUrl = '' }) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState(initialUrl);
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformKey>('unknown');
  const [cleanUrl, setCleanUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedMedia | null>(null);
  const [history, setHistory] = useState<ParsedMedia[]>([]);
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-detect platform as user types or pastes
  useEffect(() => {
    const { url, platformKey } = extractUrlFromText(inputText);
    setCleanUrl(url);
    setDetectedPlatform(platformKey);
  }, [inputText]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('omnimedia_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Animate result card reveal with GSAP
  useEffect(() => {
    if (result && resultRef.current) {
      gsap.fromTo(
        resultRef.current,
        { opacity: 0, y: 30, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [result]);

  // Animate dropdown with GSAP
  useEffect(() => {
    if (showDemoDropdown && dropdownRef.current) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [showDemoDropdown]);

  const saveToHistory = (item: ParsedMedia) => {
    try {
      const updated = [item, ...history.filter(h => h.original_url !== item.original_url)].slice(0, 8);
      setHistory(updated);
      localStorage.setItem('omnimedia_history', JSON.stringify(updated));
    } catch {}
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('omnimedia_history');
    } catch {}
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch {
      setError(t.workbench.clipboardError);
    }
  };

  const handleParse = async (urlToParse?: string) => {
    const target = urlToParse || inputText;
    if (!target.trim()) {
      setError(t.workbench.noUrlError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await parseMediaUrl(target);
      setResult(data);
      saveToHistory(data);
    } catch (err: any) {
      setError(err.message || 'Parsing failed');
    } finally {
      setLoading(false);
    }
  };

  const platformInfo = SUPPORTED_PLATFORMS.find(p => p.key === detectedPlatform);

  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto space-y-8">
      {/* Workbench Console Window */}
      <div className="tikhub-panel rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xl overflow-hidden relative">
        {/* Scanning laser beam indicator during extraction */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-[2px] scanning-border z-30 animate-pulse" />
        )}

        {/* macOS Terminal Header */}
        <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="mac-dot mac-dot-red"></span>
            <span className="mac-dot mac-dot-yellow"></span>
            <span className="mac-dot mac-dot-green"></span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2">omni-media://workbench.live</span>
          </div>

          {/* Demo Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoDropdown(!showDemoDropdown)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-blue-600 dark:text-cyan-400 font-medium transition shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t.workbench.sampleLinks}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDemoDropdown && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 z-40 space-y-1 backdrop-blur-xl"
              >
                {DEMO_LINKS.map((demo, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(demo.url);
                      setShowDemoDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between group transition"
                  >
                    <span className="truncate group-hover:text-blue-600 dark:group-hover:text-white font-medium">{demo.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-cyan-400">
                      {demo.platform}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 dark:text-slate-300 font-semibold">{t.workbench.title}</span>
              {platformInfo && (
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border animate-in fade-in bg-white dark:bg-slate-900 shadow-sm"
                  style={{
                    borderColor: `${platformInfo.color}40`,
                    color: platformInfo.color,
                  }}
                >
                  <PlatformIcon platformKey={platformInfo.key} className="w-3.5 h-3.5 shrink-0" />
                  <span>{platformInfo.name}</span>
                </span>
              )}
            </div>

            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
              {t.workbench.ctrlEnter}
            </span>
          </div>

          <div className="relative rounded-xl bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 dark:focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:focus-within:ring-cyan-500/20 transition-all shadow-inner">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleParse();
                }
              }}
              placeholder={t.workbench.placeholder}
              className="w-full h-28 sm:h-24 p-4 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 resize-none outline-none font-mono"
            />

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between p-2.5 border-t border-slate-100 dark:border-slate-900 bg-slate-50/80 dark:bg-slate-950/80 rounded-b-xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium transition shadow-sm hover:scale-105"
                >
                  <Clipboard className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>{t.workbench.paste}</span>
                </button>

                {inputText && (
                  <button
                    onClick={() => {
                      setInputText('');
                      setError(null);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t.workbench.clear}</span>
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={() => handleParse()}
                disabled={loading || !inputText.trim()}
                className="btn-gradient-pill text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.workbench.extracting}</span>
                  </>
                ) : (
                  <>
                    <span>{t.workbench.extractMedia}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clean URL Output */}
          {cleanUrl && cleanUrl !== inputText && (
            <div className="text-xs text-slate-500 flex items-center gap-2 px-1">
              <span className="text-blue-600 dark:text-cyan-400 font-mono font-medium">{t.workbench.extractedUrl}</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 truncate bg-slate-100 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                {cleanUrl}
              </span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Result Section with GSAP reveal */}
      {result && (
        <div ref={resultRef}>
          <ResultCard data={result} onClear={() => setResult(null)} />
        </div>
      )}

      {/* Recent History Grid */}
      {history.length > 0 && !result && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-300">
              <History className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>{t.workbench.recentHistory}</span>
            </div>
            <button
              onClick={clearHistory}
              className="text-slate-400 hover:text-rose-500 transition flex items-center gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.workbench.clearHistory}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {history.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setResult(item)}
                className="tikhub-card rounded-xl p-3 cursor-pointer flex items-center gap-3 group"
              >
                {item.cover || item.cover_url ? (
                  <img
                    src={item.cover || item.cover_url}
                    alt={item.title || 'Cover'}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-indigo-950 flex items-center justify-center text-blue-600 dark:text-cyan-400 font-bold shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                )}
                <div className="overflow-hidden">
                  <h5 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition">
                    {item.title || t.workbench.untitled}
                  </h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{item.platform}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
