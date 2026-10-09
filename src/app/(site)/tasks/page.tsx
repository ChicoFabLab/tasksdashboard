import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listTasks } from '@/lib/server/data';
import { TaskCard } from '@/components/cards';
import { ButtonLink, EmptyState, PageHeader, cx } from '@/components/ui';
import { zoneColor } from '@/lib/format';
import type { TaskStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tasks' };

const TABS: { key: string; label: string; statuses: TaskStatus[] }[] = [
  { key: 'open', label: 'Open', statuses: ['open'] },
  { key: 'in_progress', label: 'In progress', statuses: ['in_progress', 'pending_approval'] },
  { key: 'completed', label: 'Done', statuses: ['completed'] },
];

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string; zone?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.status) ?? TABS[0];
  const all = await listTasks({ status: tab.statuses, limit: tab.key === 'completed' ? 60 : 200 });
  const zones = [...new Set(all.map((t) => t.zone))].sort();
  const zone = sp.zone && zones.includes(sp.zone as never) ? sp.zone : undefined;
  const tasks = zone ? all.filter((t) => t.zone === zone) : all;

  const href = (status: string, z?: string) => {
    const p = new URLSearchParams();
    if (status !== 'open') p.set('status', status);
    if (z) p.set('zone', z);
    const s = p.toString();
    return `/tasks${s ? `?${s}` : ''}`;
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Small jobs that keep the lab running. Claim one, finish it, get credit."
        action={
          <ButtonLink href="/tasks/new" variant="dark">
            <Plus className="size-5" aria-hidden /> Post a task
          </ButtonLink>
        }
      />

      <div className="mb-6 space-y-3">
        <div role="tablist" aria-label="Status" className="inline-flex rounded-xl border border-line bg-surface p-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              role="tab"
              aria-selected={t.key === tab.key}
              href={href(t.key, zone)}
              className={cx(
                'inline-flex h-11 items-center rounded-lg px-4 text-[15px] font-semibold transition',
                t.key === tab.key ? 'bg-ink text-paper' : 'text-muted hover:text-ink',
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {zones.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <Chip href={href(tab.key)} active={!zone}>
              All zones
            </Chip>
            {zones.map((z) => (
              <Chip key={z} href={href(tab.key, z)} active={zone === z}>
                <span className="size-2.5 rounded-full" style={{ background: zoneColor(z) }} aria-hidden />
                {z}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {tasks.length ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={tab.key === 'open' ? 'Nothing open right now' : tab.key === 'in_progress' ? 'Nobody’s mid-task' : 'No finished tasks yet'}
          body={tab.key === 'open' ? 'Spotted something that needs doing? Post it so someone can pick it up.' : undefined}
          action={tab.key === 'open' ? <ButtonLink href="/tasks/new">Post a task</ButtonLink> : undefined}
        />
      )}
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={cx(
        'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-medium transition',
        active ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface text-ink-2 hover:border-ink',
      )}
    >
      {children}
    </Link>
  );
}
