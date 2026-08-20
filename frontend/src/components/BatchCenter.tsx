'use client';

import React, { useState } from 'react';
import {
  Layers,
  Play,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  ExternalLink,
  Plus,
  FileJson,
  Check
} from 'lucide-react';
import { BatchTaskItem, ParsedMedia } from '@/types';
import { extractUrlFromText, batchParseMediaUrls, triggerServerDownload, MAX_BATCH_QUEUE_SIZE } from '@/lib/api';
import { SUPPORTED_PLATFORMS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n';
import { PlatformIcon } from './PlatformIcons';

export const BatchCenter: React.FC = () => {
  const { t, lang } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [tasks, setTasks] = useState<BatchTaskItem[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [inputError, setInputError] = useState('');

  const handleAddUrls = () => {
    if (!inputText.trim()) return;

    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const remainingSlots = MAX_BATCH_QUEUE_SIZE - tasks.length;
    if (remainingSlots <= 0 || lines.length > remainingSlots) {
      setInputError(t.batch.queueLimit.replace('{max}', String(MAX_BATCH_QUEUE_SIZE)));
      return;
    }

    const newTasks: BatchTaskItem[] = lines.map((line) => {
      const { url, platformKey } = extractUrlFromText(line);
      const platformObj = SUPPORTED_PLATFORMS.find((p) => p.key === platformKey);
      return {
        id: Math.random().toString(36).substring(2, 9),
        rawInput: line,
        extractedUrl: url,
        platformKey,
        platformName: platformObj?.name || 'Social Media',
        status: 'idle',
      };
    });

    setTasks((prev) => [...prev, ...newTasks]);
    setInputText('');
    setInputError('');
  };

  const processAllTasks = async () => {
    if (tasks.length === 0) return;

    setIsProcessingAll(true);
    // Mark all idle/error as parsing
    setTasks((prev) =>
      prev.map((t) => (t.status === 'idle' || t.status === 'error' ? { ...t, status: 'parsing', error: undefined } : t))
    );

    const tasksToParse = tasks.filter(
      (task) => task.status === 'idle' || task.status === 'error' || task.status === 'parsing'
    );
    const urlsToParse = tasksToParse.map((task) => task.extractedUrl);

    try {
      // High-speed parallel backend batch endpoint
      const response = await batchParseMediaUrls(urlsToParse);

      // The endpoint preserves input order, so URL normalization cannot break mapping.
      setTasks((prev) =>
        prev.map((task) => {
          const resultIndex = tasksToParse.findIndex((candidate) => candidate.id === task.id);
          const matchedResult = resultIndex >= 0 ? response.results[resultIndex] : undefined;

          if (matchedResult) {
            if (matchedResult.success) {
              return {
                ...task,
                status: 'success',
                result: matchedResult as ParsedMedia,
              };
            } else {
              return {
                ...task,
                status: 'error',
                error: matchedResult.error || 'Parsing failed',
              };
            }
          }
          return task;
        })
      );
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) => (t.status === 'parsing' ? { ...t, status: 'error', error: err.message || 'Batch parsing failed' } : t))
      );
    } finally {
      setIsProcessingAll(false);
    }
  };

  const downloadTaskMedia = async (task: BatchTaskItem) => {
    if (task.extractedUrl) {
      const downloadWindow = window.open('about:blank', '_blank');
      if (downloadWindow) downloadWindow.opener = null;
      try {
        const res = await triggerServerDownload(task.extractedUrl);
        if (downloadWindow) {
          downloadWindow.location.href = res.download_url;
        } else {
          window.location.href = res.download_url;
        }
      } catch (err: any) {
        downloadWindow?.close();
        alert(err.message || 'Download failed');
      }
    }
  };

  const exportAllJson = () => {
    const successData = tasks.filter((t) => t.status === 'success' && t.result).map((t) => t.result);
    navigator.clipboard.writeText(JSON.stringify(successData, null, 2));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const clearAllTasks = () => {
    setTasks([]);
  };

  const successCount = tasks.filter((t) => t.status === 'success').length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 text-xs text-blue-600 dark:text-cyan-400 font-mono font-medium">
          <Layers className="w-3.5 h-3.5" />
          <span>{t.batch.tag}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{t.batch.title}</h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          {t.batch.subtitle}
        </p>
      </div>

      {/* Input Form */}
      <div className="tikhub-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block font-mono">
          {t.batch.inputLabel}
        </label>
        <textarea
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setInputError('');
          }}
          placeholder={`https://www.tiktok.com/@user/video/123456\nhttps://v.douyin.com/xxx/\nhttps://www.instagram.com/p/xxx/\nhttps://www.youtube.com/watch?v=xxx`}
          className="w-full h-32 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none font-mono shadow-inner"
        />

        {inputError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-mono" role="alert">
            {inputError}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {inputText.split('\n').filter((l) => l.trim()).length} {t.batch.urlsReady} · {tasks.length}/{MAX_BATCH_QUEUE_SIZE}
          </span>
          <button
            onClick={handleAddUrls}
            disabled={!inputText.trim()}
            className="btn-secondary-pill text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span>{t.batch.addToQueue}</span>
          </button>
        </div>
      </div>

      {/* Queue Action Bar */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-mono">
            <span className="font-semibold text-slate-900 dark:text-white">{t.batch.queueStatus}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{t.batch.total} {tasks.length}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              {t.batch.completed} {successCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {successCount > 0 && (
              <button
                onClick={exportAllJson}
                className="btn-secondary-pill text-xs flex items-center gap-1.5"
                title="Export all parsed JSON to clipboard"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileJson className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{copiedAll ? (lang === 'zh' ? '已复制 JSON' : 'JSON Copied') : (lang === 'zh' ? '导出批量 JSON' : 'Export JSON')}</span>
              </button>
            )}

            <button
              onClick={processAllTasks}
              disabled={isProcessingAll || tasks.every((t) => t.status === 'success')}
              className="btn-gradient-pill text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.batch.processingQueue}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t.batch.startBatch}</span>
                </>
              )}
            </button>

            <button
              onClick={clearAllTasks}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 transition"
              title="Clear queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Task List Cards */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="tikhub-card rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-3 overflow-hidden w-full sm:w-2/3">
              {/* Status Badge */}
              <div className="shrink-0">
                {task.status === 'idle' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs font-mono">
                    •
                  </div>
                )}
                {task.status === 'parsing' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 flex items-center justify-center text-blue-600 dark:text-cyan-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
                {task.status === 'success' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {task.status === 'error' && (
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* URL & Meta */}
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1 shrink-0">
                    <PlatformIcon platformKey={task.platformKey} className="w-3 h-3" />
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {task.platformName}
                    </span>
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {task.result?.title || task.extractedUrl}
                  </p>
                </div>
                {task.error && <p className="text-[11px] text-rose-500 truncate mt-0.5">{task.error}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {task.status === 'success' && (
                <button
                  onClick={() => downloadTaskMedia(task)}
                  className="btn-primary-pill text-xs py-1 px-3 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.batch.download}</span>
                </button>
              )}

              {task.result?.video_url && (
                <a
                  href={task.result.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
