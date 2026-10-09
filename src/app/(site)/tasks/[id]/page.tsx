import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil, PartyPopper, Smartphone } from 'lucide-react';
import { completionsForTask, getTask, groupWins, listMembersForPicker } from '@/lib/server/data';
import { getCurrentUser } from '@/lib/server/session';
import { absoluteUrl } from '@/lib/site-config';
import { capitalize, formatMinutes, shortDate, taskNo, timeAgo, zoneColor } from '@/lib/format';
import { Avatar, ButtonLink, Card, Notice, StatusPill, names } from '@/components/ui';
import { DoneStamp, SpecPlate } from '@/components/cards';
import { CollapsibleText } from '@/components/collapsible';
import { ClaimButtons, FinishForm } from '@/components/task-actions';
import { QR } from '@/components/qr';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const task = await getTask((await params).id);
  return { title: task ? `${taskNo(task.number)} ${task.title}` : 'Task' };
}

export default async function TaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string; created?: string; finish?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [task, user] = await Promise.all([getTask(id), getCurrentUser()]);
  if (!task) notFound();

  const done = task.status === 'completed';
  const mine = Boolean(user && task.assignees.some((a) => a.id === user.id));
  const canEdit = Boolean(user && (user.isAdmin || task.createdBy === user.id));
  const [history, members] = await Promise.all([
    done ? completionsForTask(task.id) : Promise.resolve([]),
    user && !done ? listMembersForPicker() : Promise.resolve([]),
  ]);
  const wins = groupWins(history);
  const url = absoluteUrl(`/tasks/${task.id}`);
  const next = encodeURIComponent(`/tasks/${task.id}`);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/tasks" className="mb-5 inline-flex h-11 items-center gap-2 rounded-xl pr-3 text-[15px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-5" aria-hidden /> All tasks
      </Link>

      {sp.done && done && (
        <div className="rise mb-6 flex items-start gap-4 rounded-2xl bg-good-soft p-5 text-good">
          <PartyPopper className="size-8 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="text-lg font-semibold">Logged — thank you!</p>
            <p className="text-[15px]">Your time is on the board. Made something cool while you were at it?</p>
          </div>
          <ButtonLink href="/creations/new" size="sm" variant="secondary" className="shrink-0">
            Share it
          </ButtonLink>
        </div>
      )}
      {sp.created && (
        <div className="mb-6">
          <Notice tone="good">Task posted. It’s on the board and the big screen now.</Notice>
        </div>
      )}

      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[1fr_360px]">
        <header className="lg:col-start-1">
          <div className="h-2.5 w-24 rounded-[2px]" style={{ background: zoneColor(task.zone) }} aria-hidden />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SpecPlate zone={task.zone} number={task.number} className="text-[13px]" />
            {task.status === 'completed' ? <DoneStamp /> : <StatusPill status={task.status} />}
            {canEdit && (
              <Link href={`/tasks/${task.id}/edit`} className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink">
                <Pencil className="size-4" aria-hidden /> Edit
              </Link>
            )}
          </div>
          <h1 className="cap display mt-3 text-[40px] font-extrabold leading-[0.95] text-balance sm:text-[64px]">{task.title}</h1>
          <p className="mt-3 text-[15px] text-muted">
            {task.zone}
            {task.estimatedMinutes > 0 && <> · <span className="dim font-mono text-[13px] font-semibold uppercase text-ink-2">{formatMinutes(task.estimatedMinutes)}</span></>} · posted {timeAgo(task.created)}
          </p>
        </header>

        {/* Action panel */}
        <aside className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
          {!done && !user && (
            <Card className="space-y-3 p-5">
              <p className="text-lg font-semibold">Want to take this on?</p>
              <p className="text-[15px] text-muted">Sign in or make a quick account — no Discord needed — and you’ll come right back here.</p>
              <ButtonLink href={`/signup?next=${next}`} size="lg" block>
                Create account
              </ButtonLink>
              <ButtonLink href={`/login?next=${next}`} size="lg" variant="secondary" block>
                I have an account
              </ButtonLink>
            </Card>
          )}

          {!done && user && (
            <div className="space-y-3">
              {(mine || sp.finish) ? (
                <FinishForm taskId={task.id} estimate={task.estimatedMinutes} members={members} me={user.id} defaultOpen={Boolean(sp.finish)} />
              ) : (
                <ClaimButtons taskId={task.id} mine={mine} status={task.status} />
              )}
              {mine ? (
                <ClaimButtons taskId={task.id} mine status={task.status} />
              ) : (
                !sp.finish && (
                  <ButtonLink href={`/tasks/${task.id}?finish=1`} variant="ghost" block scroll={false}>
                    Already did it? Log it now
                  </ButtonLink>
                )
              )}
            </div>
          )}

          {done && (
            <Card className="p-5">
              <p className="display text-2xl font-extrabold uppercase">This one’s done</p>
              <p className="mt-1 text-[15px] text-muted">There’s always more on the board.</p>
              <ButtonLink href="/tasks" variant="secondary" block className="mt-4">
                Find another task
              </ButtonLink>
            </Card>
          )}

          <Card className="hidden items-center gap-4 p-5 md:flex lg:flex-col lg:items-start">
            <QR value={url} size={120} label="QR code linking to this task" />
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <Smartphone className="size-4" aria-hidden /> Continue on your phone
              </p>
              <p className="mt-1 text-sm text-muted">Point your camera at the code to open this task.</p>
            </div>
          </Card>
        </aside>
        <article className="lg:col-start-1">
          {task.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={task.image} alt="" className="mb-6 max-h-[480px] w-full rounded-2xl border-[1.5px] border-line object-cover" />
          )}

          {task.description ? (
            <CollapsibleText text={capitalize(task.description)} className="whitespace-pre-line text-lg leading-relaxed text-ink-2" />
          ) : (
            <p className="text-muted">No extra details — the title says it all.</p>
          )}

          {!done && task.assignees.length > 0 && (
            <div className={`mt-8 flex items-center gap-3 rounded-2xl border p-4 ${mine ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}>
              <div className="flex -space-x-2">
                {task.assignees.map((a) => (
                  <Avatar key={a.id} member={a} size={40} ring />
                ))}
              </div>
              <p className="text-[15px]">
                <span className="font-semibold">{mine ? (task.assignees.length > 1 ? `You and ${names(task.assignees.filter((a) => a.id !== user?.id))}` : 'You') : names(task.assignees)}</span>{' '}
                {task.assignees.length > 1 || mine ? 'are' : 'is'} on it.
                {mine && <span className="block text-muted">Tap “I finished it” when you’re done.</span>}
              </p>
            </div>
          )}

          {done && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Finished</h2>
              {wins.length === 0 && <p className="text-muted">Marked done {timeAgo(task.updated)}.</p>}
              <div className="space-y-4">
                {wins.map((w) => (
                  <Card key={w.key} className="overflow-hidden">
                    {w.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.photo} alt="" className="max-h-[420px] w-full object-cover" />
                    )}
                    <div className="flex flex-wrap items-center gap-3 p-4">
                      {w.members.map((m) => (
                        <Link key={m.id} href={`/makers/${m.id}`} className="inline-flex items-center gap-2 rounded-full pr-2 hover:bg-surface-2">
                          <Avatar member={m} size={36} />
                          <span className="font-semibold">{m.name}</span>
                        </Link>
                      ))}
                      <span className="ml-auto text-sm text-muted">
                        {shortDate(w.created)} · {formatMinutes(w.minutes)}
                      </span>
                      {w.note && <p className="w-full text-ink-2">“{w.note}”</p>}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </div>
  );
}
