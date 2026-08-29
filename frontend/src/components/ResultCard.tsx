'use client';

import React, { useEffect, useState } from 'react';
import {
  Film,
  Image as ImageIcon,
  Music,
  Info,
  Code,
  Download,
  ExternalLink,
  Copy,
  Check,
  Heart,
  Eye,
  MessageCircle,
  Share2,
  User,
  AlertCircle
} from 'lucide-react';
import { ParsedMedia } from '@/types';
import { getProxyImageUrl, triggerServerDownload } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface ResultCardProps {
  data: ParsedMedia;
  onClear?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data, onClear }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'video' | 'gallery' | 'audio' | 'meta' | 'json'>('video');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isServerDownloading, setIsServerDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [videoPreviewFailed, setVideoPreviewFailed] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [audioOnly, setAudioOnly] = useState(false);

  useEffect(() => {
    setVideoPreviewFailed(false);
    setSelectedFormat('');
    setAudioOnly(data.media_type === 'audio' && !!data.audio_url);
    if ((data.media_type === 'gallery' || data.media_type === 'image') && data.images?.length) {
      setActiveTab('gallery');
    } else if (data.media_type === 'audio' && data.audio_url) {
      setActiveTab('audio');
    } else {
      setActiveTab('video');
    }
  }, [data.video_url, data.media_type, data.images, data.audio_url]);

  const hasImages = data.images && data.images.length > 0;
  const hasAudio = !!data.audio_url;
  const authorName = typeof data.author === 'string' ? data.author : data.author?.nickname || data.author?.name || 'Creator';
  const authorAvatar = typeof data.author === 'object' ? data.author?.avatar : undefined;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleServerSideDownload = async (override?: { audioOnly?: boolean; formatSelector?: string }) => {
    if (!data.original_url && !data.video_url) return;
    const downloadWindow = window.open('about:blank', '_blank');
    if (downloadWindow) downloadWindow.opener = null;
    setIsServerDownloading(true);
    setDownloadError(null);
    try {
      const res = await triggerServerDownload(data.original_url || data.video_url || '', {
        formatSelector: override?.formatSelector ?? (selectedFormat || undefined),
        audioOnly: override?.audioOnly ?? audioOnly,
      });
      if (downloadWindow) {
        downloadWindow.location.href = res.download_url;
      } else {
        window.location.href = res.download_url;
      }
    } catch (err: any) {
      downloadWindow?.close();
      setDownloadError(err.message || 'Server processing failed');
    } finally {
      setIsServerDownloading(false);
    }
  };

  const availableFormats = (data.formats || data.sources || [])
    .filter((format) => (format.format_id || format.id) && format.url && format.vcodec !== 'none')
    .slice(0, 12);

  return (
    <div className="w-full tikhub-panel rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xl overflow-hidden animate-in fade-in duration-300">
      {/* macOS Terminal Bar */}
      <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="mac-dot mac-dot-red"></span>
            <span className="mac-dot mac-dot-yellow"></span>
            <span className="mac-dot mac-dot-green"></span>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/20 font-mono">
              {data.platform || 'Universal'}
            </span>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
              {data.title || t.workbench.untitled}
            </h3>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'video'
                ? 'bg-white dark:bg-slate-100 text-slate-900 dark:text-slate-950 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>{t.result.video}</span>
          </button>

          {hasImages && (
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'gallery'
                  ? 'bg-white dark:bg-slate-100 text-slate-900 dark:text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{t.result.gallery} ({data.images?.length})</span>
            </button>
          )}

          {hasAudio && (
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'audio'
                  ? 'bg-white dark:bg-slate-100 text-slate-900 dark:text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>{t.result.audio}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('meta')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'meta'
                ? 'bg-white dark:bg-slate-100 text-slate-900 dark:text-slate-950 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>{t.result.meta}</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'json'
                ? 'bg-white dark:bg-slate-100 text-slate-900 dark:text-slate-950 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{t.result.json}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {/* TAB 1: VIDEO */}
        {activeTab === 'video' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Player Container */}
            <div className="lg:col-span-7 bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center relative min-h-[340px]">
              {data.video_url && !videoPreviewFailed ? (
                <video
                  src={data.video_url}
                  poster={getProxyImageUrl(data.cover || data.cover_url)}
                  controls
                  playsInline
                  preload="metadata"
                  onError={() => setVideoPreviewFailed(true)}
                  className="w-full max-h-[480px] object-contain rounded-2xl"
                />
              ) : data.cover || data.cover_url ? (
                <div className="relative w-full h-[360px] flex items-center justify-center">
                  <img
                    src={getProxyImageUrl(data.cover || data.cover_url)}
                    alt={data.title || 'Cover'}
                    className="w-full h-full object-cover rounded-2xl opacity-60"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    {videoPreviewFailed ? (
                      <>
                        <AlertCircle className="w-12 h-12 text-amber-400 mb-2" />
                        <p className="max-w-sm text-center text-sm font-semibold text-white">{t.result.previewFailed}</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-blue-400 dark:text-cyan-400 mb-2" />
                        <p className="text-sm font-semibold text-white">{hasImages ? t.result.photoCarouselNote : t.result.noVideoPreview}</p>
                        {hasImages && (
                          <button
                            onClick={() => setActiveTab('gallery')}
                            className="mt-3 btn-gradient-pill text-xs font-semibold"
                          >
                            {t.result.viewAllPhotos} ({data.images?.length || 0})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Film className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">{t.result.noVideoPreview}</p>
                </div>
              )}
            </div>

            {/* Video Meta & Download Controls */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              {/* Creator Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  {authorAvatar ? (
                    <img
                      src={getProxyImageUrl(authorAvatar)}
                      alt={authorName}
                      className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-cyan-950 border border-blue-200 dark:border-cyan-800/60 flex items-center justify-center text-blue-600 dark:text-cyan-300 font-bold">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{authorName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{t.result.duration} {data.duration_string || `${data.duration || 0}s`}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {data.description || data.title || t.result.noDesc}
                </p>

                {/* Metrics Badges */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-850">
                    <Heart className="w-3.5 h-3.5 text-pink-500 mx-auto mb-1" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono">
                      {data.likes ? Number(data.likes).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-850">
                    <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 mx-auto mb-1" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono">
                      {data.views ? Number(data.views).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-850">
                    <MessageCircle className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono">
                      {data.comments ? Number(data.comments).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-850">
                    <Share2 className="w-3.5 h-3.5 text-indigo-500 mx-auto mb-1" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono">
                      {data.shares ? Number(data.shares).toLocaleString() : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {(availableFormats.length > 0 || hasAudio) && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="download-format" className="sr-only">{t.result.downloadOptions}</label>
                    <select
                      id="download-format"
                      value={audioOnly ? '__audio__' : selectedFormat}
                      onChange={(event) => {
                        const value = event.target.value;
                        setAudioOnly(value === '__audio__');
                        setSelectedFormat(value === '__audio__' ? '' : value);
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-cyan-500/60"
                    >
                      <option value="">{t.result.bestQuality}</option>
                      {availableFormats.map((format, index) => {
                        const formatId = format.format_id || format.id || '';
                        const selector = format.acodec === 'none' && formatId
                          ? `${formatId}+bestaudio/${formatId}`
                          : formatId;
                        return (
                          <option key={`${formatId || index}`} value={selector}>
                            {format.format_note || format.resolution || format.quality || format.ext || t.result.videoFormat}
                          </option>
                        );
                      })}
                      {hasAudio && <option value="__audio__">{t.result.audioOnly}</option>}
                    </select>
                  </div>
                )}
                <button
                  onClick={() => { void handleServerSideDownload(); }}
                  disabled={isServerDownloading}
                  className="w-full btn-primary-pill text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isServerDownloading ? t.result.serverProcessing : audioOnly ? t.result.downloadAudio : t.result.downloadMp4}</span>
                </button>

                {downloadError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{downloadError}</span>
                  </div>
                )}

                {/* Quick Copy Links */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(data.video_url || '', 'video_url')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    {copiedField === 'video_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedField === 'video_url' ? t.result.copied : t.result.copyDirectLink}</span>
                  </button>

                  <button
                    onClick={() => handleCopy(data.title || '', 'title')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    {copiedField === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedField === 'title' ? t.result.copied : t.result.copyCaption}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{t.result.foundPhotos} ({data.images?.length || 0})</span>
              <button
                onClick={() => {
                  data.images?.forEach((img) => window.open(img, '_blank'));
                }}
                className="btn-gradient-pill text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.result.openAllTabs}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.images?.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md"
                >
                  <img
                    src={getProxyImageUrl(img)}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5">
                    <span className="text-xs font-bold text-white font-mono">#{idx + 1}</span>
                    <a
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white backdrop-blur transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIO */}
        {activeTab === 'audio' && (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 mx-auto">
              <Music className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{data.audio_title || data.title || t.result.audioTrackTitle}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{authorName}</p>
            </div>

            {data.audio_url && (
              <audio src={data.audio_url} controls className="w-full mt-2" />
            )}

            <div className="flex gap-3 pt-2">
              {data.audio_url && (
                <button
                  type="button"
                  onClick={() => {
                    setAudioOnly(true);
                    setSelectedFormat('');
                    void handleServerSideDownload({ audioOnly: true });
                  }}
                  disabled={isServerDownloading}
                  className="flex-1 btn-primary-pill text-xs flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isServerDownloading ? t.result.serverProcessing : t.result.downloadAudio}</span>
                </button>
              )}
              <button
                onClick={() => handleCopy(data.audio_url || '', 'audio_url')}
                className="btn-secondary-pill text-xs flex items-center gap-1.5"
              >
                {copiedField === 'audio_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{t.result.copyAudioUrl}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: META */}
        {activeTab === 'meta' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider font-mono">{t.result.platformMetrics}</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{t.result.platform}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{data.platform}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{t.result.author}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{authorName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{t.result.duration}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{data.duration_string || `${data.duration || 0}s`}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{t.result.likes}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{data.likes || 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{t.result.comments}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{data.comments || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider font-mono">{t.result.descAndTags}</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap font-sans">
                {data.description || data.title || t.result.noDesc}
              </p>
              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {data.tags.map((tagItem, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-[11px] text-blue-600 dark:text-cyan-300 border border-slate-200 dark:border-slate-800 font-mono">
                      #{tagItem}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: JSON */}
        {activeTab === 'json' && (
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-5 font-mono text-xs text-cyan-300 overflow-x-auto max-h-[500px] shadow-inner">
            <button
              onClick={() => handleCopy(JSON.stringify(data, null, 2), 'json_all')}
              className="absolute top-3.5 right-3.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition"
            >
              {copiedField === 'json_all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{t.result.copyJson}</span>
            </button>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
