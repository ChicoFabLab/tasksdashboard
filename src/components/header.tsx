import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getCurrentUser } from '@/lib/server/session';
import { Logo } from './logo';
import { DesktopLinks, MobileTabBar } from './nav';
import { Avatar, ButtonLink } from './ui';

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="ml-2 min-w-0 flex-1 lg:ml-6">
            <DesktopLinks />
          </div>
          <span className="hidden md:block">
            <ButtonLink href="/creations/new" variant="sun" size="sm">
              <Plus className="size-4" aria-hidden /> Share a creation
            </ButtonLink>
          </span>
          {user ? (
            <Link href="/me" className="flex shrink-0 items-center gap-2 rounded-full p-1 hover:bg-surface-2 md:pr-3" aria-label="Your dashboard">
              <Avatar member={user} size={36} />
              <span className="hidden max-w-[10rem] truncate text-[15px] font-medium md:inline">{user.name}</span>
            </Link>
          ) : (
            <ButtonLink href="/login" variant="dark" size="sm" className="shrink-0">
              Sign in
            </ButtonLink>
          )}
        </div>
        <div className="stripes" aria-hidden />
      </header>
      <MobileTabBar signedIn={Boolean(user)} />
    </>
  );
}
