import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Code2, ExternalLink, Globe2, ShieldCheck } from 'lucide-react';
import { PlatformIcon } from '@/components/PlatformIcons';
import { SEO_INDEXABLE_KEYS, SEO_PLATFORM_KEYS, getPlatformDescription, getPlatformDetails, getPlatformFaq, getPlatformOutputLabel, getSeoPlatform } from '@/lib/platformSeo';

const SITE_URL = 'https://useomnimedia.com';

export function generateStaticParams() {
  return SEO_PLATFORM_KEYS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const platform = getSeoPlatform(slug);
  if (!platform) return {};
  const title = `${platform.name} Media Parser & API | OmniMedia`;
  const description = getPlatformDescription(platform);
  return {
    title,
    description,
    alternates: { canonical: `/platform/${platform.key}/` },
    openGraph: { title, description, type: 'website', url: `${SITE_URL}/platform/${platform.key}/`, siteName: 'OmniMedia' },
    twitter: { card: 'summary', title, description },
    robots: SEO_INDEXABLE_KEYS.includes(platform.key)
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

function jsonLd(value: Record<string, unknown>) {
  return { __html: JSON.stringify(value).replace(/</g, '\\u003c') };
}

export default async function PlatformPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const platform = getSeoPlatform(slug);
  if (!platform) notFound();

  const description = getPlatformDescription(platform);
  const details = getPlatformDetails(platform);
  const faq = getPlatformFaq(platform);
  const exampleDomain = platform.domains[0];
  const canonical = `${SITE_URL}/platform/${platform.key}/`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': canonical, url: canonical, name: `${platform.name} Media Parser & API`, description, isPartOf: { '@id': `${SITE_URL}/#website` } },
      { '@type': 'SoftwareApplication', name: `OmniMedia ${platform.name} parser`, applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', url: canonical, featureList: [`Public ${platform.name} URL parsing`, 'Normalized JSON metadata', getPlatformOutputLabel(platform)] },
      { '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
    ],
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 dark:bg-[#07090e] dark:text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <nav className="mb-12 flex items-center justify-between" aria-label="Breadcrumb">
          <Link href="/" className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">OmniMedia</Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300">Open workbench <ArrowRight className="h-3.5 w-3.5" /></Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <section>
            <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-blue-200 bg-white px-3 py-2 shadow-sm dark:border-cyan-500/20 dark:bg-slate-900/80">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800"><PlatformIcon platformKey={platform.key} className="h-6 w-6" /></span>
              <span className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-cyan-300">Public media adapter</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-6xl">{platform.name} media parser for developers.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">{description}</p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Public links only</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><Globe2 className="h-3.5 w-3.5" /> {exampleDomain}</span>
            </div>
          </section>

          <aside className="tikhub-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="mb-5 flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"><Code2 className="h-4 w-4 text-blue-600 dark:text-cyan-300" /> Quick start</div>
            <pre className="overflow-x-auto rounded-2xl bg-[#0a0e17] p-5 text-xs leading-6 text-slate-200"><code>{`curl -X POST https://useomnimedia.com/api/parse -H 'Content-Type: application/json' -d '{"url":"https://${details.urlPattern}"}'`}</code></pre>
            <p className="mt-4 text-xs leading-6 text-slate-500 dark:text-slate-400">The response uses the same normalized contract as every OmniMedia adapter.</p>
          </aside>
        </div>

        <section className="mt-14 grid gap-4 sm:grid-cols-3" aria-label={`${platform.name} parser capabilities`}>
          {[['Recognize', `https://${details.urlPattern}`, 'URL recognition'], ['Normalize', 'title · author · cover · sources', 'JSON response'], ['Prepare', getPlatformOutputLabel(platform), 'Server download']].map(([label, value, detail]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/70"><p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-3 break-words text-sm font-semibold text-slate-900 dark:text-white">{value}</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{detail}</p></div>
          ))}
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div><p className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-cyan-300">What you get</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">A predictable response for {platform.name}.</h2><p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"><strong>Platform note:</strong> {details.note}</p><ul className="mt-6 space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{['One endpoint for parsing and batch workflows', 'Usable media sources when the public page exposes them', 'Unavailable fields stay empty instead of being guessed', 'Respectful handling of private, deleted, or restricted media'].map((item) => <li key={item} className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />{item}</li>)}</ul></div>
          <div><p className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-cyan-300">Questions</p><div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/70">{faq.map((item) => <details key={item.question} className="group p-5"><summary className="cursor-pointer list-none pr-6 text-sm font-semibold text-slate-900 dark:text-white">{item.question}</summary><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.answer}</p></details>)}</div></div>
        </section>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"><span>OmniMedia · public {platform.name} media extraction</span><Link href="/" className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-500 dark:text-cyan-300">Try another platform <ExternalLink className="h-3.5 w-3.5" /></Link></footer>
      </div>
    </main>
  );
}
