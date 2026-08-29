'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Layers,
  Globe,
  Github,
  BookOpen,
  Sparkles,
  Sun,
  Moon,
  Activity,
  ChevronDown,
  Check
} from 'lucide-react';
import { checkBackendHealth } from '@/lib/api';
import { useTranslation, Language } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { OmniMediaLogo } from './OmniMediaLogo';

interface NavbarProps {
  activeTab: 'workbench' | 'batch' | 'playground' | 'platforms';
  setActiveTab: (tab: 'workbench' | 'batch' | 'playground' | 'platforms') => void;
  onOpenDocs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenDocs }) => {
  const { lang, setLang, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [platformsCount, setPlatformsCount] = useState<number>(36);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkBackendHealth().then((res) => {
      setIsOnline(res.status === 'ok');
      if (res.supported_platforms_count) {
        setPlatformsCount(res.supported_platforms_count);
      }
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (selectedLang: Language) => {
    setLang(selectedLang);
    setIsLangDropdownOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#07090e]/95 backdrop-blur-2xl shadow-sm dark:shadow-2xl'
          : 'border-b border-slate-200/40 dark:border-white/[0.04] bg-white/60 dark:bg-[#07090e]/70 backdrop-blur-xl'
      }`}
    >
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Official OmniMedia Geometric Vector Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          onClick={() => setActiveTab('workbench')}
        >
          <div className="relative">
            <OmniMediaLogo className="w-9 h-9" />
            {/* Live Ping Beacon */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 border border-white dark:border-[#07090e] ${
                  isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-mono">
              Omni<span className="text-blue-600 dark:text-cyan-400">Media</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/25 font-mono">
              v2.0
            </span>
          </div>
        </div>

        {/* Center: Gliding Pill Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-full border border-slate-200/90 dark:border-slate-800 shadow-inner backdrop-blur-xl shrink-0">
          <button
            onClick={() => setActiveTab('workbench')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === 'workbench'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>{t.nav.workbench}</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === 'playground'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{t.nav.playground}</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === 'batch'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t.nav.batch}</span>
          </button>

          <button
            onClick={() => setActiveTab('platforms')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === 'platforms'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.nav.platforms}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-800 text-blue-700 dark:text-cyan-300 font-mono font-bold">
              {platformsCount}
            </span>
          </button>
        </nav>

        {/* Right: Action Buttons Suite */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Live Operational Status */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {isOnline ? t.nav.systemNormal : t.nav.engineConnecting}
            </span>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-200 shadow-sm hover:scale-105 cursor-pointer"
            title="Toggle Light / Dark Mode"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Bilingual Language Selector Popover Menu */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 transition-all duration-200 shadow-sm hover:scale-105 cursor-pointer"
              title="Select Language / 选择语言"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>{lang === 'en' ? 'EN' : '中文'}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Language Selection Modal Drawer */}
            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {lang === 'zh' ? '选择系统语言' : 'Select Language'}
                </div>

                <button
                  onClick={() => handleSelectLanguage('en')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition group ${
                    lang === 'en'
                      ? 'bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">🇺🇸</span>
                    <div className="text-left">
                      <div className="font-semibold">English</div>
                      <div className="text-[10px] text-slate-400 font-mono">United States</div>
                    </div>
                  </div>
                  {lang === 'en' && <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400" />}
                </button>

                <button
                  onClick={() => handleSelectLanguage('zh')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition group mt-1 ${
                    lang === 'zh'
                      ? 'bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">🇨🇳</span>
                    <div className="text-left">
                      <div className="font-semibold">简体中文</div>
                      <div className="text-[10px] text-slate-400 font-mono">Simplified Chinese</div>
                    </div>
                  </div>
                  {lang === 'zh' && <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400" />}
                </button>
              </div>
            )}
          </div>

          {/* API Docs Button */}
          <button
            onClick={onOpenDocs}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all duration-200 shadow-sm hover:scale-105 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>{t.nav.docs}</span>
          </button>

          {/* GitHub Repo Button */}
          <a
            href="https://github.com/xubaoer19940428-creator/omni-media"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-bold transition-all duration-200 shadow-md hover:scale-105 cursor-pointer"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
