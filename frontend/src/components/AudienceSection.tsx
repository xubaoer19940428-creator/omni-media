'use client';

import React from 'react';
import { ArrowRight, ArrowUpRight, Check, Code2, Sparkles, Users } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { AccountSnapshot, getAccount } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface AudienceSectionProps {
  onStartParsing: () => void;
  onExploreApi: () => void;
}

function CreatorAudienceCard({ member = false }: { member?: boolean }) {
  const { t, lang } = useTranslation();
  const creatorItems = member ? t.audience.creatorItems.slice(0, 2) : t.audience.creatorItems;
  return (
    <div className={`rounded-2xl border p-5 ${member ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/70'}`}>
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${member ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300'}`}><Users className="h-5 w-5" /></div>
      <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">{t.audience.creatorTitle}</h3>
      <ul className="mt-4 space-y-2.5 text-xs leading-5 text-slate-600 dark:text-slate-400">
        {creatorItems.map((item) => (
          <li key={item} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{item}</li>
        ))}
      </ul>
      {member ? (
        <a href="/account/" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-300">{lang === 'zh' ? '会员已激活' : 'Membership active'} <ArrowRight className="h-3.5 w-3.5" /></a>
      ) : (
        <a href="/pricing/" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-cyan-300">{t.audience.seePlan} <ArrowRight className="h-3.5 w-3.5" /></a>
      )}
    </div>
  );
}

function ConfiguredCreatorAudienceCard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { t } = useTranslation();
  const [membership, setMembership] = React.useState<'checking' | 'member' | 'free'>('checking');

  React.useEffect(() => {
    let active = true;
    if (!isLoaded || !isSignedIn) {
      setMembership(isLoaded ? 'free' : 'checking');
      return () => { active = false; };
    }
    getAccount(getToken)
      .then((account: AccountSnapshot) => {
        if (active) setMembership(account.plan?.unlimited ? 'member' : 'free');
      })
      .catch(() => {
        // Stay neutral while the account endpoint is unavailable so a member
        // is never shown the free-limit or upgrade prompt by mistake.
        if (active) setMembership('checking');
      });
    return () => { active = false; };
  }, [getToken, isLoaded, isSignedIn]);

  if (membership === 'checking') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/70">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><Users className="h-5 w-5" /></div>
        <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">{t.audience.creatorTitle}</h3>
        <p className="mt-4 text-xs leading-5 text-slate-500" aria-live="polite">Checking membership status…</p>
      </div>
    );
  }

  return <CreatorAudienceCard member={membership === 'member'} />;
}

export const AudienceSection: React.FC<AudienceSectionProps> = ({ onStartParsing, onExploreApi }) => {
  const { t } = useTranslation();

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_22px_70px_-30px_rgba(37,99,235,.35)] dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-[0_24px_80px_-34px_rgba(0,242,254,.3)]">
        <div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative overflow-hidden p-6 sm:p-10 lg:p-12">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl dark:bg-cyan-400/10" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                {t.audience.eyebrow}
              </div>
              <h2 className="mt-5 max-w-xl text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {t.audience.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                {t.audience.subtitle}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={onStartParsing} className="btn-gradient-pill inline-flex items-center gap-2 text-xs">
                  {t.audience.tryNow}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={onExploreApi} className="btn-secondary-pill inline-flex items-center gap-2 text-xs">
                  {t.audience.exploreApi}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
                {t.audience.trustLine}
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-200 bg-slate-50/80 p-6 sm:grid-cols-2 sm:p-10 lg:border-l lg:border-t-0 lg:p-12 dark:border-slate-800 dark:bg-slate-900/50">
            {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <ConfiguredCreatorAudienceCard /> : <CreatorAudienceCard />}

            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300"><Code2 className="h-5 w-5" /></div>
              <h3 className="mt-4 text-base font-black">{t.audience.developerTitle}</h3>
              <ul className="mt-4 space-y-2.5 text-xs leading-5 text-slate-300 dark:text-slate-300">
                {t.audience.developerItems.map((item) => (
                  <li key={item} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />{item}</li>
                ))}
              </ul>
              <button type="button" onClick={onExploreApi} className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:underline">{t.audience.openPlayground} <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
