import Link from 'next/link';
import { ArrowRight, Camera, Plus } from 'lucide-react';
import { labStats, listCreations, listTasks, recentWins, tasksLogged } from '@/lib/server/data';
import { TaskTile } from '@/components/cards';
import { Avatar, ButtonLink, LoggedList, Panel, cx, names } from '@/components/ui';
import { timeAgo, zoneColor } from '@/lib/format';

export const dynamic = 'force-dynamic';

const DESKTOP_TASKS = 24;
const PHONE_TASKS = 8;

/**
 * Space budget (desktop first screen): ~72% open tasks, ~18% creations (share + view),
 * ~10% recognition. Phones: tasks first, creations next, the rest below.
 */
export default async function HomePage({ searchParams }: { searchParams: Promise<{ zone?: string }> }) {
  const sp = await searchParams;
  const [stats, open, wins, creations, monthBoard] = await Promise.all([
    labStats(),
    listTasks({ status: 'open', limit: 200 }),
    recentWins(4),
    listCreations({ limit: 4 }),
    tasksLogged('month', 8),
  ]);
  const board = monthBoard.length >= 3 ? monthBoard : await tasksLogged('all', 8);
  const boardLabel = board === monthBoard ? 'this month' : 'all time';

  const zones = [...new Set(open.map((t) => t.zone))].sort();
  const zone = sp.zone && zones.includes(sp.zone as never) ? sp.zone : undefined;
  const tasks = zone ? open.filter((t) => t.zone === zone) : open;
  const shown = tasks.slice(0, DESKTOP_TASKS);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_5px_320px] lg:gap-8">
      {/* A) Find a task */}
      <section aria-labelledby="open-tasks" className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 id="open-tasks" className="text-2xl font-bold tracking-tight">
            {tasks.length} open {tasks.length === 1 ? 'task' : 'tasks'}
            {zone && <span className="text-muted"> in {zone}</span>}
          </h1>
          <span className="hidden sm:block">
            <ButtonLink href="/tasks/new" variant="secondary" size="sm">
              <Plus className="size-4" aria-hidden /> Post a task
            </ButtonLink>
          </span>
          {/* On phones, sharing a creation is the second job — keep it one tap away. */}
          <ButtonLink href="/creations/new" variant="sun" size="sm" className="sm:hidden">
            <Camera className="size-4" aria-hidden /> Share a creation
          </ButtonLink>
        </div>

        {zones.length > 1 && (
          <nav aria-label="Filter by zone" className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ZoneChip href="/" active={!zone}>
              All
            </ZoneChip>
            {zones.map((z) => (
              <ZoneChip key={z} href={`/?zone=${encodeURIComponent(z)}`} active={zone === z}>
                <span className="size-2.5 rounded-full" style={{ background: zoneColor(z) }} aria-hidden />
                {z}
              </ZoneChip>
            ))}
          </nav>
        )}

        {shown.length ? (
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((t, i) => (
              <li key={t.id} className={cx('flex min-w-0', i >= PHONE_TASKS && 'hidden sm:flex')}>
                <TaskTile task={t} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line-strong bg-surface px-4 py-8 text-center text-muted">
            No open tasks{zone ? ` in ${zone}` : ''} right now.{' '}
            <Link href="/tasks/new" className="font-medium text-accent hover:underline">
              Post one
            </Link>
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
          {tasks.length > PHONE_TASKS && (
            <Link href={zone ? `/tasks?zone=${encodeURIComponent(zone)}` : '/tasks'} className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
              See all {tasks.length} tasks <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
          {stats.inProgressTasks > 0 && (
            <Link href="/tasks?col=doing" className="text-muted hover:text-ink hover:underline">
              {stats.inProgressTasks} in progress
            </Link>
          )}
          <span className="text-muted">
            {stats.tasksDoneAllTime} done · {stats.hoursAllTime} hours logged
          </span>
        </div>
      </section>

      {/* Ribbon joins the header and footer ribbons (desktop) */}
      <div className="stripes-v hidden lg:block lg:-mb-16 lg:-mt-10" aria-hidden />

      {/* B) Creations, then recognition */}
      <aside className="min-w-0 space-y-5">
        <section aria-labelledby="creations" className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="creations" className="text-base font-semibold">
              Creations
            </h2>
            <Link href="/creations" className="text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          <ButtonLink href="/creations/new" variant="sun" block className="mt-3">
            <Camera className="size-5" aria-hidden /> Share a creation
          </ButtonLink>
          {creations.length > 0 && (
            <ul className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-2 lg:px-0">
              {creations.map((c) => (
                <li key={c.id} className="w-36 shrink-0 lg:w-auto">
                  <Link href={`/creations/${c.id}`} className="group block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.thumbs[0]} alt="" className="aspect-square w-full rounded-lg bg-surface-2 object-cover group-hover:opacity-90" loading="lazy" />
                    <span className="cap mt-1 block truncate text-[13px] font-medium">{c.title}</span>
                    <span className="block truncate text-[12px] text-muted">{c.member.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Panel
          title="Recently finished"
          action={
            <Link href="/activity#activity" className="text-sm font-medium text-accent hover:underline">
              All
            </Link>
          }
        >
          {wins.length ? (
            <ul>
              {wins.map((w) => (
                <li key={w.key}>
                  <Link href={w.task ? `/tasks/${w.task.id}` : '/activity#activity'} className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-surface-2">
                    <Avatar member={w.members[0]} size={28} />
                    <span className="min-w-0 text-[13px] leading-snug">
                      <strong>{names(w.members, 2)}</strong> <span className="text-muted">{w.partial ? 'worked on' : 'finished'}</span>{' '}
                      <span className="cap font-medium">{w.task?.title ?? 'a task'}</span>
                      <span className="block text-muted">{timeAgo(w.created)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-2 text-sm text-muted">Nothing finished yet.</p>
          )}
        </Panel>

        <Panel
          title={`Tasks logged · ${boardLabel}`}
          action={
            <Link href="/activity" className="text-sm font-medium text-accent hover:underline">
              All
            </Link>
          }
        >
          {board.length ? <LoggedList rows={board} /> : <p className="p-2 text-sm text-muted">Finish a task to get on the board.</p>}
        </Panel>
      </aside>
    </div>
  );
}

function ZoneChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={cx(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium',
        active ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
      )}
    >
      {children}
    </Link>
  );
}
