'use client';

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export const TikTokIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.88 2.89 2.89 0 0 1-2.89-2.88 2.89 2.89 0 0 1 2.89-2.88c.36 0 .7.07 1 .2V9.5a6.33 6.33 0 0 0-1-.08 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.06a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.49z" />
  </svg>
);

export const DouyinIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M21.5 8.15a6.54 6.54 0 0 1-4.73-4.57V3h-3.6v13.5a2.7 2.7 0 1 1-2.7-2.7c.34 0 .66.06.96.17V10.3a6.3 6.3 0 1 0 5.34 6.2V9.8a9.94 9.94 0 0 0 4.73 1.62V8.15z" />
  </svg>
);

export const XiaohongshuIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#FF2442" />
    <path d="M6.5 7.5h2.8c.8 0 1.4.2 1.8.6.4.4.6 1 .6 1.7 0 .8-.3 1.4-.8 1.8-.5.4-1.2.6-2 .6H7.8v3.8H6.5V7.5zm1.3 3.6h1.4c.5 0 .8-.1 1.1-.3.2-.2.4-.6.4-1s-.1-.8-.4-1c-.2-.2-.6-.3-1.1-.3H7.8v2.6zm6.2-3.6h3.8v1.1h-2.5v2.4h2.2v1.1h-2.2v2.7h2.6v1.1H14V7.5z" fill="#FFFFFF" />
  </svg>
);

export const InstagramIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size} {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const YouTubeIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const TwitterIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const BilibiliIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M18.66 4.95l1.63-1.63a.85.85 0 1 0-1.2-1.2l-2.07 2.07A11.78 11.78 0 0 0 12 3.7c-1.8 0-3.5.37-4.99 1.05L4.94 2.68a.85.85 0 1 0-1.2 1.2l1.63 1.63C2.88 7.02 1.5 9.77 1.5 13c0 4.42 4.7 8 10.5 8s10.5-3.58 10.5-8c0-3.23-1.38-5.98-3.84-7.55zm-10.41 9.55c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7.5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
);

export const KuaishouIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 6.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S8 12.38 8 11s1.12-2.5 2.5-2.5zm4.5 9h-6v-1.5c0-1.5 3-2.25 4.5-2.25s4.5.75 4.5 2.25V17.5h-3z" />
  </svg>
);

export const WeiboIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M10.15 17.75c-3.77.34-7.04-1.38-7.3-3.83-.26-2.45 2.59-4.71 6.36-5.05 3.77-.34 7.04 1.38 7.3 3.83.26 2.45-2.59 4.71-6.36 5.05zm8.93-6.52c-.37-.12-.61-.21-.43-.63.38-.89.41-1.65.05-2.19-.68-1.02-2.54-.97-4.73-.01 0 0-.67.31-.5-.22.33-1.02.26-1.89-.27-2.39-1.22-1.16-4.48.07-7.29 2.76C3.59 10.82 2.5 13.06 2.5 14.88c0 3.44 4.38 5.53 8.68 5.53 5.63 0 9.38-3.29 9.38-5.91 0-1.58-1.29-2.73-1.48-3.27z" />
  </svg>
);

export const RedditIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

export const FacebookIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const TelegramIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export const ThreadsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 12.8c-.5.8-1.3 1.4-2.3 1.7-.8.3-1.7.3-2.5.1-1.3-.3-2.3-1.1-2.9-2.2-.6-1.1-.7-2.4-.4-3.7.3-1.3 1.1-2.4 2.2-3.1 1.1-.7 2.4-.9 3.7-.6 1.4.3 2.5 1.2 3.1 2.5.2.4.1.9-.3 1.1-.4.2-.9.1-1.1-.3-.4-.9-1.2-1.6-2.2-1.8-.9-.2-1.8 0-2.6.5-.8.5-1.3 1.3-1.5 2.2-.2.9-.1 1.8.3 2.6.4.8 1.1 1.3 2 1.6.6.2 1.2.2 1.8 0 .7-.2 1.2-.6 1.6-1.2.3-.4.8-.5 1.2-.2.4.3.5.8.2 1.2z" />
  </svg>
);

