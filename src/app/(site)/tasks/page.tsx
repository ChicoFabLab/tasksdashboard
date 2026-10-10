import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listTasks, recentWins } from '@/lib/server/data';
import { BoardColumn, DoneCard, TaskCard } from '@/components/cards';
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
  // Phones show one column at a time via tabs; desktop shows all three.
  const col = sp.col === 'doing' || sp.col === 'done' ? sp.col : 'todo';
  const colHref = (c: string) => {
    const p = new URLSearchParams();
    if (zone) p.set('zone', zone);
    if (c !== 'todo') p.set('col', c);
    const q = p.toString();
    return `/tasks${q ? `?${q}` : ''}`;
  };
  const phoneOnly = (c: string) => (col === c ? 'flex w-full' : 'hidden md:flex');

  return (
    <>
      <PageHeader
        title="Task board"
        subtitle="Pick something from To do, claim it, and it moves along as you go."
        action={
          <ButtonLink href="/tasks/new">
            <Plus className="size-5" aria-hidden /> Add a task
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

      <div role="tablist" aria-label="Column" className="mb-3 grid grid-cols-3 rounded-xl bg-surface-2 p-1 md:hidden">
        {(
          [
            ['todo', 'To do', todo.length],
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
            className={cx('flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-medium', col === k ? 'bg-surface text-ink shadow-sm' : 'text-muted')}
          >
            {label} <span className="tabular-nums text-muted">{n}</span>
          </Link>
        ))}
      </div>

      <div className="pb-4 md:grid md:grid-cols-3 md:items-start md:gap-3">
        <BoardColumn title="To do" count={todo.length} dot="#94a3b8" className={phoneOnly('todo')}>
          {todo.length ? todo.map((t) => <TaskCard key={t.id} task={t} />) : <EmptyCol text="Nothing to do here — add a task?" />}
        </BoardColumn>
        <BoardColumn title="In progress" count={doing.length} dot="#f59e0b" className={phoneOnly('doing')}>
          {doing.length ? doing.map((t) => <TaskCard key={t.id} task={t} />) : <EmptyCol text="Nobody’s working on anything right now." />}
        </BoardColumn>
        <BoardColumn title="Recently done" count={done.length} dot="#22c55e" className={phoneOnly('done')}>
          {done.length ? done.map((w) => <DoneCard key={w.key} win={w} />) : <EmptyCol text="Finished tasks show up here." />}
        </BoardColumn>
      </div>
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
