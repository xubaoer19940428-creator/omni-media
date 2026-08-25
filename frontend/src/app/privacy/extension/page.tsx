'use client';

import { Moon, Sun } from 'lucide-react';
import { OmniMediaLogo } from '@/components/OmniMediaLogo';
import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function ExtensionPrivacyPage() {
  const { lang, setLang, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const policy = t.extensionPrivacy;

  return (
    <main className="relative z-10 min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-[#0c1018] dark:shadow-black/30">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10 sm:px-8">
          <a href="/" className="group" aria-label="OmniMedia home">
            <OmniMediaLogo className="h-8 w-8" showText />
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <div className="px-5 py-8 sm:px-10 sm:py-12">
          <p className="font-mono text-xs font-bold tracking-[0.16em] text-blue-600 dark:text-cyan-400">{policy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{policy.title}</h1>
          <p className="mt-3 font-mono text-xs text-slate-500 dark:text-slate-500">{policy.updated}</p>
          <p className="mt-6 text-sm leading-7 text-slate-600 dark:text-slate-300">{policy.intro}</p>

          <div className="mt-10 space-y-9">
            <PolicySection title={policy.scopeTitle}><p>{policy.scopeBody}</p></PolicySection>
            <PolicySection title={policy.sentTitle}>
              <ul>{policy.sentItems.map((item) => <li key={item}>{item}</li>)}</ul>
            </PolicySection>
            <PolicySection title={policy.localTitle}><p>{policy.localBody}</p></PolicySection>
            <PolicySection title={policy.retentionTitle}><p>{policy.retentionBody}</p></PolicySection>
            <PolicySection title={policy.permissionsTitle}>
              <ul>{policy.permissionsItems.map((item) => <li key={item}>{item}</li>)}</ul>
            </PolicySection>
            <PolicySection title={policy.controlTitle}><p>{policy.controlBody}</p></PolicySection>
            <PolicySection title={policy.contactTitle}>
              <p>{policy.contactBody}</p>
              <a className="mt-3 inline-flex font-semibold text-blue-600 hover:underline dark:text-cyan-400" href="https://github.com/xubaoer19940428-creator/omni-media/issues" target="_blank" rel="noreferrer">{policy.contactLink}</a>
            </PolicySection>
          </div>

          <a className="mt-10 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950" href="/">{policy.back}</a>
        </div>
      </article>
    </main>
  );
}

function PolicySection({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="border-t border-slate-200 pt-6 dark:border-white/10">
      <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 marker:text-blue-600 dark:text-slate-300 dark:marker:text-cyan-400 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">{children}</div>
    </section>
  );
}
