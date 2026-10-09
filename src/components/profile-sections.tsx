import Link from 'next/link';
import type { MemberActivity } from '@/lib/server/data';
import { groupWins } from '@/lib/server/data';
import { formatHours, formatMinutes, shortDate, taskNo } from '@/lib/format';
import { CreationCard, TaskCard } from './cards';
import { EmptyState, SectionHeader, ZoneTag } from './ui';

export function ActivityStats({ a }: { a: MemberActivity }) {
  const items = [
    { v: formatHours(a.minutes), l: 'hours given' },
    { v: a.tasksDone, l: 'tasks done' },
    { v: a.creations.length, l: 'creations' },
  ];
  return (
    <dl className="grid grid-cols-3 gap-3">
      {items.map((s) => (
        <div key={s.l} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <dd className="text-3xl font-semibold tracking-tight">{s.v}</dd>
          <dt className="mt-1 text-sm text-muted">{s.l}</dt>
        </div>
      ))}
    </dl>
  );
}

export function ActivityBody({ a, self }: { a: MemberActivity; self?: boolean }) {
  const wins = groupWins(a.completions);
  return (
    <div className="space-y-12">
      {a.activeTasks.length > 0 && (
        <section>
          <SectionHeader title={self ? 'You’re working on' : 'Working on'} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {a.activeTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Creations" />
        {a.creations.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {a.creations.map((c) => (
              <CreationCard key={c.id} creation={c} />
            ))}
          </div>
        ) : (
          <EmptyState title={self ? 'Nothing shared yet' : 'No creations yet'} body={self ? 'Post a photo of something you made — it shows up on the big screen.' : undefined} />
        )}
      </section>

      <section>
        <SectionHeader title="Finished tasks" />
        {wins.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {wins.map((w) => (
              <li key={w.key}>
                <Link href={w.task ? `/tasks/${w.task.id}` : '#'} className="flex items-center gap-4 px-4 py-3.5 hover:bg-surface-2 sm:px-5">
                  {w.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.photo} alt="" className="size-12 rounded-lg object-cover" />
                  ) : (
                    <span className="grid size-12 place-items-center rounded-lg bg-surface-2 font-mono text-sm text-muted">{w.task ? taskNo(w.task.number) : '✓'}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{w.task?.title ?? 'Task'}</span>
                    <span className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
                      {w.task && <ZoneTag zone={w.task.zone} className="text-sm" />}
                      {shortDate(w.created)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold">{formatMinutes(w.minutes)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={self ? 'No tasks finished yet' : 'No finished tasks yet'} body={self ? 'Pick one from the board — most take under an hour.' : undefined} />
        )}
      </section>
    </div>
  );
}
