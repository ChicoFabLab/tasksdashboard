import type { MemberActivity } from '@/lib/server/data';
import { groupWins } from '@/lib/server/data';
import { formatHours } from '@/lib/format';
import { CreationCard, TaskCard, WinRow } from './cards';
import { EmptyState, SectionHeader, StatTile } from './ui';

export function ActivityStats({ a }: { a: MemberActivity }) {
  const items = [
    { v: formatHours(a.minutes), l: 'Hours logged' },
    { v: a.tasksDone, l: 'Tasks done' },
    { v: a.creations.length, l: 'Creations' },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 lg:max-w-2xl">
      {items.map((s) => (
        <StatTile key={s.l} label={s.l} value={s.v} />
      ))}
    </div>
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
          <div className="rounded-2xl border border-line bg-surface p-2">
            {wins.map((w) => (
              <WinRow key={w.key} win={w} />
            ))}
          </div>
        ) : (
          <EmptyState title={self ? 'No tasks finished yet' : 'No finished tasks yet'} body={self ? 'Pick one from the board — most take under an hour.' : undefined} />
        )}
      </section>
    </div>
  );
}
