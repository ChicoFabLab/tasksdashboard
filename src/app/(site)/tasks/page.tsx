import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listTasks, recentWins } from '@/lib/server/data';
import { DoneCard, TaskTile } from '@/components/cards';
import { ButtonLink, PageHeader, cx } from '@/components/ui';
import { zoneColor } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tasks' };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ zone?: string; col?: string }> }) {
  const sp = await searchParams;
  const [live, wins] = await Promise.all([listTasks({ status: ['open', 'in_progress', 'pending_approval'], limit: 300 }), recentWins(20)]);
  const zones = [...new Set(live.map((t) => t.zone))].sort();
  const zone = sp.zone && zones.includes(sp.zone as never) ? sp.zone : undefined;
  const inZone = <T extends { zone: string }>(xs: T[]) => (zone ? xs.filter((t) => t.zone === zone) : xs);

  const todo = inZone(live.filter((t) => t.status === 'open'));
  const doing = inZone(live.filter((t) => t.status !== 'open'));
  const done = zone ? wins.filter((w) => w.task?.zone === zone) : wins;
  // One list at a time, as a dense grid, so as many tasks as possible are visible.
  const col = sp.col === 'doing' || sp.col === 'done' ? sp.col : 'todo';
  const colHref = (c: string) => {
    const p = new URLSearchParams();
    if (zone) p.set('zone', zone);
    if (c !== 'todo') p.set('col', c);
    const q = p.toString();
    return `/tasks${q ? `?${q}` : ''}`;
  };

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

      {zones.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip href={col === 'todo' ? '/tasks' : `/tasks?col=${col}`} active={!zone}>
            All zones
          </Chip>
          {zones.map((z) => (
            <Chip key={z} href={`/tasks?zone=${encodeURIComponent(z)}${col === 'todo' ? '' : `&col=${col}`}`} active={zone === z}>
              <span className="size-2.5 rounded-full" style={{ background: zoneColor(z) }} aria-hidden />
              {z}
            </Chip>
          ))}
        </div>
      )}

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
          <EmptyCol text={col === 'todo' ? 'Nothing open here — add a task?' : 'Nobody’s working on anything right now.'} />
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
