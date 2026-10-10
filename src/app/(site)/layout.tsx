import { SiteHeader } from '@/components/header';
import { siteConfig } from '@/lib/site-config';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10 md:pb-16 lg:px-8">{children}</main>
      <footer className="pb-20 md:pb-0">
        <div className="stripes" aria-hidden />
        <p className="mx-auto hidden max-w-7xl px-8 py-6 text-sm text-muted md:block">
          {siteConfig.name} · {siteConfig.tagline}
        </p>
      </footer>
    </>
  );
}
