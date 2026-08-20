import { ParsedMedia, PlatformKey } from '@/types';
import { SUPPORTED_PLATFORMS } from './constants';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
export const MAX_BATCH_QUEUE_SIZE = 40;

/**
 * Intelligent URL extraction from raw share texts
 * e.g. "Check out this video: https://v.douyin.com/xxxx/ or https://www.tiktok.com/@user/video/..."
 */
export function extractUrlFromText(input: string): { url: string; platformKey: PlatformKey } {
  if (!input || typeof input !== 'string') {
    return { url: '', platformKey: 'unknown' };
  }

  const urlRegex = /(https?:\/\/[^\s<>"\']+)/i;
  const match = input.match(urlRegex);
  const extractedUrl = match ? match[0].replace(/[)\]}>,.;]+$/, '') : input.trim();

  const platformKey = detectPlatformKey(extractedUrl);
  return { url: extractedUrl, platformKey };
}

/**
 * Detect platform key by checking domain match
 */
export function detectPlatformKey(url: string): PlatformKey {
  if (!url) return 'unknown';

  let hostname = '';
  try {
    hostname = new URL(url).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return 'unknown';
  }

  for (const p of SUPPORTED_PLATFORMS) {
    if (p.domains.some(domain => {
      const normalizedDomain = domain.toLowerCase();
      return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
    })) {
      return p.key;
    }
  }

  return 'unknown';
}

/**
 * API client to parse media URL
 */
export async function parseMediaUrl(rawUrl: string): Promise<ParsedMedia> {
  const { url } = extractUrlFromText(rawUrl);
  if (!url) {
    throw new Error('No valid URL detected. Please check your input.');
  }

  const res = await fetch(`${API_BASE_URL}/api/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Parsing failed. Please check the URL or server status.');
  }

  return data;
}

/**
 * API client for batch parse
 */
export async function batchParseMediaUrls(urls: string[]): Promise<{
  success: boolean;
  total: number;
  results: ParsedMedia[];
}> {
  const cleanUrls = urls
    .map(u => extractUrlFromText(u).url)
    .filter(Boolean);

  if (cleanUrls.length === 0) {
    throw new Error('Batch URL list contains no valid URLs.');
  }
  if (cleanUrls.length > MAX_BATCH_QUEUE_SIZE) {
    throw new Error(`A maximum of ${MAX_BATCH_QUEUE_SIZE} URLs can be processed at once.`);
  }

  const results: ParsedMedia[] = [];
  for (let offset = 0; offset < cleanUrls.length; offset += 10) {
    const res = await fetch(`${API_BASE_URL}/api/batch-parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls: cleanUrls.slice(offset, offset + 10) }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Batch parsing failed.');
    }
    results.push(...data.results);
  }

  return { success: true, total: results.length, results };
}

/**
 * API client to trigger server-side video download
 */
export async function triggerServerDownload(originalUrl: string): Promise<{
  success: boolean;
  filename: string;
  download_url: string;
  expires_in?: number;
}> {
  const res = await fetch(`${API_BASE_URL}/api/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ original_url: originalUrl }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Server-side download processing failed.');
  }

  return {
    ...data,
    download_url: data.download_url.startsWith('http')
      ? data.download_url
      : `${API_BASE_URL}${data.download_url}`,
  };
}

/**
 * Image proxy URL generator to bypass CORS
 */
export function getProxyImageUrl(url?: string): string {
  if (!url) return '';
  if (url.includes('cdninstagram') || url.includes('fbcdn.net')) {
    return `${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Health check
 */
export async function checkBackendHealth(): Promise<{
  status: string;
  supported_platforms_count: number;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error('Backend offline');
    return await res.json();
  } catch {
    return { status: 'offline', supported_platforms_count: 22 };
  }
}
