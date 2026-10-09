'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hammer, Home, Plus, Sparkles, User } from 'lucide-react';
import { cx } from './ui';

const LINKS = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/tasks', label: 'Tasks', icon: Hammer, match: (p: string) => p.startsWith('/tasks') },
  { href: '/creations', label: 'Creations', icon: Sparkles, match: (p: string) => p.startsWith('/creations') && p !== '/creations/new' },
];

export function DesktopLinks() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {LINKS.map(({ href, label, match }) => (
        <Link
          key={href}
          href={href}
          aria-current={match(path) ? 'page' : undefined}
          className={cx(
            'inline-flex h-11 items-center rounded-xl px-4 text-[15px] font-medium transition',
            match(path) ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const tabs = [
    LINKS[0],
    LINKS[1],
    { href: '/creations/new', label: 'Share', icon: Plus, match: (p: string) => p === '/creations/new', primary: true },
    LINKS[2],
    {
      href: signedIn ? '/me' : '/login',
      label: signedIn ? 'You' : 'Sign in',
      icon: User,
      match: (p: string) => p.startsWith('/me') || p === '/login' || p === '/signup',
    },
  ];
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, match, ...rest }) => {
          const active = match(path);
          const primary = 'primary' in rest;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold',
                  active ? 'text-ink' : 'text-muted',
                )}
              >
                {primary ? (
                  <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-ink">
                    <Icon className="size-5" strokeWidth={2.5} aria-hidden />
                  </span>
                ) : (
                  <Icon className={cx('size-6', active && 'text-accent')} strokeWidth={active ? 2.4 : 2} aria-hidden />
                )}
                {!primary && label}
                {primary && <span className="sr-only">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
