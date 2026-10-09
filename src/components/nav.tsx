'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Camera, Hammer, Home, Plus, Sparkles, User, X } from 'lucide-react';
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
            'inline-flex h-11 items-center rounded-xl px-4 text-[15px] font-semibold transition',
            match(path) ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
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
  const [sheet, setSheet] = useState(false);
  useEffect(() => setSheet(false), [path]);
  const tabs = [
    LINKS[0],
    LINKS[1],
    null, // the "+" action
    LINKS[2],
    {
      href: signedIn ? '/me' : '/login',
      label: signedIn ? 'You' : 'Sign in',
      icon: User,
      match: (p: string) => p.startsWith('/me') || p === '/login' || p === '/signup',
    },
  ];
  return (
    <>
      {sheet && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setSheet(false)}>
          <div
            role="dialog"
            aria-label="Add something"
            className="rise absolute inset-x-0 bottom-0 space-y-3 border-t-[1.5px] border-ink bg-paper p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="display text-2xl font-extrabold uppercase">Add to the board</p>
              <button onClick={() => setSheet(false)} className="grid size-11 place-items-center rounded-xl" aria-label="Close">
                <X className="size-6" />
              </button>
            </div>
            <Link href="/creations/new" className="pressable flex items-center gap-4 rounded-xl bg-accent p-4 text-accent-ink [--press:0_3px_0_var(--accent-strong)]">
              <Camera className="size-7" aria-hidden />
              <span>
                <span className="block text-lg font-bold">Share a creation</span>
                <span className="block text-sm opacity-85">Photos of something you made</span>
              </span>
            </Link>
            <Link href="/tasks/new" className="pressable flex items-center gap-4 rounded-xl border-[1.5px] border-line-strong bg-surface p-4">
              <Hammer className="size-7" aria-hidden />
              <span>
                <span className="block text-lg font-bold">Post a task</span>
                <span className="block text-sm text-muted">A job someone else could pick up</span>
              </span>
            </Link>
          </div>
        </div>
      )}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-line-strong bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {tabs.map((tab) => {
            if (!tab) {
              return (
                <li key="add">
                  <button
                    onClick={() => setSheet(true)}
                    aria-haspopup="dialog"
                    className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-ink"
                  >
                    <span className="grid h-8 w-11 place-items-center rounded-lg bg-accent text-accent-ink">
                      <Plus className="size-5" strokeWidth={2.5} aria-hidden />
                    </span>
                    Add
                  </button>
                </li>
              );
            }
            const { href, label, icon: Icon, match } = tab;
            const active = match(path);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cx('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold', active ? 'text-ink' : 'text-muted')}
                >
                  <Icon className={cx('size-6', active && 'text-accent')} strokeWidth={active ? 2.4 : 2} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
