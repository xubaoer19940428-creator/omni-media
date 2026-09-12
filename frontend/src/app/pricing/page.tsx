import type { Metadata } from 'next';
import { BillingPanel } from '@/components/BillingPanel';

export const metadata: Metadata = {
  title: 'OmniMedia Plans & PayPal Checkout',
  description: 'Sign in and complete a secure PayPal order for OmniMedia processing credits.',
  alternates: { canonical: '/pricing/' },
};

export default function PricingPage() {
  return <main className="relative z-10 min-h-screen px-4 py-10 sm:px-6 sm:py-16"><div className="mx-auto max-w-5xl"><p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-cyan-400">OMNIMEDIA CHECKOUT</p><h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Plans & PayPal</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">Choose a digital processing-credit pack, sign in with Clerk, and pay securely through PayPal. No physical goods or shipping are involved.</p><div className="mt-10"><BillingPanel /></div><p className="mt-8 text-xs leading-6 text-slate-500">Questions about a payment? Include your PayPal transaction receipt and OmniMedia account email when contacting support.</p></div></main>;
}

