import { SUPPORTED_PLATFORMS } from './constants';

export type SeoPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export function getSeoPlatform(slug: string): SeoPlatform | undefined {
  return SUPPORTED_PLATFORMS.find((platform) => platform.key === slug);
}

export function getPlatformDescription(platform: SeoPlatform): string {
  const mediaLabel = platform.supportsGallery
    ? 'gallery media'
    : platform.supportsAudio
      ? 'audio media'
      : 'video media';
  const capabilities = [
    mediaLabel,
    platform.supportsAudio ? 'audio tracks' : 'normalized metadata',
  ];
  return `Parse public ${platform.name} links with OmniMedia. Get ${capabilities.join(' and ')} through one JSON API, then preview or prepare a short-lived server download for content you own or are authorized to use.`;
}

export function getPlatformFaq(platform: SeoPlatform) {
  return [
    {
      question: `Can OmniMedia parse any ${platform.name} link?`,
      answer: `OmniMedia works with publicly accessible ${platform.name} media that does not require a login, paid access, DRM bypass, or a private session. Availability can vary by post, region, and the platform's current response.`,
    },
    {
      question: `What does the ${platform.name} response include?`,
      answer: `The normalized response can include a title, author, cover, duration, engagement fields, media sources, and platform-specific formats when the public source exposes them. Fields that are unavailable are left empty rather than fabricated.`,
    },
    {
      question: `Is the ${platform.name} parser free to call?`,
      answer: `The public OmniMedia workbench is available for testing. For production integrations, use the documented REST endpoints and respect the source platform's terms, copyright rules, and rate limits.`,
    },
  ];
}

export const SEO_PLATFORM_KEYS = SUPPORTED_PLATFORMS.map((platform) => platform.key);

// Keep the sitemap focused on pages with meaningful search demand. The full
// registry remains available in the app, while low-volume adapters avoid
// becoming a wall of near-identical doorway pages for crawlers.
export const SEO_INDEXABLE_KEYS = [
  'tiktok', 'douyin', 'instagram', 'youtube', 'twitter', 'bilibili',
  'reddit', 'facebook', 'telegram', 'bandcamp', 'odysee', 'imgur',
  'bluesky', 'dropbox', 'googledrive',
];

export interface SeoPlatformDetails {
  urlPattern: string;
  note: string;
}

// Keep the indexable guides useful as standalone landing pages by documenting
// the URL shape and one platform-specific parsing constraint for each adapter.
const PLATFORM_SEO_DETAILS: Record<string, SeoPlatformDetails> = {
  tiktok: { urlPattern: 'tiktok.com/@handle/video/<id>', note: 'Short vm.tiktok.com and vt.tiktok.com share links are normalized before parsing.' },
  douyin: { urlPattern: 'douyin.com/video/<id>', note: 'v.douyin.com share links are accepted when they resolve to a public video.' },
  instagram: { urlPattern: 'instagram.com/reel/<shortcode>/', note: 'Only public posts and reels are eligible; login-gated profiles are not fetched.' },
  youtube: { urlPattern: 'youtube.com/watch?v=<id>', note: 'youtu.be links are normalized to the same public video contract.' },
  twitter: { urlPattern: 'x.com/<handle>/status/<id>', note: 'Legacy twitter.com status URLs and public X posts use the same adapter.' },
  bilibili: { urlPattern: 'bilibili.com/video/BV<id>', note: 'b23.tv share links are resolved only when the destination remains publicly accessible.' },
  reddit: { urlPattern: 'reddit.com/r/<sub>/comments/<id>/<slug>/', note: 'Public post pages and exposed redditmedia assets are supported; private communities are not.' },
  facebook: { urlPattern: 'facebook.com/watch/?v=<id>', note: 'fb.watch links work when they resolve to a public, playable post.' },
  telegram: { urlPattern: 't.me/<channel>/<message-id>', note: 'The channel or group must be public and the message must expose its media.' },
  bandcamp: { urlPattern: '<artist>.bandcamp.com/track/<slug>', note: 'Bandcamp pages are treated as audio media and may return a track preview source.' },
  odysee: { urlPattern: 'odysee.com/@<channel>/<title>:<id>', note: 'Only public Odysee claims with an exposed playable source are parsed.' },
  imgur: { urlPattern: 'imgur.com/<id>', note: 'Album and image pages can return gallery items when Imgur exposes them publicly.' },
  bluesky: { urlPattern: 'bsky.app/profile/<handle>/post/<rkey>', note: 'Public posts with attached media are supported; text-only posts return metadata only.' },
  dropbox: { urlPattern: 'dropbox.com/s/<share-id>/<file>?dl=0', note: 'The shared file must be public; OmniMedia does not bypass Dropbox permissions.' },
  googledrive: { urlPattern: 'drive.google.com/file/d/<file-id>/view', note: 'The file must be shared as “Anyone with the link”; private Drive permissions are respected.' },
};

export function getPlatformDetails(platform: SeoPlatform): SeoPlatformDetails {
  return PLATFORM_SEO_DETAILS[platform.key] ?? {
    urlPattern: `${platform.domains[0]}/...`,
    note: `The source must be a public ${platform.name} URL with an exposed media stream.`,
  };
}

export function getPlatformOutputLabel(platform: SeoPlatform): string {
  if (platform.supportsGallery) return 'gallery images and public media sources';
  if (platform.supportsAudio) return 'audio tracks and public media sources';
  return 'public video sources and normalized metadata';
}
