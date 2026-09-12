'use client';

import React from 'react';
import { LogIn, UserRound } from 'lucide-react';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/react';

export function AuthControls() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  return (
    <div className="flex items-center gap-1.5">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300">
            <LogIn className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button type="button" className="hidden lg:flex items-center gap-1.5 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200">
            <UserRound className="h-3.5 w-3.5" />
            Create account
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <a href="/account/" className="hidden sm:flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300">Account</a>
        <UserButton />
      </Show>
    </div>
  );
}
