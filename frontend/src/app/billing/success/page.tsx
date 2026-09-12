'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { capturePayPalOrder } from '@/lib/api';

function ConfiguredSuccess() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your PayPal payment…');

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setStatus('error'); setMessage('Please sign in with the same account used to start checkout.'); return; }
    const params = new URLSearchParams(window.location.search);
    // PayPal Orders returns `token`; PayPal Subscriptions returns
    // `subscription_id` (and may also include a legacy `token`).
    const orderId = params.get('subscription_id') || params.get('token') || params.get('order_id');
    if (!orderId) { setStatus('error'); setMessage('No PayPal order was found in this return URL.'); return; }
    let active = true;
    capturePayPalOrder(orderId, getToken).then((result) => {
      if (!active) return;
      setStatus('success');
      setMessage(`Payment confirmed. Unlimited downloads are active while your monthly subscription is active.`);
    }).catch((error: any) => { if (active) { setStatus('error'); setMessage(error?.message || 'We could not confirm this PayPal payment.'); } });
    return () => { active = false; };
  }, [getToken, isLoaded, isSignedIn]);

  return <Result status={status} message={message} />;
}

function Result({ status, message }: { status: 'loading' | 'success' | 'error'; message: string }) {
  return <main className="relative z-10 grid min-h-screen place-items-center px-4"><div className="tikhub-panel w-full max-w-lg rounded-2xl p-8 text-center sm:p-12">{status === 'loading' ? <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 dark:text-cyan-400" /> : <CheckCircle2 className={`mx-auto h-12 w-12 ${status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`} />}<h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">{status === 'success' ? 'Payment complete' : status === 'loading' ? 'Confirming payment' : 'Payment needs attention'}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">{message}</p><div className="mt-7 flex justify-center gap-3"><a href="/account/" className="btn-gradient-pill text-xs">Open account</a><a href="/" className="btn-secondary-pill text-xs">Back home</a></div></div></main>;
}

export default function BillingSuccessPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <Result status="error" message="Clerk is not configured yet. Add the Railway Clerk variables before using checkout." />;
  return <ConfiguredSuccess />;
}
