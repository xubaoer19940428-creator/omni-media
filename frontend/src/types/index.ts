export type PlatformKey =
  | 'douyin'
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'twitter'
  | 'bilibili'
  | 'xiaohongshu'
  | 'weibo'
  | 'reddit'
  | 'facebook'
  | 'telegram'
  | 'pinterest'
  | 'vimeo'
  | 'dailymotion'
  | 'twitch'
  | 'tumblr'
  | 'rumble'
  | 'acfun'
  | 'youku'
  | 'iqiyi'
  | 'tencent_video'
  | 'ixigua'
  | 'unknown';

export interface AuthorInfo {
  name?: string;
  nickname?: string;
  avatar?: string;
  uid?: string;
  url?: string;
}

export interface VideoFormat {
  id?: string;
  quality?: string;
  resolution?: string;
  ext?: string;
  filesize?: number;
  url?: string;
  has_watermark?: boolean;
}

export interface ParsedMedia {
  success: boolean;
  platform?: string;
  platform_key?: PlatformKey;
  original_url?: string;
  title?: string;
  description?: string;
  author?: string | AuthorInfo;
  cover?: string;
  cover_url?: string;
  video_url?: string;
  download_url?: string;
  duration?: number;
  duration_string?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  images?: string[];
  audio_url?: string;
  audio_title?: string;
  formats?: VideoFormat[];
  tags?: string[];
  created_at?: string | number;
  raw_data?: Record<string, unknown>;
  error?: string;
}

export interface PlatformConfig {
  key: PlatformKey;
  name: string;
  color: string;
  domains: string[];
  supportsNoWatermark: boolean;
  supportsGallery: boolean;
  supportsAudio: boolean;
  demoUrl?: string;
}

export interface BatchTaskItem {
  id: string;
  rawInput: string;
  extractedUrl: string;
  platformKey: PlatformKey;
  platformName: string;
  status: 'idle' | 'parsing' | 'success' | 'error';
  result?: ParsedMedia;
  error?: string;
  downloadProgress?: number;
  downloading?: boolean;
}
