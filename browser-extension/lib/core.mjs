export const API_ORIGIN = 'https://useomnimedia.com';
export const MAX_INPUT_LENGTH = 8192;

export const SUPPORTED_PLATFORMS = Object.freeze([
  { key: 'tiktok', name: 'TikTok', domains: ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'] },
  { key: 'douyin', name: 'Douyin', domains: ['douyin.com', 'iesdouyin.com', 'v.douyin.com'] },
  { key: 'instagram', name: 'Instagram', domains: ['instagram.com', 'instagr.am'] },
  { key: 'telegram', name: 'Telegram', domains: ['t.me', 'telegram.me'] },
  { key: 'youtube', name: 'YouTube', domains: ['youtube.com', 'youtu.be'] },
  { key: 'twitter', name: 'X (Twitter)', domains: ['twitter.com', 'x.com'] },
  { key: 'facebook', name: 'Facebook', domains: ['facebook.com', 'fb.watch', 'fb.com'] },
  { key: 'bilibili', name: 'Bilibili', domains: ['bilibili.com', 'b23.tv'] },
  { key: 'weibo', name: 'Weibo', domains: ['weibo.com', 'weibo.cn', 'video.weibo.com'] },
  { key: 'reddit', name: 'Reddit', domains: ['reddit.com', 'redditmedia.com', 'redd.it'] },
  { key: 'dailymotion', name: 'Dailymotion', domains: ['dailymotion.com', 'dai.ly'] },
  { key: 'twitch', name: 'Twitch', domains: ['twitch.tv', 'clips.twitch.tv'] },
  { key: 'pinterest', name: 'Pinterest', domains: ['pinterest.com', 'pinterest.ca', 'pinterest.ch', 'pinterest.cl', 'pinterest.co.kr', 'pinterest.co.uk', 'pinterest.com.au', 'pinterest.com.mx', 'pinterest.de', 'pinterest.dk', 'pinterest.es', 'pinterest.fr', 'pinterest.ie', 'pinterest.it', 'pinterest.jp', 'pinterest.nz', 'pinterest.ph', 'pinterest.pt', 'pinterest.ru', 'pinterest.se', 'pin.it'] },
  { key: 'acfun', name: 'AcFun', domains: ['acfun.cn'] },
  { key: 'youku', name: 'Youku', domains: ['youku.com', 'tudou.com'] },
  { key: 'tencent_video', name: 'Tencent Video', domains: ['v.qq.com'] },
  { key: 'soundcloud', name: 'SoundCloud', domains: ['soundcloud.com', 'on.soundcloud.com'] },
  { key: 'vk', name: 'VK', domains: ['vk.com', 'vkvideo.ru'] },
  { key: 'niconico', name: 'Niconico', domains: ['nicovideo.jp', 'niconico.jp'] },
  { key: 'streamable', name: 'Streamable', domains: ['streamable.com'] },
  { key: 'loom', name: 'Loom', domains: ['loom.com'] },
  { key: 'kick', name: 'Kick', domains: ['kick.com'] },
  { key: 'bitchute', name: 'BitChute', domains: ['bitchute.com'] },
  { key: 'bandcamp', name: 'Bandcamp', domains: ['bandcamp.com'] },
  { key: 'odysee', name: 'Odysee', domains: ['odysee.com', 'lbry.tv'] },
  { key: 'archive_org', name: 'Internet Archive', domains: ['archive.org'] },
  { key: 'imgur', name: 'Imgur', domains: ['imgur.com', 'i.imgur.com'] },
  { key: 'linkedin', name: 'LinkedIn', domains: ['linkedin.com'] },
  { key: 'snapchat', name: 'Snapchat', domains: ['snapchat.com'] },
  { key: 'peertube', name: 'PeerTube', domains: ['framatube.org', 'peertube2.cpy.re', 'peertube.debian.social'] },
  { key: 'gab', name: 'Gab', domains: ['gab.com'] },
  { key: 'truthsocial', name: 'Truth Social', domains: ['truthsocial.com'] },
  { key: 'medaltv', name: 'Medal.tv', domains: ['medal.tv'] },
  { key: 'rutube', name: 'RuTube', domains: ['rutube.ru'] },
  { key: 'coub', name: 'Coub', domains: ['coub.com'] },
  { key: 'odnoklassniki', name: 'Odnoklassniki', domains: ['ok.ru'] },
  { key: 'bluesky', name: 'Bluesky', domains: ['bsky.app', 'main.bsky.dev'] },
  { key: 'dropbox', name: 'Dropbox', domains: ['dropbox.com'] },
  { key: 'googledrive', name: 'Google Drive', domains: ['drive.google.com', 'docs.google.com', 'drive.usercontent.google.com'] }
]);

function isDomainMatch(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function detectPlatform(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.length > 4096) return null;

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) return null;
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  return SUPPORTED_PLATFORMS.find((platform) =>
    platform.domains.some((domain) => isDomainMatch(hostname, domain))
  ) || null;
}

export function extractUrlFromText(input) {
  if (typeof input !== 'string' || input.length > MAX_INPUT_LENGTH) return '';
  const match = input.match(/https?:\/\/[^\s<>"']+/i);
  if (!match) return '';
  return safeHttpUrl(match[0].replace(/[.,;:!?。，；：！？、…\)\]}）】》」』]+$/, ''));
}

export function safeHttpUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

export function displayAuthor(author) {
  if (typeof author === 'string') return author;
  if (author && typeof author === 'object') {
    return author.name || author.nickname || '';
  }
  return '';
}

export function formatDuration(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return '';
  const minutes = Math.floor(value / 60);
  const remainder = Math.floor(value % 60);
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function normalizeResult(data, fallbackUrl) {
  if (!data || typeof data !== 'object' || data.success !== true) return null;
  return {
    title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : '',
    author: displayAuthor(data.author),
    platform: typeof data.platform === 'string' ? data.platform : '',
    platformKey: typeof data.platform_key === 'string' ? data.platform_key : '',
    coverUrl: safeHttpUrl(data.cover || data.cover_url || ''),
    duration: data.duration_string || formatDuration(data.duration),
    originalUrl: safeHttpUrl(data.original_url || fallbackUrl)
  };
}
