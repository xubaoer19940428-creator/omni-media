'use client';

import React from 'react';

interface OmniMediaLogoProps {
  className?: string;
  showText?: boolean;
}

export const OmniMediaLogo: React.FC<OmniMediaLogoProps> = ({ className = 'w-8 h-8', showText = false }) => {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      {/* Precision Vector SVG Geometric Prism & Interconnected Media Streams */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} shrink-0 transition-transform duration-300 group-hover:scale-105 filter drop-shadow-md`}
      >
        <defs>
          <linearGradient id="omniGrad1" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>

          <linearGradient id="omniGrad2" x1="110" y1="10" x2="10" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4facfe" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>

          <linearGradient id="prismFaceLeft" x1="60" y1="15" x2="20" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="prismFaceRight" x1="60" y1="15" x2="100" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Central Geometric Optical Prism */}
        <polygon points="60,16 26,86 60,104" fill="url(#prismFaceLeft)" />
        <polygon points="60,16 94,86 60,104" fill="url(#prismFaceRight)" />

        {/* Outer Hexagonal Shield / "O" Frame Outline */}
        <path
          d="M60 8 L104 32 L104 88 L60 112 L16 88 L16 32 Z"
          stroke="url(#omniGrad1)"
          strokeWidth="4"
          strokeLinejoin="round"
          fill="none"
          className="opacity-90"
        />

        {/* Inner Isometric Media Stream Waves ("M" Shape Flow) */}
        <path
          d="M32 46 L46 64 L60 48 L74 64 L88 46"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Lower Data Extraction Rays */}
        <path
          d="M40 76 L26 96 M60 84 L60 106 M80 76 L94 96"
          stroke="url(#omniGrad2)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Glowing Network Hub Nodes */}
        <circle cx="60" cy="16" r="4" fill="#00f2fe" />
        <circle cx="26" cy="96" r="3.5" fill="#38bdf8" />
        <circle cx="94" cy="96" r="3.5" fill="#818cf8" />
        <circle cx="60" cy="106" r="3.5" fill="#00f2fe" />
      </svg>

      {/* Brand Text (Optional) */}
      {showText && (
        <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white font-mono">
          Omni<span className="text-blue-600 dark:text-cyan-400">Media</span>
        </span>
      )}
    </div>
  );
};
