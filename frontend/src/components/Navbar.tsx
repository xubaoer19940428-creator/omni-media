'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  ChevronRight,
  CreditCard,
  Globe,
  Github,
  Layers,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Sun,
  Terminal,
  UserRound,
  X,
} from 'lucide-react';
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
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const SIDEBAR_STORAGE_KEY = 'omnimedia_sidebar_collapsed';

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDocs,
  collapsed = false,
  onCollapsedChange,
}) => {
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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved !== null) onCollapsedChange?.(saved === '1');
    } catch {
      // Local storage can be disabled; the sidebar remains usable in memory.
    }
  }, [onCollapsedChange]);

  useEffect(() => setDrawerOpen(false), [activeTab]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    onCollapsedChange?.(next);
    try { window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0'); } catch {}
  };

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

  const navigation = (compact = collapsed) => (
    <nav aria-label="Primary navigation" className="space-y-1.5">
      {navItems.map(({ id, label, icon: Icon, hint }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => choose(id)}
            aria-current={active ? 'page' : undefined}
            title={compact ? label : undefined}
            className={`group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${active
              ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-[3px_3px_0_#bfdbfe] dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200 dark:shadow-[3px_3px_0_rgba(34,211,238,.18)]'
              : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:border-slate-800 dark:hover:bg-slate-900/70 dark:hover:text-white'}`}
          >
            {active && <span className="absolute -left-px top-3 bottom-3 w-0.5 rounded-full bg-blue-600 dark:bg-cyan-300" />}
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors ${active ? 'border-blue-200 bg-white dark:border-cyan-400/30 dark:bg-slate-950' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'}`}>
              <Icon className="h-4 w-4" />
            </span>
            {!compact && <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{label}</span><span className="block truncate font-mono text-[10px] uppercase tracking-wider opacity-60">{hint}</span></span>}
            {!compact && <ChevronRight className={`h-4 w-4 transition-transform ${active ? 'translate-x-0.5' : 'opacity-0 group-hover:translate-x-0.5 group-hover:opacity-60'}`} />}
          </button>
        );
      })}
    </nav>
  );

  const utility = (compact = collapsed) => (
    <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
      <div className={`flex items-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 ${compact ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'}`} title={compact ? (isOnline ? t.nav.systemNormal : t.nav.engineConnecting) : undefined}>
        <div className={`flex min-w-0 items-center ${compact ? '' : 'gap-2'}`}>
          <Activity className={`h-4 w-4 shrink-0 ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`} />
          {!compact && <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">{isOnline ? t.nav.systemNormal : isOnline === null ? t.nav.systemChecking : t.nav.engineConnecting}</p><p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">same-origin API</p></div>}
        </div>
        {!compact && <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />}
      </div>
      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <button type="button" onClick={toggleTheme} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400/40" aria-label="Toggle theme" title={compact ? 'Toggle theme' : undefined}>
          {theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}{!compact && (theme === 'light' ? 'Dark mode' : 'Light mode')}
        </button>
        <button type="button" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400/40" aria-label="Select language" title={compact ? 'Select language' : undefined}>
          <Globe className="h-3.5 w-3.5" />{!compact && (lang === 'en' ? '中文' : 'EN')}
        </button>
      </div>
      <div className={`flex ${compact ? 'flex-col items-center gap-3' : 'items-center justify-between gap-2'}`}>
        <button type="button" onClick={onOpenDocs} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300" title={compact ? t.nav.docs : undefined}><BookOpen className="h-3.5 w-3.5" />{!compact && t.nav.docs}</button>
        <a href="https://github.com/xubaoer19940428-creator/omni-media" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white" title={compact ? 'GitHub' : undefined}><Github className="h-3.5 w-3.5" />{!compact && 'GitHub'}</a>
      </div>
    </div>
  );

  const panel = (isMobile = false) => (
    // Mobile drawers always use the expanded treatment, even if desktop was
    // last left collapsed.
    <div className="flex h-full flex-col p-4 sm:p-5">
      <div className={`relative flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-between gap-3'}`}>
        <button type="button" onClick={() => choose('workbench')} className="group flex min-w-0 items-center gap-3 text-left" aria-label="Open workbench">
          <div className="relative shrink-0"><OmniMediaLogo className="h-10 w-10" /><span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#07090e] ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} /></div>
          {(!collapsed || isMobile) && <div className="min-w-0"><div className="font-mono text-lg font-black tracking-tight text-slate-950 dark:text-white">Omni<span className="text-blue-600 dark:text-cyan-400">Media</span></div><div className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">media workspace · v2.0</div></div>}
        </button>
        {isMobile ? <button type="button" onClick={() => setDrawerOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-400/40 dark:hover:text-cyan-300" aria-label="Close navigation"><X className="h-4 w-4" /></button> : <button type="button" onClick={toggleCollapsed} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-400/40 dark:hover:text-cyan-300 ${collapsed ? 'absolute -right-1 -top-1 shadow-md' : ''}`} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</button>}
      </div>
      <div className="mt-8">{navigation(collapsed && !isMobile)}</div>
      <a href="/pricing/" className={`mt-5 flex items-center rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 transition hover:-translate-y-0.5 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200 ${collapsed && !isMobile ? 'justify-center p-3' : 'justify-between gap-2 px-3 py-3'}`} title={collapsed && !isMobile ? 'Creator plan · US$9.90/month' : undefined}>
        <CreditCard className="h-4 w-4 shrink-0" />
        {(!collapsed || isMobile) && <span><span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">Creator plan</span><span className="text-sm font-bold">US$9.90 / month · unlimited</span></span>}
        {(!collapsed || isMobile) && <ChevronRight className="h-4 w-4 shrink-0" />}
      </a>
      <div className="mt-auto space-y-4">
        {!collapsed || isMobile ? <AuthControls /> : <a href="/account/" className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300" title="Account" aria-label="Account"><UserRound className="h-4 w-4" /></a>}
        {utility(collapsed && !isMobile)}
      </div>
    </div>
  );

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-50 hidden border-r border-slate-200 bg-white/95 shadow-[8px_0_0_rgba(15,23,42,.03)] backdrop-blur-xl transition-[width] duration-300 dark:border-slate-800 dark:bg-[#07090e]/95 lg:block ${collapsed ? 'w-[76px]' : 'w-72'}`}>
        {panel()}
      </aside>
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-[#07090e]/90 lg:hidden">
        <button type="button" onClick={() => choose('workbench')} className="group flex items-center gap-2" aria-label="Open workbench"><OmniMediaLogo className="h-8 w-8" /><span className="font-mono text-sm font-black text-slate-950 dark:text-white">Omni<span className="text-blue-600 dark:text-cyan-400">Media</span></span></button>
        <button type="button" onClick={() => setDrawerOpen((open) => !open)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300" aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={drawerOpen}>{drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {drawerOpen && <><button type="button" className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} /><aside className="fixed inset-y-0 left-0 z-50 w-[min(88vw,22rem)] border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#07090e] lg:hidden">{panel(true)}</aside></>}
    </>
  );
};
