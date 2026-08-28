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
  | 'soundcloud'
  | 'vk'
  | 'niconico'
  | 'streamable'
  | 'loom'
  | 'kick'
  | 'bitchute'
  | 'mixcloud'
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
  video_id?: string;
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

export interface ProfileSummary {
  id?: string;
  name?: string;
  handle?: string;
  avatar?: string;
  description?: string;
  url?: string;
  website?: string;
  followers?: number;
  following?: number;
  likes?: number;
  posts?: number;
  friends?: number;
  verified?: boolean;
}

export interface ProfileParseResponse {
  success: boolean;
  platform?: PlatformKey | string;
  platform_key?: PlatformKey;
  platform_name?: string;
  original_url?: string;
  profile?: ProfileSummary;
  items: ParsedMedia[];
  count: number;
  has_more: boolean;
  next_cursor?: string | null;
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
