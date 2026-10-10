import Link from 'next/link';
import { Plus } from 'lucide-react';
import { labStats, leaderboard, listCreations, listTasks, recentWins } from '@/lib/server/data';
import { getCurrentUser } from '@/lib/server/session';
import { timeAgo } from '@/lib/format';
import { CreationCard, TaskCard, WinRow } from '@/components/cards';
import { ButtonLink, EmptyState, LeaderList, Panel, StatTile } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [user, stats, wins, creations, tasks, monthBoard] = await Promise.all([
    getCurrentUser(),
    labStats(),
    recentWins(6),
    listCreations({ limit: 4 }),
    listTasks({ status: 'open', limit: 6 }),
    leaderboard('month', 5),
  ]);
  // Fall back to all-time when this month is still empty, so the board is never blank.
  const board = monthBoard.length >= 3 ? monthBoard : await leaderboard('all', 5);
  const boardLabel = board === monthBoard ? 'This month' : 'All time';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-3xl font-bold sm:text-4xl">{user ? `Welcome back, ${user.name}` : 'Task board'}</h1>
          <p className="mt-1 text-muted">
            {stats.lastWin ? (
              <>
                Last task finished {timeAgo(stats.lastWin.created)} by{' '}
                <Link href={`/makers/${stats.lastWin.member.id}`} className="font-medium text-ink hover:underline">
                  {stats.lastWin.member.name}
                </Link>
              </>
            ) : (
              'Pick a task, get it done, get credit.'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/tasks/new" variant="secondary">
            <Plus className="size-4" aria-hidden /> Post a task
          </ButtonLink>
          <ButtonLink href="/creations/new">
            <Plus className="size-4" aria-hidden /> Share a creation
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Open tasks" value={stats.openTasks} hint="Ready to claim" />
        <StatTile label="In progress" value={stats.inProgressTasks} hint="Someone’s on it" />
        <StatTile label="Tasks done" value={stats.tasksDoneAllTime} hint={`${stats.tasksDone30d} in the last 30 days`} />
        <StatTile label="Hours logged" value={stats.hoursAllTime} hint={`${stats.makers30d} active in the last 30 days`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Open tasks</h2>
            <Link href="/tasks" className="text-sm font-medium text-accent hover:underline">
              View all {stats.openTasks}
            </Link>
          </div>
          {tasks.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {tasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <EmptyState title="No open tasks" body="Spotted something that needs doing? Post it so someone can pick it up." action={<ButtonLink href="/tasks/new">Post a task</ButtonLink>} />
          )}
        </section>

        <div className="space-y-6">
          <Panel
            title="Recently finished"
            action={
              <Link href="/leaderboard#activity" className="text-sm font-medium text-accent hover:underline">
                All activity
              </Link>
            }
          >
            {wins.length ? (
              wins.map((w) => <WinRow key={w.key} win={w} />)
            ) : (
              <p className="p-3 text-sm text-muted">Nothing finished yet — be the first.</p>
            )}
          </Panel>
          <Panel
            title={`Leaderboard · ${boardLabel}`}
            action={
              <Link href="/leaderboard" className="text-sm font-medium text-accent hover:underline">
                Full board
              </Link>
            }
          >
            {board.length ? <LeaderList rows={board} /> : <p className="p-3 text-sm text-muted">Finish a task to get on the board.</p>}
          </Panel>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest creations</h2>
          <Link href="/creations" className="text-sm font-medium text-accent hover:underline">
            Gallery
          </Link>
        </div>
        {creations.length ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {creations.map((c) => (
              <CreationCard key={c.id} creation={c} />
            ))}
          </div>
        ) : (
          <EmptyState title="No creations yet" body="Made something at the lab? Share a photo." action={<ButtonLink href="/creations/new">Share a creation</ButtonLink>} />
        )}
      </section>
    </div>
  );
}
