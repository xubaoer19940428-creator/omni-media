import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';

export const metadata: Metadata = {
  metadataBase: new URL('https://useomnimedia.com'),
  alternates: {
    canonical: '/',
  },
  title: 'OmniMedia — Universal Social Media API & Developer Extraction Platform',
  description:
    'A unified REST API for parsing public media links from Douyin, TikTok, Xiaohongshu, Instagram, Bilibili, YouTube, Twitter/X, and 15 more platforms.',
  keywords: [
    'TikTok download API',
    'Douyin download API',
    'Xiaohongshu downloader',
    'Media link parser',
    'Social media scraper',
    'TikHub alternative',
    'OmniMedia'
  ],
  authors: [{ name: 'OmniMedia Team' }],
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'OmniMedia — Universal Social Media API & Developer Extraction Platform',
    description:
      'Parse public media links across 22 platforms with normalized JSON responses and server-side downloads.',
    type: 'website',
    url: 'https://useomnimedia.com',
  },
};

const GA_MEASUREMENT_ID = 'G-6LCMTWDMHX';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC Theme Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('omnimedia_theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              if (window.location.hostname === 'useomnimedia.com') {
                gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
                gtag('event', 'page_view', {
                  page_title: document.title,
                  page_path: window.location.pathname,
                  page_location: window.location.origin + window.location.pathname
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col justify-between selection:bg-blue-500 selection:text-white bg-[#fafbfc] dark:bg-[#07090e] text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
