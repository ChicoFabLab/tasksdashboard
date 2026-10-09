import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { cx } from './ui';

/** Typographic mark: an orange "task tag" square + the site name. */
export function Logo({ size = 'md', href = '/' }: { size?: 'md' | 'lg'; href?: string | null }) {
  const inner = siteConfig.logoPath ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={siteConfig.logoPath} alt={siteConfig.name} className={size === 'lg' ? 'h-12 w-auto' : 'h-9 w-auto'} />
  ) : (
    <span className="flex items-center gap-2.5">
      <span
        className={cx(
          'grid place-items-center rounded-lg bg-accent font-mono font-bold text-accent-ink',
          size === 'lg' ? 'size-12 text-xl' : 'size-9 text-[15px]',
        )}
        aria-hidden
      >
        {siteConfig.shortName.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'TD'}
      </span>
      <span className={cx('font-semibold tracking-tight', size === 'lg' ? 'text-2xl' : 'text-[17px]')}>
        {siteConfig.name}
      </span>
    </span>
  );
  return href ? (
    <Link href={href} className="inline-flex items-center rounded-lg" aria-label={`${siteConfig.name} home`}>
      {inner}
    </Link>
  ) : (
    inner
  );
}
