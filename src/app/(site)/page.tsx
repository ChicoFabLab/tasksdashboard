import Link from 'next/link';
import { ArrowRight, Plus, QrCode } from 'lucide-react';
import { labStats, listCreations, listTasks, recentWins } from '@/lib/server/data';
import { getCurrentUser } from '@/lib/server/session';
import { siteConfig } from '@/lib/site-config';
import { formatHours, formatMinutes, plural } from '@/lib/format';
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
  const busy = stats.tasksDone30d >= 5;

  return (
    <div className="space-y-14 sm:space-y-20">
      {/* Hero */}
      <section className="mat -mx-4 -mt-6 border-b border-line px-4 pb-10 pt-8 sm:-mx-6 sm:-mt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:-mx-8 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div className="rise">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
              {user ? `Welcome back, ${user.name}` : siteConfig.name}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl">
              {siteConfig.tagline}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Grab a quick job around the shop, get credit for your time, and show off what you’ve built.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/tasks" size="lg">
                Find a task <ArrowRight className="size-5" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/creations/new" size="lg" variant="secondary">
                <Plus className="size-5" aria-hidden /> Share a creation
              </ButtonLink>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-muted">
              <QrCode className="size-4" aria-hidden /> At the lab? Scan any task’s QR code on the big screen to claim it.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-3 rise [animation-delay:80ms]">
            {busy ? (
              <>
                <Stat value={stats.tasksDone30d} label="tasks done" />
                <Stat value={formatHours(stats.hours30d * 60)} label="hours given" />
                <Stat value={stats.makers30d} label="makers" />
              </>
            ) : (
              <>
                <Stat value={stats.tasksDoneAllTime} label="tasks done" />
                <Stat value={stats.hoursAllTime} label="hours given" />
                <Stat value={stats.openTasks} label="open now" />
              </>
            )}
            <p className="col-span-3 text-sm text-muted">
              {busy ? `Last 30 days · ${plural(stats.tasksDoneAllTime, 'task')} and ${stats.hoursAllTime} hours all-time` : 'Since the board started · every hour counts'}
            </p>
          </dl>
        </div>
      </section>

      {/* Recent wins */}
      <section>
        <SectionHeader
          kicker="Recently finished"
          title="Wins around the shop"
          action={
            <Link href="/tasks?status=completed" className="text-[15px] font-semibold text-ink underline-offset-4 hover:underline">
              See all
            </Link>
          }
        />
        {wins.length ? (
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {wins.map((w) => (
              <WinCard key={w.key} win={w} className="w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-auto sm:max-w-none" />
            ))}
          </div>
        ) : (
          <EmptyState title="No finished tasks yet" body="Be the first — pick something from the board." action={<ButtonLink href="/tasks">Browse tasks</ButtonLink>} />
        )}
      </section>

      {/* Creations */}
      <section>
        <SectionHeader
          kicker="Made here"
          title="Fresh from the shop"
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
        {/* Open tasks */}
        <section>
          <SectionHeader
            kicker={`${stats.openTasks} open`}
            title="Jobs that need a hand"
            action={
              <ButtonLink href="/tasks" variant="secondary" size="sm">
                All tasks
              </ButtonLink>
            }
          />
          {tasks.length ? (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {tasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <EmptyState title="The board is clear" body="Nothing open right now. Spotted something that needs doing?" action={<ButtonLink href="/tasks/new">Post a task</ButtonLink>} />
          )}
        </section>

        {/* Top makers */}
        <section>
          <SectionHeader kicker={stats.topMakersWindow} title="Shop heroes" />
          {stats.topMakers.length ? (
            <ol className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {stats.topMakers.map((t, i) => (
                <li key={t.member.id}>
                  <Link href={`/makers/${t.member.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
                    <span className="w-5 font-mono text-sm text-muted">{i + 1}</span>
                    <Avatar member={t.member} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{t.member.name}</span>
                      <span className="block text-sm text-muted">{plural(t.tasks, 'task')}</span>
                    </span>
                    <span className="text-sm font-semibold">{formatMinutes(t.minutes)}</span>
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

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <dd className="text-3xl font-semibold tracking-tight sm:text-4xl">{value}</dd>
      <dt className="mt-1 text-sm text-muted">{label}</dt>
    </div>
  );
}
