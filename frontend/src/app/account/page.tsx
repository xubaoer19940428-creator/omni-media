'use client';

import { BillingPanel } from '@/components/BillingPanel';
import { OmniMediaLogo } from '@/components/OmniMediaLogo';

export default function AccountPage() {
  return <main className="relative z-10 min-h-screen px-4 py-10 sm:px-6 sm:py-16"><div className="mx-auto max-w-5xl"><a href="/" aria-label="OmniMedia home" className="inline-flex"><OmniMediaLogo className="h-9 w-9" showText /></a><div className="mt-10"><BillingPanel /></div><a href="/" className="mt-6 inline-flex text-sm font-semibold text-blue-600 hover:underline dark:text-cyan-400">← Back to OmniMedia</a></div></main>;
}

