'use client';

import React, { useState } from 'react';
import { X, BookOpen, Copy, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const parseExample = `{
  "success": true,
  "platform": "tiktok",
  "platform_key": "tiktok",
  "platform_name": "TikTok",
  "video_id": "7106594312292453678",
  "title": "Example Video Caption",
  "author": "creator_handle",
  "cover_url": "https://p16-sign.tiktokcdn.com/...",
  "video_url": "https://v16-webapp-prime.tiktokcdn.com/...",
  "duration": 15,
  "likes": 25480,
  "views": 320000,
  "comments": 612,
  "original_url": "https://www.tiktok.com/@tiktok/video/7106594312292453678",
  "has_download_url": true
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#080c14] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6 shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-cyan-500/20 border border-blue-200 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">{t.docs.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.docs.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Section 1: Base URL */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-500"></span>
              <span>{t.docs.baseUrl}</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-800 dark:text-slate-300 space-y-1">
              <p><strong className="text-blue-600 dark:text-cyan-400">Base URL:</strong> <code>https://api.yourdomain.com</code> or <code>http://localhost:7860</code></p>
              <p><strong className="text-blue-600 dark:text-cyan-400">Content-Type:</strong> <code>application/json</code></p>
              <p><strong className="text-blue-600 dark:text-cyan-400">CORS:</strong> <code>{t.docs.corsPolicy}</code></p>
            </div>
          </div>

          {/* Section 2: Parse Endpoint */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{t.docs.mediaEndpoint}</span>
              </h4>
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono font-bold border border-emerald-200 dark:border-emerald-500/20">
                POST /api/parse
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-slate-500 dark:text-slate-400 font-mono">{t.docs.requestBody}</p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-cyan-300">
                <pre>{`{\n  "url": "https://www.tiktok.com/@tiktok/video/7106594312292453678"\n}`}</pre>
              </div>

              <p className="text-slate-500 dark:text-slate-400 font-mono">{t.docs.successResponse}</p>
              <div className="relative p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-200">
                <button
                  onClick={() => handleCopy(parseExample, 'parse_example')}
                  className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1"
                >
                  {copiedSection === 'parse_example' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'parse_example' ? t.docs.copied : t.docs.copy}</span>
                </button>
                <pre className="overflow-x-auto">{parseExample}</pre>
              </div>
            </div>
          </div>

          {/* Section 3: Batch Parse Endpoint */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>{t.docs.batchEndpoint}</span>
              </h4>
              <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-mono font-bold border border-sky-200 dark:border-sky-500/20">
                POST /api/batch-parse
              </span>
            </div>

            <p className="text-slate-500 dark:text-slate-400 font-mono">{t.docs.requestBody}</p>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-cyan-300">
              <pre>{`{\n  "urls": [\n    "https://www.tiktok.com/@tiktok/video/7106594312292453678",\n    "https://v.douyin.com/iRS2aYk/"\n  ]\n}`}</pre>
            </div>
          </div>

          {/* Section 4: Download Stream API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{t.docs.downloadEndpoint}</span>
              </h4>
              <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-bold border border-amber-200 dark:border-amber-500/20">
                POST /api/download
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-cyan-300">
              <pre>{`{\n  "original_url": "https://www.tiktok.com/@tiktok/video/7106594312292453678",\n  "format_selector": "137+bestaudio/137"\n}\n\n{\n  "original_url": "https://www.tiktok.com/@tiktok/video/7106594312292453678",\n  "audio_only": true\n}`}</pre>
            </div>
          </div>

          {/* Section 5: Platform List API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>{t.docs.platformsEndpoint}</span>
              </h4>
              <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 font-mono font-bold border border-purple-200 dark:border-purple-500/20">
                GET /api/platforms
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary-pill text-xs font-semibold"
          >
            {t.docs.close}
          </button>
        </div>
      </div>
    </div>
  );
};
