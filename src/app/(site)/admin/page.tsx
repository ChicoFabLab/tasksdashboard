import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { adminPb } from '@/lib/server/pb';
import { listTasks, recentCompletions } from '@/lib/server/data';
import { toMember } from '@/lib/types';
import { formatMinutes, shortDate, taskNo } from '@/lib/format';
import { Avatar, PageHeader, StatusPill, cx } from '@/components/ui';
import { AdminToggle, DeleteCompletionButton, ReopenButton, TempPasswordButton } from '@/components/admin-controls';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin' };

const TABS = ['tasks', 'activity', 'members'] as const;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');
  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <PageHeader title="Admins only" subtitle="Zone Leaders get admin automatically when they sign in with Discord. Otherwise, ask an existing admin." />
      </div>
    );
  }
  const requested = (await searchParams).tab;
  const tab = TABS.find((t) => t === requested) ?? 'tasks';

  return (
    <>
      <PageHeader title="Admin" subtitle="Keep the board tidy. Members can create tasks and edit their own; you can edit anything." />
      <div className="mb-6 inline-flex rounded-xl border border-line bg-surface p-1">
        {TABS.map((t) => (
          <Link key={t} href={`/admin?tab=${t}`} className={cx('inline-flex h-11 items-center rounded-lg px-4 text-[15px] font-semibold capitalize', t === tab ? 'bg-ink text-paper' : 'text-muted hover:text-ink')}>
            {t}
          </Link>
        ))}
      </div>
      {tab === 'tasks' && <TasksTab />}
      {tab === 'activity' && <ActivityTab />}
      {tab === 'members' && <MembersTab me={user.id} />}
    </>
  );
}

const table = 'w-full text-left text-[15px] [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_th]:text-muted [&_tr]:border-b [&_tr]:border-line';

async function TasksTab() {
  const tasks = await listTasks({ limit: 500, includeArchived: true });
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className={table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Task</th>
            <th>Status</th>
            <th>Zone</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td className="font-mono text-muted">{taskNo(t.number)}</td>
              <td className="min-w-64">
                <Link href={`/tasks/${t.id}`} className="font-medium hover:underline">
                  {t.title}
                </Link>
              </td>
              <td>
                <StatusPill status={t.status} />
              </td>
              <td className="whitespace-nowrap text-muted">{t.zone}</td>
              <td className="whitespace-nowrap text-right">
                <Link href={`/tasks/${t.id}/edit`} className="mr-2 inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold hover:bg-surface-2">
                  Edit
                </Link>
                {t.status !== 'open' && <ReopenButton id={t.id} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function ActivityTab() {
  const items = await recentCompletions(100);
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className={table}>
        <thead>
          <tr>
            <th>When</th>
            <th>Who</th>
            <th>Task</th>
            <th>Time</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td className="whitespace-nowrap text-muted">{shortDate(c.created)}</td>
              <td className="whitespace-nowrap font-medium">{c.member.name}</td>
              <td className="min-w-56">{c.task ? `${taskNo(c.task.number)} ${c.task.title}` : '—'}</td>
              <td className="whitespace-nowrap">{formatMinutes(c.minutes)}</td>
              <td className="text-right">
                <DeleteCompletionButton id={c.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function MembersTab({ me }: { me: string }) {
  const pb = await adminPb();
  const recs = await pb.collection('volunteers').getFullList({ sort: 'username', fields: 'id,username,discord_username,profile_photo,is_admin,pw_hash,discord_id,total_minutes,created' });
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className={table}>
        <thead>
          <tr>
            <th>Member</th>
            <th>Sign-in</th>
            <th>Logged</th>
            <th>Joined</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((r) => {
            const m = toMember(r);
            return (
              <tr key={r.id}>
                <td>
                  <Link href={`/makers/${r.id}`} className="flex items-center gap-3 font-medium hover:underline">
                    <Avatar member={m} size={32} /> {m.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap text-muted">{[r.pw_hash && 'Password', r.discord_id && 'Discord'].filter(Boolean).join(' + ') || '—'}</td>
                <td className="whitespace-nowrap">{formatMinutes(Number(r.total_minutes) || 0)}</td>
                <td className="whitespace-nowrap text-muted">{shortDate(r.created)}</td>
                <td className="whitespace-nowrap text-right">
                  {r.id === me ? (
                    <span className="text-sm text-muted">You</span>
                  ) : (
                    <>
                      <TempPasswordButton id={r.id} name={m.name} />
                      <AdminToggle id={r.id} isAdmin={r.is_admin === true} />
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
