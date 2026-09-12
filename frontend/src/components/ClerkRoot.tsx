'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/react';

/** Keep local static builds usable before Clerk environment variables exist. */
export function ClerkRoot({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) return <>{children}</>;
  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
