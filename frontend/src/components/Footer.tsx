'use client';

import React from 'react';
import { Github, Heart, Mail, Shield } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SEO_INDEXABLE_KEYS, getSeoPlatform } from '@/lib/platformSeo';
import { OmniMediaLogo } from './OmniMediaLogo';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-slate-950/80 py-12 px-4 sm:px-6 lg:px-8 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Copy */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
          <OmniMediaLogo className="w-8 h-8" />
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white font-mono">OmniMedia</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/20">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.footer.subtitle}
            </p>
          </div>
        </div>

        {/* Links & Disclaimer */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.footer.license}</span>
          </div>

          <a
            href="https://github.com/xubaoer19940428-creator/omni-media"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-cyan-400 transition flex items-center gap-1"
          >
            <Github className="w-3.5 h-3.5" />
            <span>{t.footer.repo}</span>
          </a>

          <a
            href="mailto:xubaoer199400428@gmail.com"
            aria-label={`${t.footer.contact}: xubaoer199400428@gmail.com`}
            className="hover:text-blue-600 dark:hover:text-cyan-400 transition flex items-center gap-1"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{t.footer.contact}</span>
          </a>

          <div className="flex items-center gap-1 text-slate-400">
            <span>{t.footer.madeWith}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>{t.footer.forDevelopers}</span>
          </div>
        </div>
      </div>

      {/* Static internal links keep platform guides discoverable before client hydration. */}
      <nav aria-label="Platform guides" className="max-w-7xl mx-auto mt-8 border-t border-slate-200/80 pt-6 dark:border-white/[0.06]">
        <p className="text-center text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-400">
          Platform guides
        </p>
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
          {SEO_INDEXABLE_KEYS.map((key) => {
            const platform = getSeoPlatform(key);
            if (!platform) return null;
            return (
              <li key={platform.key}>
                <Link
                  href={`/platform/${platform.key}/`}
                  className="transition hover:text-blue-600 dark:hover:text-cyan-300"
                >
                  {platform.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
};
