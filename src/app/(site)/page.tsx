import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { labStats, listCreations, listTasks, recentWins } from '@/lib/server/data';
import { getCurrentUser } from '@/lib/server/session';
import { formatMinutes, plural, timeAgo } from '@/lib/format';
import { CreationCard, TaskCard, WinCard } from '@/components/cards';
import { Avatar, ButtonLink, EmptyState, SectionHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [user, stats, wins, creations, tasks] = await Promise.all([
    getCurrentUser(),
    labStats(),
    recentWins(8),
    listCreations({ limit: 8 }),
    listTasks({ status: 'open', limit: 6 }),
  ]);
  // In quiet months, all-time totals tell a truer story than "1 task this month".
  const busy = stats.tasksDone30d >= 10;
  const totals = busy
    ? [
        [stats.tasksDone30d, 'tasks done', '30 days'],
        [stats.hours30d, 'hours given', '30 days'],
        [stats.makers30d, 'makers', '30 days'],
      ]
    : [
        [stats.tasksDoneAllTime, 'tasks done', 'all time'],
        [stats.hoursAllTime, 'hours given', 'all time'],
        [creations.length, 'creations', 'shared'],
      ];

  return (
    <div className="space-y-14 sm:space-y-16">
      {/* Live headline — what needs doing, and who did the last thing */}
      <section className="rise grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          {user && <p className="mb-2 font-mono text-[13px] font-semibold uppercase tracking-wider text-muted">Hey {user.name}</p>}
          <h1 className="display text-[52px] font-extrabold uppercase leading-[0.9] sm:text-[88px]">
            {stats.openTasks > 0 ? (
              <>
                <span className="text-accent">{stats.openTasks}</span> {stats.openTasks === 1 ? 'job needs' : 'jobs need'} a hand
              </>
            ) : (
              'The board is clear'
            )}
          </h1>
          {stats.lastWin && (
            <Link href={`/makers/${stats.lastWin.member.id}`} className="mt-5 inline-flex items-center gap-3 rounded-xl text-[17px] hover:underline">
              <Avatar member={stats.lastWin.member} size={36} />
              <span>
                Last job finished <strong>{timeAgo(stats.lastWin.created)}</strong> by <strong>{stats.lastWin.member.name}</strong>
              </span>
            </Link>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/tasks" size="lg">
              Grab a task <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/creations/new" size="lg" variant="secondary">
              <Plus className="size-5" aria-hidden /> Share a creation
            </ButtonLink>
          </div>
        </div>
        <dl className="grid grid-cols-3 border-[1.5px] border-ink bg-surface lg:w-[420px]">
          {totals.map(([v, l, w], i) => (
            <div key={String(l)} className={i ? 'border-l-[1.5px] border-ink p-4' : 'p-4'}>
              <dd className="display text-[44px] font-extrabold leading-none">{v}</dd>
              <dt className="mt-1.5 text-sm font-semibold leading-tight">{l}</dt>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">{w}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <SectionHeader
          title="Recent wins"
          action={
            <Link href="/tasks?status=completed" className="text-[15px] font-semibold underline-offset-4 hover:underline">
              See all
            </Link>
          }
        />
        {wins.length ? (
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {wins.map((w) => (
              <WinCard key={w.key} win={w} className="w-[80vw] max-w-[330px] shrink-0 snap-start sm:w-auto sm:max-w-none" />
            ))}
          </div>
        ) : (
          <EmptyState title="No finished tasks yet" body="Be the first — pick something from the board." action={<ButtonLink href="/tasks">Browse tasks</ButtonLink>} />
        )}
      </section>

      <section>
        <SectionHeader
          title="Made here"
          action={
            <Link href="/creations" className="text-[15px] font-semibold underline-offset-4 hover:underline">
              Gallery
            </Link>
          }
        />
        {creations.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {creations.map((c) => (
              <CreationCard key={c.id} creation={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Show us what you made"
            body="Snap a photo of your project and it’ll show up here and on the big screen."
            action={<ButtonLink href="/creations/new">Share a creation</ButtonLink>}
          />
        )}
      </section>

      <div className="grid gap-14 lg:grid-cols-[2fr_1fr] lg:gap-10">
        <section>
          <SectionHeader
            title="Open jobs"
            kicker={`${stats.openTasks} open`}
            action={
              <ButtonLink href="/tasks" variant="secondary" size="sm">
                All tasks
              </ButtonLink>
            }
          />
          {tasks.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {tasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <EmptyState title="The board is clear" body="Nothing open right now. Spotted something that needs doing?" action={<ButtonLink href="/tasks/new">Post a task</ButtonLink>} />
          )}
        </section>

        <section>
          <SectionHeader title="Shop heroes" kicker={stats.topMakersWindow.toLowerCase()} />
          {stats.topMakers.length ? (
            <ol className="border-[1.5px] border-line-strong bg-surface">
              {stats.topMakers.map((t, i) => (
                <li key={t.member.id} className={i ? 'border-t border-line' : undefined}>
                  <Link href={`/makers/${t.member.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
                    <span className="display w-6 text-2xl font-extrabold text-muted">{i + 1}</span>
                    <Avatar member={t.member} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{t.member.name}</span>
                      <span className="block text-sm text-muted">{plural(t.tasks, 'task')}</span>
                    </span>
                    <span className="font-mono text-sm font-semibold">{formatMinutes(t.minutes)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="Your name here" body="Finish a task to get on the board." />
          )}
        </section>
      </div>
    </div>
  );
}