export const PinterestIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M12 0a12 12 0 0 0-4.37 23.17c-.07-.63-.13-1.6.03-2.29l1.15-4.88s-.29-.58-.29-1.44c0-1.35.78-2.36 1.76-2.36.83 0 1.23.62 1.23 1.37 0 .83-.53 2.08-.8 3.24-.23.97.49 1.76 1.44 1.76 1.73 0 3.06-1.83 3.06-4.46 0-2.33-1.68-3.96-4.07-3.96-2.77 0-4.4 2.08-4.4 4.23 0 .84.32 1.73.73 2.22.08.1.09.19.07.29l-.27 1.11c-.04.18-.15.22-.34.13-1.27-.59-2.07-2.44-2.07-3.93 0-3.2 2.33-6.14 6.71-6.14 3.52 0 6.26 2.51 6.26 5.86 0 3.5-2.21 6.32-5.28 6.32-1.03 0-2-.54-2.33-1.17l-.64 2.42c-.23.89-.86 2.01-1.28 2.7A11.98 11.98 0 0 0 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z" />
  </svg>
);

export const VimeoIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.6 8.746 3.833 7.42 3.016 7.42c-.179 0-.806.378-1.881 1.134L0 7.086C1.229 6.007 2.441 4.938 3.637 3.88c1.636-1.42 2.864-2.17 3.684-2.249 1.944-.188 3.14 1.144 3.59 3.996.538 3.425.913 5.568 1.127 6.429.646 2.923 1.357 4.385 2.133 4.385.599 0 1.36-.927 2.284-2.781.923-1.855 1.413-3.267 1.47-4.237.105-1.636-.465-2.454-1.71-2.454-.627 0-1.28.143-1.956.429 1.283-4.204 3.73-6.242 7.34-6.114 2.68.094 3.947 1.83 3.799 5.207z" />
  </svg>
);

export const TwitchIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} {...props}>
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
  </svg>
);

export const DailymotionIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} {...props}>
    <path fill="#0a0a0a" d="M17.5 2v7.1A7.5 7.5 0 1 0 20 14.7V2h-2.5zM12.4 18.6a3.9 3.9 0 1 1 0-7.8 3.9 3.9 0 0 1 0 7.8z" />
  </svg>
);

export const TumblrIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} {...props}>
    <path fill="#001935" d="M14.6 21c-4.2 0-6.1-2.1-6.1-5.7V9.4H6V6.2c2.8-1 4-3.2 4.2-5.2h3.3v4.7H18v3.7h-4.5v5.1c0 1.7.9 2.4 2.3 2.4.8 0 1.5-.2 2-.5V20c-.8.6-1.9 1-3.2 1z" />
  </svg>
);

export const RumbleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} {...props}>
    <path fill="#85c742" d="M5.2 3.5c-.8.5-1.2 1.4-1 2.4l2.5 13.2c.3 1.6 2.1 2.4 3.5 1.5l9.1-6.5c1.4-1 1.3-3.1-.2-4L7.5 3.4c-.7-.4-1.6-.4-2.3.1z" />
    <path fill="#fff" d="m9 8 6.7 3.9L10.2 16 9 8z" />
  </svg>
);

export const AcFunIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} {...props}>
    <rect x="2" y="3" width="20" height="18" rx="5" fill="#fd4c5b" />
    <path fill="#fff" d="m6.2 16.8 4.2-9.6h3.2l4.2 9.6h-3.2l-.7-1.8h-3.8l-.7 1.8H6.2zm5-4.4h1.7L12 10.1l-.8 2.3z" />
  </svg>
);

export const YoukuIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} {...props}>
    <path fill="#00a8e8" d="M3 5.2 11.3 12 3 18.8V5.2z" />
    <path fill="#ff2851" d="m21 5.2-8.3 6.8 8.3 6.8V5.2z" />
    <circle cx="12" cy="12" r="2.2" fill="#fff" />
  </svg>
);

