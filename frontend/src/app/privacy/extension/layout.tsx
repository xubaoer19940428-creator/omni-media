import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OmniMedia Browser Extension Privacy Policy',
  description: 'Privacy practices for the official OmniMedia browser extension.',
  alternates: { canonical: '/privacy/extension/' },
};

export default function ExtensionPrivacyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
