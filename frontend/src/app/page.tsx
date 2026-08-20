'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { PlatformMarquee } from '@/components/PlatformMarquee';
import { Workbench } from '@/components/Workbench';
import { ApiPlayground } from '@/components/ApiPlayground';
import { BatchCenter } from '@/components/BatchCenter';
import { PlatformMatrix } from '@/components/PlatformMatrix';
import { McpBentoSection } from '@/components/McpBentoSection';
import { ApiDocsModal } from '@/components/ApiDocsModal';
import { Footer } from '@/components/Footer';
import { ThreeBackground } from '@/components/ThreeBackground';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'workbench' | 'batch' | 'playground' | 'platforms'>('workbench');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [workbenchUrl, setWorkbenchUrl] = useState('');

  const handleTestUrlInWorkbench = (url: string) => {
    setWorkbenchUrl(url);
    setActiveTab('workbench');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Interactive 3D Canvas Particle Network (TikHub / Three.js style) */}
      <ThreeBackground />

      {/* Top Floating Glass Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Hero Section */}
      <div className="relative z-10 pt-2">
        <HeroSection
          onSelectPlatform={() => setActiveTab('platforms')}
          onExploreApi={() => setActiveTab('playground')}
        />
      </div>

      {/* Infinite Platform Marquee Ticker */}
      <div className="relative z-10 mb-8">
        <PlatformMarquee onSelectPlatform={() => setActiveTab('platforms')} />
      </div>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Dynamic Tab Switcher Content */}
        {activeTab === 'workbench' && (
          <div className="space-y-12">
            <Workbench initialUrl={workbenchUrl} />
            <McpBentoSection
              onExplorePlayground={() => setActiveTab('playground')}
            />
          </div>
        )}

        {activeTab === 'playground' && <ApiPlayground />}

        {activeTab === 'batch' && <BatchCenter />}

        {activeTab === 'platforms' && (
          <PlatformMatrix onTestUrl={handleTestUrlInWorkbench} />
        )}
      </main>

      {/* API Documentation Modal Drawer */}
      <ApiDocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />

      {/* SaaS Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
