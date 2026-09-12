import { ParsedMedia, PlatformKey, ProfileParseResponse } from '@/types';
import { SUPPORTED_PLATFORMS } from './constants';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
export const MAX_BATCH_QUEUE_SIZE = 40;
const DEFAULT_REQUEST_TIMEOUT_MS = 45_000;

export type AuthTokenGetter = () => Promise<string | null>;

async function authHeaders(getToken?: AuthTokenGetter): Promise<Record<string, string>> {
  if (!getToken) return {};
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<{ response: Response; data: T }> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const externalSignal = init.signal;
  const abortFromCaller = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener('abort', abortFromCaller, { once: true });
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const data = await response.json().catch(() => ({} as T));
    return { response, data };
  } catch (error) {
    if (timedOut) throw new Error('Request timed out. Please try again.');
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromCaller);
  }
}

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
export async function parseMediaUrl(rawUrl: string, signal?: AbortSignal): Promise<ParsedMedia> {
  const { url } = extractUrlFromText(rawUrl);
  if (!url) {
    throw new Error('No valid URL detected. Please check your input.');
  }

  const { response: res, data } = await requestJson<any>(`${API_BASE_URL}/api/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
    signal,
  });

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Parsing failed. Please check the URL or server status.');
  }

  return data;
}

/** Parse a bounded page of public posts from a creator profile URL. */
export async function parseProfileUrl(
  rawUrl: string,
  limit = 12,
  cursor = 0,
  signal?: AbortSignal,
): Promise<ProfileParseResponse> {
  const { url } = extractUrlFromText(rawUrl);
  if (!url) {
    throw new Error('No valid profile URL detected. Please check your input.');
  }

  const { response: res, data } = await requestJson<ProfileParseResponse & { error?: string }>(`${API_BASE_URL}/api/profile/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, limit, cursor }),
    signal,
  });
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Profile parsing failed. Please check the URL or server status.');
  }
  return data;
}

/**
 * API client for batch parse
 */
export async function batchParseMediaUrls(
  urls: string[],
  onProgress?: (results: ParsedMedia[]) => void,
): Promise<{
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
    const { response: res, data } = await requestJson<any>(`${API_BASE_URL}/api/batch-parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls: cleanUrls.slice(offset, offset + 10) }),
    });

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Batch parsing failed.');
    }
    results.push(...data.results);
    onProgress?.([...results]);
  }

  return { success: true, total: results.length, results };
}

export async function resolveGalleryUrls(url: string, maxItems = 40): Promise<string[]> {
  const { response: res, data } = await requestJson<any>(`${API_BASE_URL}/api/gallery/resolve`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, max_items: maxItems }),
  });
  if (!res.ok || !data.success) throw new Error(data.error || 'Gallery extraction failed.');
  return Array.isArray(data.images) ? data.images : [];
}

/**
 * API client to trigger server-side video download
 */
export async function triggerServerDownload(originalUrl: string, options: {
  formatSelector?: string;
  audioOnly?: boolean;
  mediaToken?: string;
  getToken?: AuthTokenGetter;
} = {}): Promise<{
  success: boolean;
  filename: string;
  download_url: string;
  expires_in?: number;
}> {
  const { response: res, data } = await requestJson<any>(`${API_BASE_URL}/api/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders(options.getToken)),
    },
    body: JSON.stringify({
      original_url: originalUrl,
      ...(options.formatSelector ? { format_selector: options.formatSelector } : {}),
      ...(options.audioOnly ? { audio_only: true } : {}),
      ...(options.mediaToken ? { media_token: options.mediaToken } : {}),
    }),
  });

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
    return { status: 'offline', supported_platforms_count: 39 };
  }
}

export interface AccountSnapshot {
  user_id: string;
  plan: { name: string; price: string; currency: string; interval?: string; unlimited?: boolean; subscription_expires_at?: string | null };
  credits_granted: number;
  downloads_used?: number;
  downloads_remaining?: number | null;
  free_download_limit?: number;
  orders: Array<{
    paypal_order_id: string;
    status: string;
    amount: string;
    currency: string;
    credits: number;
    created_at: string;
    captured_at?: string | null;
  }>;
}

export async function getAccount(getToken: AuthTokenGetter): Promise<AccountSnapshot> {
  const { response, data } = await requestJson<AccountSnapshot & { error?: string }>(
    `${API_BASE_URL}/api/account`,
    { headers: await authHeaders(getToken) },
  );
  if (!response.ok) throw new Error(data.error || 'Unable to load account.');
  return data;
}

export async function createPayPalOrder(getToken: AuthTokenGetter): Promise<{
  order_id?: string;
  subscription_id?: string;
  approval_url?: string | null;
  amount: string;
  currency: string;
  interval?: string;
  unlimited?: boolean;
  credits?: number;
}> {
  const { response, data } = await requestJson<any>(`${API_BASE_URL}/api/paypal/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders(getToken)) },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error(data.error || 'Unable to start PayPal checkout.');
  return data;
}

export async function capturePayPalOrder(orderId: string, getToken: AuthTokenGetter): Promise<{
  order_id: string;
  subscription_id?: string;
  status: string;
  amount: string;
  currency: string;
  credits_granted?: number;
  interval?: string;
  unlimited?: boolean;
  captured_at?: string | null;
  idempotent?: boolean;
}> {
  const { response, data } = await requestJson<any>(`${API_BASE_URL}/api/paypal/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders(getToken)) },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error(data.error || 'Unable to confirm PayPal payment.');
  return data;
}
