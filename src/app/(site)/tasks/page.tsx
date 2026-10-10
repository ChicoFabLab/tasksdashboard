import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listMembersForPicker, listTasks, recentWins } from '@/lib/server/data';
import { BoardFilters } from '@/components/board-filters';
import type { Task } from '@/lib/types';
import { DoneCard, TaskTile } from '@/components/cards';
import { ButtonLink, PageHeader, cx } from '@/components/ui';
import { zoneColor } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tasks' };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ zone?: string; col?: string; q?: string; fits?: string; who?: string; sort?: string }> }) {
  const sp = await searchParams;
  const [live, wins, members] = await Promise.all([
    listTasks({ status: ['open', 'in_progress', 'pending_approval'], limit: 300 }),
    recentWins(40, { finishedOnly: true }),
    listMembersForPicker(),
  ]);
  const zones = [...new Set(live.map((t) => t.zone))].sort();
  const zone = sp.zone && zones.includes(sp.zone as never) ? sp.zone : undefined;
  const q = (sp.q ?? '').trim().toLowerCase().slice(0, 80);
  const fits = FITS.some(([m]) => String(m) === sp.fits) ? Number(sp.fits) : 0;
  const who = sp.who && /^[a-z0-9]{15}$/.test(sp.who) ? sp.who : '';

  // People worth filtering by: anyone on, or who posted, a live task or a recent finish.
  const involved = new Set<string>([...live.flatMap((t) => [...t.assignees.map((a) => a.id), t.createdBy]), ...wins.flatMap((w) => w.members.map((m) => m.id))]);
  const people = members.filter((m) => involved.has(m.id));

  const keep = (t: Task) =>
    (!zone || t.zone === zone) &&
    (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) &&
    (!fits || (t.estimatedMinutes > 0 && t.estimatedMinutes <= fits)) &&
    (!who || t.createdBy === who || t.assignees.some((a) => a.id === who));
  const order = (xs: Task[]) =>
    sp.sort === 'quickest'
      ? [...xs].sort((a, b) => (a.estimatedMinutes || 1e9) - (b.estimatedMinutes || 1e9))
      : sp.sort === 'zone'
        ? [...xs].sort((a, b) => a.zone.localeCompare(b.zone))
        : xs;

  const todo = order(live.filter((t) => t.status === 'open' && keep(t)));
  const doing = order(live.filter((t) => t.status !== 'open' && keep(t)));
  const done = wins
    .filter((w) => !zone || w.task?.zone === zone)
    .filter((w) => !q || (w.task?.title ?? '').toLowerCase().includes(q))
    .filter((w) => !who || w.members.some((m) => m.id === who))
    .slice(0, 20);
  const filtered = Boolean(zone || q || fits || who);

  // Build links that keep the other filters.
  const href = (changes: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && typeof v === 'string') p.set(k, v);
    for (const [k, v] of Object.entries(changes)) (v ? p.set(k, v) : p.delete(k));
    const s = p.toString();
    return `/tasks${s ? `?${s}` : ''}`;
  };

  // One list at a time, as a dense grid, so as many tasks as possible are visible.
  const col = sp.col === 'doing' || sp.col === 'done' ? sp.col : 'todo';
  const colHref = (c: string) => href({ col: c === 'todo' ? '' : c });

  return (
    <>
      <PageHeader
        title="Task board"
        subtitle="Pick one, claim it, finish it, get credit."
        action={
          <ButtonLink href="/tasks/new" variant="secondary" size="sm">
            <Plus className="size-4" aria-hidden /> Post a task
          </ButtonLink>
        }
      />

      <div className="mb-4 space-y-3">
        <BoardFilters people={people} />

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-muted">I have:</span>
          {FITS.map(([m, label]) => (
            <Chip key={m} href={href({ fits: fits === m ? '' : String(m) })} active={fits === m}>
              {label}
            </Chip>
          ))}
        </div>

        {zones.length > 1 && (
          /* Two rows on phones so one swipe shows twice as many zones; wraps on wider screens. */
          <div className="no-scrollbar -mx-4 grid auto-cols-max grid-flow-col grid-rows-2 gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex sm:flex-wrap sm:px-0">
            <Chip href={href({ zone: '' })} active={!zone}>
              All zones
            </Chip>
            {zones.map((z) => (
              <Chip key={z} href={href({ zone: zone === z ? '' : z })} active={zone === z}>
                <span className="size-2.5 rounded-full" style={{ background: zoneColor(z) }} aria-hidden />
                {z}
              </Chip>
            ))}
          </div>
        )}

        {filtered && (
          <p className="text-sm text-muted">
            Showing {todo.length + doing.length} matching task{todo.length + doing.length === 1 ? '' : 's'} ·{' '}
            <Link href={sp.col ? `/tasks?col=${sp.col}` : '/tasks'} className="font-medium text-accent hover:underline">
              Clear filters
            </Link>
          </p>
        )}
      </div>

      <div role="tablist" aria-label="Column" className="mb-4 grid grid-cols-3 rounded-xl bg-surface-2 p-1 sm:inline-grid">
        {(
          [
            ['todo', 'Open', todo.length],
            ['doing', 'In progress', doing.length],
            ['done', 'Done', done.length],
          ] as const
        ).map(([k, label, n]) => (
          <Link
            key={k}
            role="tab"
            aria-selected={col === k}
            href={colHref(k)}
            scroll={false}
            className={cx('flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-sm font-medium sm:px-4', col === k ? 'bg-surface text-ink shadow-sm' : 'text-muted')}
          >
            {label} <span className="tabular-nums text-muted">{n}</span>
          </Link>
        ))}
      </div>

      {col !== 'done' ? (
        (col === 'todo' ? todo : doing).length ? (
          <ul className="grid grid-cols-1 gap-2.5 pb-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {(col === 'todo' ? todo : doing).map((t) => (
              <li key={t.id} className="flex min-w-0">
                <TaskTile task={t} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyCol
            text={
              filtered
                ? 'No tasks match these filters — try a longer time or another zone.'
                : col === 'todo'
                  ? 'Nothing open here — add a task?'
                  : 'Nobody’s working on anything right now.'
            }
          />
        )
      ) : done.length ? (
        <div className="grid gap-2.5 pb-4 sm:grid-cols-2 lg:grid-cols-3">
          {done.map((w) => (
            <DoneCard key={w.key} win={w} />
          ))}
        </div>
      ) : (
        <EmptyCol text="Finished tasks show up here." />
      )}
    </>
  );
}

const FITS: [number, string][] = [
  [15, '15 min'],
  [30, '30 min'],
  [60, '1 hr'],
  [120, '2 hr'],
];

function EmptyCol({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-line-strong px-3 py-6 text-center text-sm text-muted">{text}</p>;
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={cx(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition',
        active ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
      )}
    >
      {children}
    </Link>
  );
}
