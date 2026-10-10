import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Pencil, PartyPopper, Smartphone } from 'lucide-react';
import { completionsForTask, getTask, listMembersForPicker } from '@/lib/server/data';
import { getCurrentUser } from '@/lib/server/session';
import { absoluteUrl } from '@/lib/site-config';
import { capitalize, formatMinutes, shortDate, taskNo, timeAgo } from '@/lib/format';
import { Avatar, ButtonLink, Card, Notice, StatusPill, ZoneTag, names } from '@/components/ui';
import { CollapsibleText } from '@/components/collapsible';
import { ClaimButtons, EditTimeButton, EstimateEditor, FinishForm } from '@/components/task-actions';
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
  searchParams: Promise<{ done?: string; created?: string; finish?: string; claim?: string; logged?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [task, user] = await Promise.all([getTask(id), getCurrentUser()]);
  if (!task) notFound();

  const done = task.status === 'completed';
  const mine = Boolean(user && task.assignees.some((a) => a.id === user.id));
  const canEdit = Boolean(user && (user.isAdmin || task.createdBy === user.id));
  const [history, members] = await Promise.all([
    completionsForTask(task.id),
    user && !done ? listMembersForPicker() : Promise.resolve([]),
  ]);
  const url = absoluteUrl(`/tasks/${task.id}`);
  const next = encodeURIComponent(`/tasks/${task.id}?claim=1`);
  const autoClaim = Boolean(sp.claim && user && !mine && !done);

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
      {sp.logged && (
        <div className="mb-6">
          <Notice tone="good">Your time is saved. The task is back on the board for the next person — your note tells them where you left off.</Notice>
        </div>
      )}
      {sp.created && (
        <div className="mb-6">
          <Notice tone="good">Task posted. It’s on the board and the big screen now.</Notice>
        </div>
      )}

      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[1fr_360px]">
        <header className="lg:col-start-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-muted">
            <StatusPill status={task.status} />
            <span className="tabular-nums">Task #{task.number}</span>
            <ZoneTag zone={task.zone} />
            <EstimateEditor
              taskId={task.id}
              minutes={task.estimatedMinutes}
              canEdit={!done && Boolean(user && (user.isAdmin || task.createdBy === user.id || mine))}
            />
            {timeAgo(task.created) && <span>Posted {timeAgo(task.created)}</span>}
            {canEdit && (
              <Link href={`/tasks/${task.id}/edit`} className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
                <Pencil className="size-4" aria-hidden /> Edit
              </Link>
            )}
          </div>
          <h1 className="cap display mt-3 text-3xl font-bold leading-tight text-balance sm:text-4xl">{task.title}</h1>
          <div className="mt-4">
            {task.description ? (
              <CollapsibleText text={capitalize(task.description)} className="whitespace-pre-line text-lg leading-relaxed text-ink-2" />
            ) : (
              <p className="text-muted">No extra details — the title says it all.</p>
            )}
          </div>
          {task.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={task.image} alt="" className="mt-5 max-h-[180px] w-full rounded-2xl border border-line object-cover sm:max-h-[440px]" />
          )}
        </header>

        {/* Action panel */}
        <aside className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
          {!done && !user && (
            <Card className="hidden space-y-3 p-5 md:block">
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
                <div id="finish">
                  <FinishForm taskId={task.id} estimate={task.estimatedMinutes} members={members} me={user.id} defaultOpen={Boolean(sp.finish)} />
                </div>
              ) : (
                <div className="hidden md:block">
                  <ClaimButtons taskId={task.id} mine={mine} status={task.status} />
                </div>
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
              <p className="text-lg font-semibold">This one’s done</p>
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

        {/* Phones: the main action is always on screen, above the tab bar. */}
        {!done && !sp.finish && (
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 p-3 backdrop-blur md:hidden">
            {!user ? (
              <div className="flex gap-2">
                <ButtonLink href={`/signup?next=${next}`} size="lg" className="flex-1">
                  Sign up &amp; claim
                </ButtonLink>
                <ButtonLink href={`/login?next=${next}`} size="lg" variant="secondary">
                  Sign in
                </ButtonLink>
              </div>
            ) : mine ? (
              <ButtonLink href={`/tasks/${task.id}?finish=1#finish`} size="lg" variant="dark" block>
                I finished it
              </ButtonLink>
            ) : (
              <ClaimButtons taskId={task.id} mine={false} status={task.status} autoClaim={autoClaim} />
            )}
          </div>
        )}
        {!done && !sp.finish && <div className="h-20 md:hidden" aria-hidden />}
        <article className="lg:col-start-1">
          {!done && task.assignees.length > 0 && (
            <div className={`flex items-center gap-3 rounded-2xl border p-4 ${mine ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}>
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

          {history.length > 0 ? (
            <section className="mt-10">
              <h2 className="mb-1 text-lg font-semibold">Time logged</h2>
              <p className="mb-4 text-sm text-muted">
                {formatMinutes(history.reduce((n, c) => n + c.minutes, 0))} in total from {new Set(history.map((c) => c.member.id)).size}{' '}
                {new Set(history.map((c) => c.member.id)).size === 1 ? 'person' : 'people'}
              </p>
              <ul className="space-y-3">
                {history.map((c) => (
                  <li key={c.id}>
                    <Card className="overflow-hidden">
                      {c.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.photo} alt="" className="max-h-[420px] w-full object-cover" />
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4">
                        <Link href={`/makers/${c.member.id}`} className="inline-flex items-center gap-2 rounded-full pr-2 hover:bg-surface-2">
                          <Avatar member={c.member} size={36} />
                          <span className="font-semibold">{c.member.name}</span>
                        </Link>
                        <span className={c.partial ? 'rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn' : 'rounded-full bg-good-soft px-2.5 py-0.5 text-xs font-semibold text-good'}>
                          {c.partial ? 'Worked on it' : 'Finished'}
                        </span>
                        <span className="ml-auto text-sm text-muted">
                          {shortDate(c.created)} · <strong className="text-ink">{formatMinutes(c.minutes)}</strong>
                        </span>
                        {c.note && <p className="w-full text-ink-2">“{c.note}”</p>}
                        {user && (user.isAdmin || user.id === c.member.id) && <EditTimeButton id={c.id} minutes={c.minutes} note={c.note} />}
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            done && <p className="mt-10 text-muted">Marked done {timeAgo(task.updated)}.</p>
          )}
        </article>
      </div>
    </div>
  );
}
