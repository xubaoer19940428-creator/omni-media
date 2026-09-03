'use client';

import React, { useRef } from 'react';
import {
  Bot,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface McpBentoSectionProps {
  onExplorePlayground: () => void;
}

export const McpBentoSection: React.FC<McpBentoSectionProps> = ({ onExplorePlayground }) => {
  const { lang } = useTranslation();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pt-12">
      {/* Section Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-indigo-500/10 border border-blue-200 dark:border-indigo-500/20 text-xs text-blue-700 dark:text-indigo-400 font-mono font-medium">
          <Bot className="w-3.5 h-3.5 animate-bounce" />
          <span>{lang === 'zh' ? '开发者 API 与结构化数据' : 'DEVELOPER API & STRUCTURED DATA'}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {lang === 'zh' ? '一个接口连接 39 个平台解析器' : 'One API for 39 Platform Parsers'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {lang === 'zh'
            ? '使用同源 REST API 解析公开媒体链接，获得统一 JSON 字段，并在需要时发起服务端下载。'
            : 'Parse public media links through a same-origin REST API, receive normalized JSON fields, and request server-side downloads when needed.'}
        </p>
      </div>

      {/* Bento Grid with Interactive Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Bento 1: Natural Language MCP & AI Agent */}
        <div
          onMouseMove={handleMouseMove}
          className="md:col-span-2 tikhub-card rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 relative overflow-hidden group"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 text-blue-600 dark:text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-blue-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
                {lang === 'zh' ? 'REST API 集成' : 'REST API INTEGRATION'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {lang === 'zh' ? '用稳定的 JSON 契约接入你的应用' : 'Connect Your App with a Stable JSON Contract'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {lang === 'zh'
                ? '单条解析、批量解析和服务端下载使用一致的 HTTP 约定；API 调试台可直接试跑并复制多语言示例。'
                : 'Single parse, batch parse, and server-side download follow consistent HTTP conventions. Test them live and copy multi-language examples in the playground.'}
            </p>
          </div>

          {/* Code preview block */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-slate-500 text-[11px] pb-2 border-b border-slate-900">
              <span>POST /api/parse</span>
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
            </div>
            <p className="text-slate-400">{'>'} {'{'} "url": "https://www.youtube.com/watch?v=..." {'}'}</p>
            <p className="text-cyan-400">{'{'} "success": true, "platform_key": "youtube", "video_url": "https://..." {'}'}</p>
          </div>
        </div>

        {/* Bento 2: High-Bitrate Direct Media Extractor */}
        <div
          onMouseMove={handleMouseMove}
          className="tikhub-card rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 group"
        >
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 w-fit">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'zh' ? '统一响应字段' : 'Normalized Response Fields'}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'zh'
                ? '不同平台的解析结果统一映射为标题、作者、封面、媒体直链、时长和互动数据等常用字段。'
                : 'Results from different platforms map to common fields for title, author, cover, media URL, duration, and engagement data.'}
            </p>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Platform</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">platform_key</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Media</span>
              <span className="text-blue-600 dark:text-cyan-400 font-bold">video_url</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Metadata</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">title · author · views</span>
            </div>
          </div>
        </div>

        {/* Bento 3: 39-platform scraper core */}
        <div
          onMouseMove={handleMouseMove}
          className="tikhub-card rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 group"
        >
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-fit">
              <Cpu className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'zh' ? '39 个平台注册解析器' : '39 Registered Platform Parsers'}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'zh'
                ? '平台注册表是前后端共同的能力基线；平台状态接口会返回当前支持列表和匹配规则。'
                : 'The platform registry is the shared capability baseline. The status endpoint returns the current parser list and matching rules.'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={onExplorePlayground}
              className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 group/btn"
            >
              <span>{lang === 'zh' ? '进入 API 调试台' : 'Explore API Playground'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bento 4: High-Concurrency Batch Pipeline */}
        <div
          onMouseMove={handleMouseMove}
          className="md:col-span-2 tikhub-card rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 group"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                {lang === 'zh' ? '受控批量流水线' : 'BOUNDED BATCH PIPELINE'}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {lang === 'zh' ? '按输入顺序处理批量链接' : 'Process Link Batches in Input Order'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {lang === 'zh'
                ? '队列最多录入 40 条链接，每个请求最多发送 10 条；后端并发受限，返回结果保持输入顺序。'
                : 'Queue up to 40 links, send at most 10 per request, and preserve input order while backend concurrency remains bounded.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono hover:border-blue-500/40 transition">
              10 URLs / Request
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono hover:border-blue-500/40 transition">
              Trusted-Origin CORS
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono hover:border-blue-500/40 transition">
              RESTful JSON Schema
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
