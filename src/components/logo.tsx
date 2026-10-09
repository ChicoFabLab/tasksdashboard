import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { cx } from './ui';

function initials() {
  return siteConfig.shortName.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'TD';
}

/** Machine-plate mark: layout-blue plate, mono code, hi-vis tape stripe. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-[4px] bg-accent font-mono font-semibold text-accent-ink"
      style={{ width: size * 1.35, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      <span className="-mt-[12%]">{initials()}</span>
      <span className="absolute inset-x-0 bottom-0 h-[22%] bg-hivis" />
    </span>
  );
}

export function Logo({ size = 'md', href = '/' }: { size?: 'md' | 'lg'; href?: string | null }) {
  const lg = size === 'lg';
  const inner = siteConfig.logoPath ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={siteConfig.logoPath} alt={siteConfig.name} className={lg ? 'h-12 w-auto' : 'h-9 w-auto'} />
  ) : (
    <span className="flex items-center gap-2.5 whitespace-nowrap">
      <LogoMark size={lg ? 52 : 34} />
      <span className="leading-none">
        <span className={cx('display block font-extrabold uppercase', lg ? 'text-[30px]' : 'text-[20px]')}>{siteConfig.name}</span>
        <span className={cx('block font-mono uppercase tracking-wider text-muted', lg ? 'mt-1 text-[13px]' : 'mt-0.5 text-[10px]')}>Task board</span>
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
