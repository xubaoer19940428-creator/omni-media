'use client';

import React, { useEffect, useState } from 'react';
import { Activity, BookOpen, ChevronRight, Globe, Github, Layers, Menu, Moon, Sparkles, Sun, Terminal, X } from 'lucide-react';
import { checkBackendHealth } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { OmniMediaLogo } from './OmniMediaLogo';
import { AuthControls } from './AuthControls';

type ActiveTab = 'workbench' | 'batch' | 'playground' | 'platforms';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDocs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenDocs }) => {
  const { lang, setLang, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [platformsCount, setPlatformsCount] = useState(39);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    checkBackendHealth().then((res) => {
      setIsOnline(res.status === 'ok');
      if (res.supported_platforms_count) setPlatformsCount(res.supported_platforms_count);
    }).catch(() => setIsOnline(false));
  }, []);
  useEffect(() => setDrawerOpen(false), [activeTab]);

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ElementType; hint: string }> = [
    { id: 'workbench', label: t.nav.workbench, icon: Sparkles, hint: 'Paste & parse' },
    { id: 'playground', label: t.nav.playground, icon: Terminal, hint: 'REST console' },
    { id: 'batch', label: t.nav.batch, icon: Layers, hint: 'Up to 40 links' },
    { id: 'platforms', label: t.nav.platforms, icon: Globe, hint: `${platformsCount} adapters` },
  ];
  const choose = (id: ActiveTab) => {
    setActiveTab(id);
    setDrawerOpen(false);
    if (id === 'workbench') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const navigation = () => (
    <nav aria-label="Primary navigation" className="space-y-1">
      {navItems.map(({ id, label, icon: Icon, hint }) => {
        const active = activeTab === id;
        return <button key={id} type="button" onClick={() => choose(id)} aria-current={active ? 'page' : undefined} className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${active ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-[3px_3px_0_#bfdbfe] dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200 dark:shadow-[3px_3px_0_rgba(34,211,238,.18)]' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:border-slate-800 dark:hover:bg-slate-900/70 dark:hover:text-white'}`}>
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${active ? 'border-blue-200 bg-white dark:border-cyan-400/30 dark:bg-slate-950' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'}`}><Icon className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{label}</span><span className="block truncate font-mono text-[10px] uppercase tracking-wider opacity-60">{hint}</span></span>
          <ChevronRight className={`h-4 w-4 transition-transform ${active ? 'translate-x-0.5' : 'opacity-0 group-hover:translate-x-0.5 group-hover:opacity-60'}`} />
        </button>;
      })}
    </nav>
  );
  const utility = <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60"><div className="flex min-w-0 items-center gap-2"><Activity className={`h-4 w-4 shrink-0 ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`} /><div className="min-w-0"><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{isOnline ? t.nav.systemNormal : isOnline === null ? t.nav.systemChecking : t.nav.engineConnecting}</p><p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">same-origin API</p></div></div><span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} /></div>
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={toggleTheme} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400/40" aria-label="Toggle theme">{theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}{theme === 'light' ? 'Dark' : 'Light'}</button><button type="button" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400/40" aria-label="Select language"><Globe className="h-3.5 w-3.5" />{lang === 'en' ? '中文' : 'EN'}</button></div>
    <div className="flex items-center justify-between gap-2"><button type="button" onClick={onOpenDocs} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300"><BookOpen className="h-3.5 w-3.5" />{t.nav.docs}</button><a href="https://github.com/xubaoer19940428-creator/omni-media" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"><Github className="h-3.5 w-3.5" />GitHub</a></div>
  </div>;
  const panel = () => <div className="flex h-full flex-col p-6"><button type="button" onClick={() => choose('workbench')} className="flex items-center gap-3 text-left" aria-label="Open workbench"><div className="relative shrink-0"><OmniMediaLogo className="h-10 w-10" /><span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#07090e] ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} /></div><div><div className="font-mono text-lg font-black tracking-tight text-slate-950 dark:text-white">Omni<span className="text-blue-600 dark:text-cyan-400">Media</span></div><div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">media workspace · v2.0</div></div></button><div className="mt-8">{navigation()}</div><a href="/pricing/" className="mt-5 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-xs font-bold text-amber-900 transition hover:-translate-y-0.5 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"><span><span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">Creator plan</span><span className="text-sm">¥9.90 / month · unlimited</span></span><ChevronRight className="h-4 w-4" /></a><div className="mt-auto space-y-4"><AuthControls />{utility}</div></div>;

  return <><aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-slate-200 bg-white/95 shadow-[8px_0_0_rgba(15,23,42,.03)] backdrop-blur-xl dark:border-slate-800 dark:bg-[#07090e]/95 lg:block">{panel()}</aside><div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-[#07090e]/90 lg:hidden"><button type="button" onClick={() => choose('workbench')} className="flex items-center gap-2" aria-label="Open workbench"><OmniMediaLogo className="h-8 w-8" /><span className="font-mono text-sm font-black text-slate-950 dark:text-white">Omni<span className="text-blue-600 dark:text-cyan-400">Media</span></span></button><button type="button" onClick={() => setDrawerOpen((open) => !open)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300" aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={drawerOpen}>{drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>{drawerOpen && <><button type="button" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} /><aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-[#07090e] lg:hidden">{panel()}</aside></>}</>;
};