export const IQIYIIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} {...props}>
    <rect x="2" y="4" width="20" height="16" rx="3" fill="#00be06" />
    <rect x="5" y="7" width="14" height="10" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.8" />
    <path stroke="#fff" strokeWidth="1.8" strokeLinecap="round" d="M8 10v4m4-4v4m4-4v4" />
  </svg>
);

export const TencentVideoIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} {...props}>
    <path fill="#00d26a" d="M4.1 3.3c-1.2.7-1.8 2-1.4 3.3l3.9 13.2c.4 1.4 2.1 1.8 3.1.8l10.9-7.1c1.2-.8 1.1-2.6-.1-3.3L7.2 3.3c-1-.5-2.2-.5-3.1 0z" />
    <path fill="#00a4ff" d="m8 6.8 9.7 5.1-7.9 5.2L8 6.8z" />
    <path fill="#ffd500" d="m10.6 9.1 5.1 2.8-4.3 2.8-.8-5.6z" />
  </svg>
);

export const XiguaIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="6" fill="#ff2c55" />
    <path fill="#fff" d="m10 8 6.5 4-6.5 4V8z" />
  </svg>
);

export const GenericPlatformIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.5 9h17M3.5 15h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12s1.1 6.6 3.3 9" />
  </svg>
);

/**
 * Universal Platform Icon Component
 */
export const PlatformIcon: React.FC<{ platformKey: string; className?: string; size?: number }> = ({
  platformKey,
  className = 'w-4 h-4',
  size,
}) => {
  switch (platformKey.toLowerCase()) {
    case 'tiktok':
      return <TikTokIcon className={className} size={size} style={{ color: '#00f2fe' }} />;
    case 'douyin':
      return <DouyinIcon className={className} size={size} style={{ color: '#fe2c55' }} />;
    case 'xiaohongshu':
    case 'red':
    case 'rednote':
      return <XiaohongshuIcon className={className} size={size} />;
    case 'instagram':
      return <InstagramIcon className={className} size={size} style={{ color: '#e1306c' }} />;
    case 'youtube':
      return <YouTubeIcon className={className} size={size} style={{ color: '#ff0000' }} />;
    case 'twitter':
    case 'x':
      return <TwitterIcon className={className} size={size} style={{ color: '#0f172a' }} />;
    case 'bilibili':
      return <BilibiliIcon className={className} size={size} style={{ color: '#00aeec' }} />;
    case 'kuaishou':
      return <KuaishouIcon className={className} size={size} style={{ color: '#ff5000' }} />;
    case 'weibo':
      return <WeiboIcon className={className} size={size} style={{ color: '#e6162d' }} />;
    case 'reddit':
      return <RedditIcon className={className} size={size} style={{ color: '#ff4500' }} />;
    case 'facebook':
      return <FacebookIcon className={className} size={size} style={{ color: '#1877f2' }} />;
    case 'telegram':
      return <TelegramIcon className={className} size={size} style={{ color: '#24a1de' }} />;
    case 'threads':
      return <ThreadsIcon className={className} size={size} style={{ color: '#101010' }} />;
    case 'pinterest':
      return <PinterestIcon className={className} size={size} style={{ color: '#bd081c' }} />;
    case 'vimeo':
      return <VimeoIcon className={className} size={size} style={{ color: '#1ab7ea' }} />;
    case 'dailymotion':
      return <DailymotionIcon className={className} size={size} />;
    case 'twitch':
      return <TwitchIcon className={className} size={size} style={{ color: '#9146ff' }} />;
    case 'tumblr':
      return <TumblrIcon className={className} size={size} />;
    case 'rumble':
      return <RumbleIcon className={className} size={size} />;
    case 'acfun':
      return <AcFunIcon className={className} size={size} />;
    case 'youku':
      return <YoukuIcon className={className} size={size} />;
    case 'iqiyi':
      return <IQIYIIcon className={className} size={size} />;
    case 'tencent_video':
      return <TencentVideoIcon className={className} size={size} />;
    case 'ixigua':
      return <XiguaIcon className={className} size={size} />;
    default:
      return <GenericPlatformIcon className={className} size={size} />;
  }
};
