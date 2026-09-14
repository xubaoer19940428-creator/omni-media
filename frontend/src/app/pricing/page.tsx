import type { Metadata } from 'next';
import { BillingPanel } from '@/components/BillingPanel';
import { PricingHeroCopy } from '@/components/PricingHeroCopy';

export const metadata: Metadata = {
  title: 'OmniMedia Plans & PayPal Checkout',
  description: 'Sign in and start a secure PayPal monthly membership for unlimited OmniMedia downloads.',
  alternates: { canonical: '/pricing/' },
};

export default function PricingPage() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return <main className="relative z-10 min-h-screen px-4 py-10 sm:px-6 sm:py-16"><div className="mx-auto max-w-5xl"><p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-cyan-400">OMNIMEDIA MEMBERSHIP</p><h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Monthly unlimited downloads</h1>{hasClerk ? <PricingHeroCopy /> : <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">Free accounts can download 2 videos. Sign in with Clerk and pay US$9.90/month through PayPal for unlimited downloads. No physical goods or shipping are involved.</p>}<div className="mt-10"><BillingPanel /></div><p className="mt-8 text-xs leading-6 text-slate-500">Questions about a payment? Include your PayPal transaction receipt and OmniMedia account email when contacting support.</p></div></main>;
}
