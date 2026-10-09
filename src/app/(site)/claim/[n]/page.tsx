import Link from 'next/link';
import { redirect } from 'next/navigation';
import { findTasksByNumber } from '@/lib/server/data';
import { TaskCard } from '@/components/cards';
import { ButtonLink, EmptyState, PageHeader } from '@/components/ui';
import { taskNo } from '@/lib/format';

export const dynamic = 'force-dynamic';

/** Old QR codes encode /claim/<task number>. Numbers aren't unique historically, so disambiguate. */
export default async function ClaimByNumber({ params }: { params: Promise<{ n: string }> }) {
  const raw = (await params).n;
  const n = Number(raw);
  // Some links carried a record id instead of a number.
  if (/^[a-z0-9]{15}$/.test(raw)) redirect(`/tasks/${raw}`);
  const tasks = await findTasksByNumber(n);
  const live = tasks.filter((t) => t.status !== 'completed');
  if (live.length === 1 || tasks.length === 1) redirect(`/tasks/${(live[0] ?? tasks[0]).id}`);
  if (!tasks.length) {
    return <EmptyState title={`Task ${Number.isFinite(n) ? taskNo(n) : ''} not found`} body="It may have been removed." action={<ButtonLink href="/tasks">See open tasks</ButtonLink>} />;
  }
  return (
    <>
      <PageHeader title={`Which ${taskNo(n)}?`} subtitle="A few tasks share this number. Pick yours." />
      <div className="grid gap-3 sm:grid-cols-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>
      <Link href="/tasks" className="mt-6 inline-block font-semibold underline underline-offset-4">
        All tasks
      </Link>
    </>
  );
}
