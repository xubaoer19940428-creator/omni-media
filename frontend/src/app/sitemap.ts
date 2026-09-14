import type { MetadataRoute } from 'next';
import { SEO_INDEXABLE_KEYS } from '@/lib/platformSeo';

export const dynamic = 'force-static';

const SITE_URL = 'https://useomnimedia.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/pricing/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/privacy/extension/`, changeFrequency: 'yearly', priority: 0.3 },
  ];
  const platformPages = SEO_INDEXABLE_KEYS.map((slug) => ({
    url: `${SITE_URL}/platform/${slug}/`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  return [...corePages, ...platformPages];
}
