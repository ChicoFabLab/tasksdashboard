import { redirect } from 'next/navigation';
import { Hammer, Plus, Settings } from 'lucide-react';
import { getCurrentUser } from '@/lib/server/session';
import { memberActivity } from '@/lib/server/data';
import { Avatar, ButtonLink, Notice } from '@/components/ui';
import { ActivityBody, ActivityStats } from '@/components/profile-sections';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your dashboard' };

export default async function MePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/me');
  const sp = await searchParams;
  const a = await memberActivity(user.id);

  return (
    <div className="space-y-10">
      {sp.welcome && (
        <Notice tone="good">
          You’re in, {user.name}! Grab a task from the board or share something you made.{' '}
          {!user.photo && 'Adding a profile photo helps people recognise you on the big screen.'}
        </Notice>
      )}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar member={user} size={80} />
        <div className="flex-1">
          <h1 className="display text-[44px] font-extrabold uppercase leading-[0.9] sm:text-[60px]">{user.name}</h1>
          <p className="mt-1 text-muted">{user.isAdmin ? 'Admin · ' : ''}Your corner of the lab</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/tasks" variant="dark">
            <Hammer className="size-5" aria-hidden /> Find a task
          </ButtonLink>
          <ButtonLink href="/creations/new" variant="secondary">
            <Plus className="size-5" aria-hidden /> Share
          </ButtonLink>
          <ButtonLink href="/me/settings" variant="secondary">
            <Settings className="size-5" aria-hidden /> Settings
          </ButtonLink>
          {user.isAdmin && (
            <ButtonLink href="/admin" variant="secondary">
              Admin
            </ButtonLink>
          )}
        </div>
      </div>
      <ActivityStats a={a} />
      <ActivityBody a={a} self />
    </div>
  );
}
