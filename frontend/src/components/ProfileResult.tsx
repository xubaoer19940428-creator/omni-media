'use client';

import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Eye,
  BadgeCheck,
  Heart,
  Link2,
  Loader2,
  UsersRound,
  Video,
  UserRound,
} from 'lucide-react';
import { ProfileParseResponse } from '@/types';
import { getProxyImageUrl } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { PlatformIcon } from './PlatformIcons';

interface ProfileResultProps {
  data: ProfileParseResponse;
  loadingMore: boolean;
  onParseItem: (url: string) => void;
  onLoadMore: () => void;
}

function compactNumber(value?: number) {
  if (!value) return '0';
  return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(value);
}

function formatDuration(seconds?: number) {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function formatDate(value?: string | number) {
  if (!value) return '';
  const raw = typeof value === 'number'
    ? new Date(value * 1000)
    : /^\d{8}$/.test(value)
      ? new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`)
      : new Date(value);
  return Number.isNaN(raw.getTime()) ? '' : raw.toLocaleDateString();
}

export const ProfileResult: React.FC<ProfileResultProps> = ({
  data,
  loadingMore,
  onParseItem,
  onLoadMore,
}) => {
  const { t } = useTranslation();
  const profile = data.profile || {};
  const platformKey = data.platform_key || data.platform || 'unknown';
  const showingText = t.profile.showing.replace('{count}', String(data.items.length));
  const stats = [
    { label: t.profile.following, value: profile.following, icon: UsersRound },
    { label: t.profile.followers, value: profile.followers, icon: UserRound },
    { label: t.profile.likes, value: profile.likes, icon: Heart },
    { label: t.profile.posts, value: profile.posts, icon: Video },
  ].filter(({ value }) => typeof value === 'number' && value > 0);

  return (
    <section className="tikhub-panel overflow-hidden rounded-2xl border border-slate-200 shadow-xl dark:border-slate-700/80">
      <div className="border-b border-slate-200 bg-slate-50/90 px-5 py-5 dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-cyan-400">
            {profile.avatar ? (
              <img
                src={getProxyImageUrl(profile.avatar)}
                alt={profile.name || t.profile.summary}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-5 w-5" />
            )}
            <span className="absolute bottom-1 right-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-950">
              <PlatformIcon platformKey={platformKey} className="h-3 w-3" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-cyan-400">
              {t.profile.summary}
            </p>
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {profile.name || data.platform_name || t.profile.creatorMode}
              </h3>
              {profile.verified ? (
                <BadgeCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-cyan-400" aria-label={t.profile.verified} />
              ) : null}
            </div>
            {profile.handle && (
              <p className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`}
              </p>
            )}
            {profile.description ? (
              <p className="mt-2 line-clamp-3 max-w-2xl whitespace-pre-line text-xs leading-5 text-slate-600 dark:text-slate-300">
                {profile.description}
              </p>
            ) : null}
            {profile.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2 inline-flex max-w-full items-center gap-1.5 text-[11px] font-medium text-blue-600 transition hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                <Link2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{profile.website.replace(/^https?:\/\/(?:www\.)?/, '')}</span>
              </a>
            ) : null}
          </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            {stats.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
                {stats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="min-w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                      <Icon className="h-3 w-3" />
                      {label}
                    </div>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {compactNumber(value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            {profile.url && (
              <a
                href={profile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:text-cyan-400"
              >
                {t.profile.openProfile}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {data.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => {
              const itemUrl = item.original_url || '';
              const date = formatDate(item.created_at);
              return (
                <article key={`${item.video_id || itemUrl}`} className="tikhub-card group overflow-hidden rounded-xl">
                  <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900">
                    {item.cover_url || item.cover ? (
                      <img
                        src={getProxyImageUrl(item.cover_url || item.cover)}
                        alt={item.title || t.workbench.untitled}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-blue-600 dark:text-cyan-400">
                        <PlatformIcon platformKey={platformKey} className="h-7 w-7 opacity-70" />
                      </div>
                    )}
                    {item.duration ? (
                      <span className="absolute bottom-2 right-2 rounded-md bg-slate-950/80 px-1.5 py-0.5 font-mono text-[9px] text-white backdrop-blur">
                        {formatDuration(item.duration)}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-3 p-3.5">
                    <h4 className="line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-slate-900 dark:text-slate-100">
                      {item.title || t.workbench.untitled}
                    </h4>
                    <div className="flex min-h-4 items-center gap-3 font-mono text-[9px] text-slate-400 dark:text-slate-500">
                      {date && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{date}</span>}
                      {item.views ? <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{compactNumber(item.views)}</span> : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onParseItem(itemUrl)}
                        disabled={!itemUrl}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-500/20 dark:bg-cyan-500/[0.07] dark:text-cyan-300 dark:hover:bg-cyan-500/[0.12]"
                      >
                        {t.profile.parseItem}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <a
                        href={itemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t.profile.openProfile}
                        className="flex h-8 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-cyan-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {t.profile.noItems}
          </p>
        )}

        <div className="flex flex-col items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/80">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
            {showingText}
          </p>
          {data.has_more && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:text-cyan-400"
            >
              {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {t.profile.loadMore}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
