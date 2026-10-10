import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { cx } from './ui';

function initials() {
  return siteConfig.shortName.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'TD';
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg bg-accent font-bold tracking-tight text-accent-ink"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden
    >
      {initials()}
    </span>
  );
}

export function Logo({ size = 'md', href = '/' }: { size?: 'md' | 'lg'; href?: string | null }) {
  const lg = size === 'lg';
  const inner = (
    <span className="flex items-center gap-2.5 whitespace-nowrap">
      {siteConfig.logoPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={siteConfig.logoPath} alt="" className={cx('shrink-0 rounded-full object-cover shadow-sm', lg ? 'size-16' : 'size-10')} />
      ) : (
        <LogoMark size={lg ? 52 : 34} />
      )}
      <span className="leading-tight">
        <span className={cx('block font-semibold tracking-tight', lg ? 'text-[26px]' : 'text-[16px]')}>{siteConfig.name}</span>
        <span className={cx('block text-muted', lg ? 'text-[18px]' : 'text-[12px]')}>Task board</span>
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
