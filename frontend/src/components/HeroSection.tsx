'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { SUPPORTED_PLATFORMS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n';
import { PlatformIcon } from './PlatformIcons';
import gsap from 'gsap';

interface HeroSectionProps {
  onStartParsing?: () => void;
  onSelectPlatform?: (key: string) => void;
  onExploreApi?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartParsing, onSelectPlatform, onExploreApi }) => {
  const { t, lang } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  // Focus targets
  const focusBoxRef = useRef<HTMLDivElement>(null);
  const word1Ref = useRef<HTMLButtonElement>(null);
  const word2Ref = useRef<HTMLButtonElement>(null);
  const word3Ref = useRef<HTMLButtonElement>(null);
  const [activeFocusIndex, setActiveFocusIndex] = useState(0);
  const focusIndexRef = useRef(0);

  // Animated Numbers Refs
  const stat1Ref = useRef<HTMLSpanElement>(null);
  const stat2Ref = useRef<HTMLSpanElement>(null);
  const stat3Ref = useRef<HTMLSpanElement>(null);
  const stat4Ref = useRef<HTMLSpanElement>(null);

  // Smooth, Stable Focus Movement
  const moveFocusTo = useCallback((index: number) => {
    const wordRefs = [word1Ref.current, word2Ref.current, word3Ref.current];
    const targetEl = wordRefs[index];
    const boxEl = focusBoxRef.current;
    const containerEl = titleContainerRef.current;

    if (!targetEl || !boxEl || !containerEl) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const paddingX = 14;
    const paddingY = 8;

    const targetLeft = targetEl.offsetLeft - paddingX / 2;
    const targetTop = targetEl.offsetTop - paddingY / 2;
    const targetWidth = targetEl.offsetWidth + paddingX;
    const targetHeight = targetEl.offsetHeight + paddingY;

    // Smooth Glide with GSAP
    gsap.killTweensOf(boxEl);
    const vars = {
      x: targetLeft,
      y: targetTop,
      width: targetWidth,
      height: targetHeight,
      opacity: 1,
      duration: 0.6,
      ease: 'power3.out',
    };
    if (reduceMotion) {
      gsap.set(boxEl, vars);
    } else {
      gsap.to(boxEl, vars);
    }

    focusIndexRef.current = index;
    setActiveFocusIndex(index);
  }, []);

  // Periodic Focus Glide Cycle (stays for 2.8 seconds on each word!)
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      focusIndexRef.current = 0;
      setActiveFocusIndex(0);
      return;
    }

    // Initial mount placement
    const timer = setTimeout(() => {
      moveFocusTo(0);
    }, 300);

    const interval = setInterval(() => {
      const next = (focusIndexRef.current + 1) % 3;
      moveFocusTo(next);
    }, 2800);

    const handleResize = () => {
      moveFocusTo(focusIndexRef.current);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [moveFocusTo, lang]);

  // Master Entrance Animation
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      gsap.set(
        [badgeRef.current, titleContainerRef.current, subtitleRef.current],
        { opacity: 1, x: 0, y: 0, scale: 1 }
      );
      gsap.set(statsRef.current?.children ? Array.from(statsRef.current.children) : [], { opacity: 1, y: 0, scale: 1 });
      gsap.set(pillsRef.current?.children ? Array.from(pillsRef.current.children) : [], { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: -25, scale: 0.85 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.5)' }
      )
        .fromTo(
          titleContainerRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.4'
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.4'
        )
        .fromTo(
          statsRef.current?.children ? Array.from(statsRef.current.children) : [],
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.08 },
          '-=0.4'
        )
        .fromTo(
          pillsRef.current?.children ? Array.from(pillsRef.current.children) : [],
          { opacity: 0, scale: 0.7, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.03, ease: 'back.out(1.5)' },
          '-=0.3'
        );

      // Dynamic Number Counter Tweening
      const countObj = { pCount: 0, endpointCount: 0, batchSize: 0 };
      gsap.to(countObj, {
        pCount: 36,
        endpointCount: 3,
        batchSize: 10,
        duration: 1.8,
        ease: 'power2.out',
        delay: 0.3,
        onUpdate: () => {
          if (stat1Ref.current) stat1Ref.current.innerText = `${Math.round(countObj.pCount)}`;
          if (stat2Ref.current) stat2Ref.current.innerText = `${Math.round(countObj.endpointCount)}`;
          if (stat3Ref.current) stat3Ref.current.innerText = `${Math.round(countObj.batchSize)}`;
          if (stat4Ref.current) stat4Ref.current.innerText = 'JSON';
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="relative pt-8 pb-10 text-center overflow-hidden">
      {/* Background Lighting Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-gradient-to-b from-blue-500/15 via-indigo-500/10 to-transparent dark:from-cyan-500/15 dark:via-indigo-500/10 dark:to-transparent blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />

      {/* Top Floating Badge */}
      <div
        ref={badgeRef}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 mb-6 shadow-sm dark:shadow-xl backdrop-blur-md hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition group cursor-pointer"
      >
        <span className="flex h-2 w-2 rounded-full bg-blue-600 dark:bg-cyan-400 animate-ping"></span>
        <span className="font-mono text-blue-600 dark:text-cyan-300 font-semibold">v2.0 API</span>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition font-medium">
          {t.hero.badge}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Main Hero Headline with Rock-Solid Jitter-Free Viewfinder Box */}
      <div className="relative max-w-5xl mx-auto px-4">
        <h1
          ref={titleContainerRef}
          className="relative inline-block text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25] sm:leading-[1.2] py-2 select-none"
        >
          {/* Hardware-Accelerated Gliding Camera Auto-Focus Frame */}
          <div
            ref={focusBoxRef}
            className="absolute top-0 left-0 pointer-events-none z-20 opacity-0 will-change-transform"
            style={{ width: 0, height: 0 }}
          >
            {/* Top-Left Reticle Corner */}
            <div className="absolute -top-1 -left-1 w-3.5 h-3.5 sm:w-4 sm:h-4 border-t-2 border-l-2 border-blue-600 dark:border-cyan-400 rounded-tl-sm" />
            {/* Top-Right Reticle Corner */}
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 border-t-2 border-r-2 border-blue-600 dark:border-cyan-400 rounded-tr-sm" />
            {/* Bottom-Left Reticle Corner */}
            <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 sm:w-4 sm:h-4 border-b-2 border-l-2 border-blue-600 dark:border-cyan-400 rounded-bl-sm" />
            {/* Bottom-Right Reticle Corner */}
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 border-b-2 border-r-2 border-blue-600 dark:border-cyan-400 rounded-br-sm" />

            {/* Ambient Corner Fill Glow */}
            <div className="absolute inset-0 bg-blue-500/5 dark:bg-cyan-500/10 rounded-md pointer-events-none" />
          </div>

          {/* Line 1 */}
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white">Universal </span>
            <button
              type="button"
              ref={word1Ref}
              onClick={() => moveFocusTo(0)}
              className={`inline-block border-0 bg-transparent px-1.5 cursor-pointer transition-colors duration-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-cyan-400 ${
                activeFocusIndex === 0
                  ? 'text-blue-600 dark:text-cyan-300 font-extrabold'
                  : 'text-slate-800 dark:text-slate-200 opacity-40 blur-[1px]'
              }`}
            >
              Social Media
            </button>
            <span className="font-extrabold text-slate-900 dark:text-white"> API</span>
          </div>

          {/* Line 2 */}
          <div className="mt-1 sm:mt-0">
            <span className="text-slate-500 dark:text-slate-400 font-normal">for </span>
            <button
              type="button"
              ref={word2Ref}
              onClick={() => moveFocusTo(1)}
              className={`inline-block border-0 bg-transparent px-1.5 cursor-pointer transition-colors duration-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 ${
                activeFocusIndex === 1
                  ? 'text-indigo-600 dark:text-indigo-300 font-extrabold'
                  : 'text-slate-800 dark:text-slate-200 opacity-40 blur-[1px]'
              }`}
            >
              Developers
            </button>
            <span className="text-slate-400 dark:text-slate-500 font-normal"> &amp; </span>
            <button
              type="button"
              ref={word3Ref}
              onClick={() => moveFocusTo(2)}
              className={`inline-block border-0 bg-transparent px-1.5 cursor-pointer transition-colors duration-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-cyan-400 ${
                activeFocusIndex === 2
                  ? 'text-blue-600 dark:text-cyan-400 font-extrabold'
                  : 'text-slate-800 dark:text-slate-200 opacity-40 blur-[1px]'
              }`}
            >
              36 Platforms
            </button>
          </div>
        </h1>
      </div>

      {/* Clean Subtitle */}
      <p
        ref={subtitleRef}
        className="mt-6 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal px-4"
      >
        {t.hero.subtitle}
      </p>

      <div className="mt-7 flex flex-col items-center justify-center gap-3 px-4 sm:flex-row">
        <a
          href="#workbench"
          onClick={(event) => {
            event.preventDefault();
            onStartParsing?.();
            window.requestAnimationFrame(() => {
              window.requestAnimationFrame(() => {
                document.getElementById('workbench')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              });
            });
          }}
          className="btn-gradient-pill inline-flex w-full items-center justify-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-cyan-400 dark:focus-visible:ring-offset-slate-950 sm:w-auto"
        >
          {t.hero.primaryCta}
          <ArrowRight className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={() => onExploreApi?.()}
          className="btn-secondary-pill inline-flex w-full items-center justify-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-cyan-400 dark:focus-visible:ring-offset-slate-950 sm:w-auto"
        >
          {t.hero.apiCta}
        </button>
      </div>

      {/* Hero Stats Row with GSAP Animated Counters */}
      <div ref={statsRef} className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-3xl mx-auto px-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-sm hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition group hover:-translate-y-1">
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">
            <span ref={stat1Ref}>36</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{t.hero.statPlatforms}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-sm hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition group hover:-translate-y-1">
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-cyan-400 font-mono">
            <span ref={stat2Ref}>3</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{t.hero.statWatermark}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-sm hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition group hover:-translate-y-1">
          <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
            <span ref={stat3Ref}>10</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{t.hero.statLatency}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-sm hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition group hover:-translate-y-1">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            <span ref={stat4Ref}>JSON</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{t.hero.statAvailability}</div>
        </div>
      </div>

      {/* Platform Quick Badges with GSAP Stagger Entrance */}
      <div ref={pillsRef} className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto px-4">
        {SUPPORTED_PLATFORMS.slice(0, 10).map((p) => (
          <button
            key={p.key}
            onClick={() => onSelectPlatform?.(p.key)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-cyan-500/50 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-sm hover:scale-105"
          >
            <PlatformIcon platformKey={p.key} className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">{p.name.split(' ')[0]}</span>
          </button>
        ))}
        <span className="text-xs text-slate-500 px-2 font-mono">{t.hero.morePlatforms}</span>
      </div>
    </div>
  );
};
