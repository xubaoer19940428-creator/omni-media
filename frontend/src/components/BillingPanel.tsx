'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, CreditCard, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { SignInButton, useAuth } from '@clerk/react';
import { AccountSnapshot, createPayPalOrder, getAccount } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

const FALLBACK_PLAN = { price: '9.90', currency: 'USD' };

function formatPrice(price: string, currency: string) {
  if (currency === 'CNY') return `¥${price}`;
  if (currency === 'USD') return `US$${price}`;
  return `${currency} ${price}`;
}

function SignedOutBillingCard() {
  const { lang } = useTranslation();
  return (
    <div className="rounded-2xl border border-blue-200 bg-white/90 p-6 shadow-xl shadow-blue-950/5 dark:border-cyan-500/20 dark:bg-slate-950/80">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 dark:bg-cyan-300 dark:text-slate-950"><CreditCard className="h-5 w-5" /></div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-cyan-400">{lang === 'zh' ? '账户与支付' : 'ACCOUNT & BILLING'}</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">{lang === 'zh' ? '登录后开始下载' : 'Sign in to start downloading'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{lang === 'zh' ? '免费账户可下载 2 个视频；升级月度套餐后即可无限下载。' : 'Free accounts get 2 video downloads. Upgrade for unlimited downloads.'}</p>
          <SignInButton mode="modal">
            <button type="button" className="btn-gradient-pill mt-4 inline-flex items-center gap-2 text-xs"><CreditCard className="h-4 w-4" />{lang === 'zh' ? '登录 / 注册' : 'Sign in / Create account'}</button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
}

function ConfiguredBillingPanel() {
  const { lang } = useTranslation();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [account, setAccount] = useState<AccountSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAccount(await getAccount(getToken));
    } catch (err: any) {
      setError(err?.message || (lang === 'zh' ? '账户加载失败' : 'Unable to load account'));
    } finally {
      setLoading(false);
    }
  }, [getToken, lang]);

  useEffect(() => {
    if (isSignedIn) void loadAccount();
  }, [isSignedIn, loadAccount]);

  if (!isLoaded) {
    return <div className="tikhub-panel rounded-2xl p-8 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading account…</div>;
  }
  if (!isSignedIn) return <SignedOutBillingCard />;

  const plan = account?.plan;
  const displayPlan = plan || FALLBACK_PLAN;
  const displayPrice = formatPrice(displayPlan.price, displayPlan.currency);
  const orderCount = account?.orders.length || 0;
  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setError(null);
    try {
      if (account?.pending_checkout_url) {
        window.location.assign(account.pending_checkout_url);
        return;
      }
      const order = await createPayPalOrder(getToken);
      if (!order.approval_url) throw new Error(lang === 'zh' ? 'PayPal 未返回结账链接' : 'PayPal did not return an approval link.');
      window.location.assign(order.approval_url);
    } catch (err: any) {
      setError(err?.message || (lang === 'zh' ? '无法启动 PayPal 结账' : 'Unable to start PayPal checkout'));
      setCheckoutLoading(false);
    }
  };

  return (
    <section className="tikhub-panel overflow-hidden rounded-2xl border border-blue-200 dark:border-cyan-500/20">
      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-cyan-400"><Sparkles className="h-3.5 w-3.5" />{lang === 'zh' ? '账户中心' : 'ACCOUNT CENTER'}</div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{lang === 'zh' ? '月度无限下载' : 'Monthly unlimited downloads'}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">{lang === 'zh' ? `PayPal 安全结账。${displayPrice}/月自动续费，订阅有效期间可无限下载，订单与当前 Clerk 账户绑定。` : `Secure PayPal checkout. ${displayPrice}/month renews automatically for unlimited downloads while your subscription is active.`}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"><p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{lang === 'zh' ? '剩余下载' : 'Downloads left'}</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{loading ? '—' : account?.downloads_remaining == null ? '∞' : account.downloads_remaining}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"><p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{lang === 'zh' ? '历史订单' : 'Orders'}</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{loading ? '—' : orderCount}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"><p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{lang === 'zh' ? '账户状态' : 'Account status'}</p><p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{account?.plan.unlimited ? (lang === 'zh' ? '无限' : 'Unlimited') : (lang === 'zh' ? '免费' : 'Free')}</p></div>
          </div>
          {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        </div>

        <div className="border-t border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/60 lg:border-l lg:border-t-0 sm:p-8">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-slate-500">{lang === 'zh' ? '月度订阅' : 'MONTHLY MEMBERSHIP'}</p>
          <h3 className="mt-2 text-lg font-extrabold text-slate-950 dark:text-white">{plan?.name || 'OmniMedia Monthly Unlimited'}</h3>
          <div className="mt-4 flex items-end gap-2"><span className="text-4xl font-black text-slate-950 dark:text-white">{displayPrice}</span><span className="pb-1 text-xs font-bold text-slate-500">/ month</span></div>
          <p className="mt-1 text-xs text-slate-500">{lang === 'zh' ? '每月自动续费 · 无限下载' : 'Auto-renewing monthly · unlimited downloads'}</p>
          <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300"><li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" />{lang === 'zh' ? `每月 ${displayPrice}` : `${displayPrice} per month`}</li><li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" />{lang === 'zh' ? '无限视频下载' : 'Unlimited video downloads'}</li><li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />{lang === 'zh' ? 'PayPal 安全结账' : 'Secure PayPal checkout'}</li></ul>
          <button type="button" onClick={handleCheckout} disabled={checkoutLoading} className="btn-gradient-pill mt-6 flex w-full items-center justify-center gap-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"><CreditCard className="h-4 w-4" />{checkoutLoading ? (lang === 'zh' ? '正在跳转…' : 'Opening PayPal…') : (lang === 'zh' ? '使用 PayPal 支付' : 'Pay with PayPal')}</button>
          <p className="mt-3 text-center text-[10px] leading-5 text-slate-500">{lang === 'zh' ? '数字服务 · 每月自动续费 · 无需配送' : 'Digital service · Auto-renews monthly · No shipping required'}</p>
        </div>
      </div>
    </section>
  );
}

export function BillingPanel() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <section className="tikhub-panel rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">ACCOUNT & BILLING</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Set Clerk and PayPal variables in Railway to enable secure checkout.</p>
      </section>
    );
  }
  return <ConfiguredBillingPanel />;
}
