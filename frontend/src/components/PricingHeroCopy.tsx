'use client';

import React from 'react';
import { useAuth } from '@clerk/react';
import { AccountSnapshot, getAccount } from '@/lib/api';

type MembershipState = 'loading' | 'member' | 'free' | 'unknown';

/**
 * Keeps the public pricing copy in sync with the signed-in account. Existing
 * members should not be shown the free-limit or upgrade price while viewing
 * the plans page.
 */
export function PricingHeroCopy() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [membership, setMembership] = React.useState<MembershipState>('loading');

  React.useEffect(() => {
    let active = true;
    if (!isLoaded) return () => { active = false; };
    if (!isSignedIn) {
      setMembership('free');
      return () => { active = false; };
    }

    setMembership('loading');
    getAccount(getToken)
      .then((account: AccountSnapshot) => {
        if (active) setMembership(account.plan?.unlimited ? 'member' : 'free');
      })
      .catch(() => {
        if (active) setMembership('unknown');
      });
    return () => { active = false; };
  }, [getToken, isLoaded, isSignedIn]);

  if (membership === 'member') {
    return <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">Your OmniMedia membership is active with unlimited downloads. You can continue using the service without purchasing another plan.</p>;
  }

  if (membership === 'loading' || membership === 'unknown') {
    return <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400" aria-live="polite">Checking your membership status…</p>;
  }

  return <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">Free accounts can download 2 videos. Sign in with Clerk and pay US$9.90/month through PayPal for unlimited downloads. No physical goods or shipping are involved.</p>;
}
