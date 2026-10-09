import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/lib/site-config';

// Archivo's width axis gives us a condensed display face from the same family.
const archivo = Archivo({ variable: '--font-archivo', subsets: ['latin'], axes: ['wdth'] });
const plexMono = IBM_Plex_Mono({ variable: '--font-plex-mono', subsets: ['latin'], weight: ['500', '600'] });

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.baseUrl),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e9eae5' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f10' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
