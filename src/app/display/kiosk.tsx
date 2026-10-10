'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, X } from 'lucide-react';
import type { Creation, Member, Task } from '@/lib/types';
import type { LeaderRow, Win } from '@/lib/server/data';
import { capitalize, formatMinutes, zoneColor } from '@/lib/format';
import { QR } from '@/components/qr';
import { Logo } from '@/components/logo';
import { Avatar, AvatarStack, cx, names } from '@/components/ui';
import { DoneCardBody, TaskCardBody, cardClass } from '@/components/cards';

const REFRESH_MS = 30_000;
const IDLE_RESET_MS = 90_000;


function ago(d: string) {
  const s = (Date.now() - new Date(d.replace(' ', 'T')).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 14) return `${Math.round(s / 86400)}d ago`;
  if (s < 86400 * 60) return `${Math.round(s / (86400 * 7))}w ago`;
  return new Date(d.replace(' ', 'T')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function hours(min: number) {
  const h = min / 60;
  return h < 1 ? `${Math.round(min)}m` : `${h < 10 ? Math.round(h * 10) / 10 : Math.round(h)}h`;
}

export function Kiosk({
  tasks,
  wins,
  creations,
  boards,
  stats,
  urls,
}: {
  tasks: Task[];
  wins: Win[];
  creations: Creation[];
  boards: { month: LeaderRow[]; all: LeaderRow[] };
  stats: { open: number; inProgress: number; done: number; hours: number };
  urls: { base: string; join: string };
}) {
  const router = useRouter();
  const [zone, setZone] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedCreation, setSelectedCreation] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'all'>(boards.month.length >= 3 ? 'month' : 'all');
  const [now, setNow] = useState<Date | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const lastTouch = useRef(Date.now());

  const zones = useMemo(() => [...new Set(tasks.map((t) => t.zone))].sort(), [tasks]);
  const todo = tasks.filter((t) => t.status === 'open' && (!zone || t.zone === zone));
  const doing = tasks.filter((t) => t.status !== 'open' && (!zone || t.zone === zone));
  const done = wins.filter((w) => !zone || w.task?.zone === zone);
  const task = tasks.find((t) => t.id === selectedTask) ?? null;
  const creation = creations.find((c) => c.id === selectedCreation) ?? null;

  const reset = useCallback(() => {
    setSelectedTask(null);
    setSelectedCreation(null);
    setZone(null);
    grid.current?.querySelectorAll('[data-col]').forEach((el) => el.scrollTo({ top: 0 }));
  }, []);

  useEffect(() => {
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 15_000);
    const refresh = setInterval(() => router.refresh(), REFRESH_MS);
    const idle = setInterval(() => {
      if (Date.now() - lastTouch.current > IDLE_RESET_MS) reset();
    }, 5_000);
    const touch = () => (lastTouch.current = Date.now());
    window.addEventListener('pointerdown', touch, { capture: true });
    window.addEventListener('wheel', touch, { passive: true });
    const esc = (e: KeyboardEvent) => {
      touch();
      if (e.key === 'Escape') {
        setSelectedTask(null);
        setSelectedCreation(null);
      }
    };
    window.addEventListener('keydown', esc);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
      clearInterval(idle);
      window.removeEventListener('pointerdown', touch, { capture: true });
      window.removeEventListener('wheel', touch);
      window.removeEventListener('keydown', esc);
    };
  }, [router, reset]);

  const board = boards[period];

  return (
    <div data-theme="dark" className="flex h-dvh select-none flex-col overflow-hidden bg-paper text-ink" onContextMenu={(e) => e.preventDefault()}>
      {/* Header */}
      <header className="flex items-center gap-6 border-b border-line bg-surface px-8 py-4">
        <button onClick={reset} aria-label="Back to start" className="rounded-lg">
          <Logo size="lg" href={null} />
        </button>
        <dl className="ml-auto flex items-stretch gap-3">
          {[
            ['Open tasks', stats.open],
            ['In progress', stats.inProgress],
            ['Tasks done', stats.done],
            ['Hours logged', stats.hours],
          ].map(([l, v]) => (
            <div key={l} className="min-w-[150px] rounded-xl border border-line bg-surface-2 px-5 py-2.5">
              <dt className="text-[17px] text-muted">{l}</dt>
              <dd className="text-[34px] font-semibold leading-tight tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <time className="w-32 text-right text-[40px] font-semibold tabular-nums text-ink-2" suppressHydrationWarning>
          {now?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/, '') ?? ''}
        </time>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        {/* Board */}
        <section className="flex min-h-0 flex-col gap-4">
          {zones.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {[null, ...zones].map((z) => (
                <button
                  key={z ?? 'all'}
                  onClick={() => setZone(z)}
                  className={cx(
                    'inline-flex h-12 items-center gap-2 rounded-full border px-4 text-[18px] font-medium',
                    zone === z ? 'border-accent bg-accent-soft text-ink' : 'border-line-strong bg-surface text-ink-2',
                  )}
                >
                  {z && <span className="size-3 rounded-full" style={{ background: zoneColor(z) }} />}
                  {z ?? 'All zones'}
                </button>
              ))}
            </div>
          )}
          <div ref={grid} className="grid min-h-0 flex-1 grid-cols-3 gap-4">
            <KColumn title="To do" count={todo.length} dot="#94a3b8">
              {todo.length ? (
                todo.map((t) => (
                  <button key={t.id} onClick={() => setSelectedTask(t.id)} className={cx(cardClass, "!bg-surface-2 !border-line-strong")}>
                    <TaskCardBody task={t} large />
                  </button>
                ))
              ) : (
                <KEmpty text="Nothing to do right now." />
              )}
            </KColumn>
            <KColumn title="In progress" count={doing.length} dot="#f59e0b">
              {doing.length ? (
                doing.map((t) => (
                  <button key={t.id} onClick={() => setSelectedTask(t.id)} className={cx(cardClass, "!bg-surface-2 !border-line-strong")}>
                    <TaskCardBody task={t} large />
                  </button>
                ))
              ) : (
                <KEmpty text="Nobody is mid-task." />
              )}
            </KColumn>
            <KColumn title="Done" count={done.length} dot="#22c55e">
              {done.length ? (
                done.map((w) => (
                  <div key={w.key} className={cx(cardClass, "!bg-surface-2 !border-line-strong")}>
                    <DoneCardBody win={w} large />
                  </div>
                ))
              ) : (
                <KEmpty text="Finished tasks show up here." />
              )}
            </KColumn>
          </div>
        </section>

        {/* Side panels */}
        <aside className="hidden min-h-0 flex-col gap-6 xl:flex">
          <KPanel
            title="Leaderboard"
            action={
              <div className="flex rounded-lg bg-surface-2 p-0.5">
                {(
                  [
                    ['month', 'This month'],
                    ['all', 'All time'],
                  ] as const
                ).map(([k, l]) => (
                  <button key={k} onClick={() => setPeriod(k)} className={cx('h-11 rounded-md px-4 text-[17px] font-medium', period === k ? 'bg-surface text-ink shadow' : 'text-muted')}>
                    {l}
                  </button>
                ))}
              </div>
            }
          >
            {board.length ? (
              <ol>
                {board.map((r, i) => (
                  <li key={r.member.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={cx('w-6 text-center text-[20px] font-semibold tabular-nums', i < 3 ? 'text-accent' : 'text-muted')}>{i + 1}</span>
                    <Avatar member={r.member} size={40} />
                    <span className="min-w-0 flex-1 truncate text-[19px] font-semibold">{r.member.name}</span>
                    <span className="text-[17px] text-muted tabular-nums">{r.tasks} tasks</span>
                    <span className="w-16 text-right text-[19px] font-semibold tabular-nums">{hours(r.minutes)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-4 text-[18px] text-muted">No finished tasks this month yet.</p>
            )}
          </KPanel>

          {creations.length > 0 && (
            <KPanel title="Latest creations">
              <div className="grid grid-cols-3 gap-2 p-3">
                {creations.slice(0, 3).map((c) => (
                  <button key={c.id} onClick={() => setSelectedCreation(c.id)} className="pressable overflow-hidden rounded-lg bg-surface-2 text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.thumbs[0] && <img src={c.thumbs[0]} alt="" className="aspect-square w-full object-cover" />}
                    <span className="cap block truncate px-2 py-1.5 text-[15px] font-medium">{c.title}</span>
                  </button>
                ))}
              </div>
            </KPanel>
          )}

          <div className="mt-auto flex items-center gap-5 rounded-2xl border border-line bg-surface p-5">
            <QR value={urls.join} size={128} label="Scan to sign in or create an account" />
            <div>
              <p className="text-[22px] font-semibold">Sign in or join</p>
              <p className="mt-1 text-[17px] leading-snug text-muted">Scan with your phone to create an account, then tap any task here to claim it.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Task detail — the only place a task QR appears */}
      {task && (
        <Modal onClose={() => setSelectedTask(null)} label={task.title}>
          <div className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {task.image && <img src={task.image} alt="" className="mb-6 max-h-[300px] w-full rounded-xl object-cover" />}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[20px] text-ink-2">
              <span className="inline-flex items-center gap-2">
                <span className="size-3.5 rounded-full" style={{ background: zoneColor(task.zone) }} />
                {task.zone}
              </span>
              {task.estimatedMinutes > 0 && (
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Clock className="size-5" /> About {formatMinutes(task.estimatedMinutes)}
                </span>
              )}
              <span className="text-muted">Task #{task.number}</span>
            </div>
            <h2 className="cap mt-3 text-[40px] font-bold leading-tight tracking-tight">{task.title}</h2>
            {task.description && <p className="mt-4 line-clamp-6 whitespace-pre-line text-[21px] leading-relaxed text-ink-2">{capitalize(task.description)}</p>}
            {task.assignees.length > 0 && (
              <p className="mt-6 flex items-center gap-3 text-[20px]">
                <AvatarStack members={task.assignees} size={44} />
                <span>
                  <strong>{names(task.assignees)}</strong> {task.assignees.length > 1 ? 'are' : 'is'} on it — you can join in.
                </span>
              </p>
            )}
          </div>
          <ScanBox url={`${urls.base}/tasks/${task.id}`} title="Scan to claim" body="Open your phone camera and point it at the code." />
        </Modal>
      )}

      {creation && (
        <Modal onClose={() => setSelectedCreation(null)} label={creation.title}>
          <div className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {creation.thumbs[0] && <img src={creation.photos[0] ?? creation.thumbs[0]} alt="" className="max-h-[520px] w-full rounded-xl object-contain" />}
            <h2 className="cap mt-4 text-[34px] font-bold">{creation.title}</h2>
            <p className="mt-2 flex items-center gap-3 text-[20px] text-ink-2">
              <Avatar member={creation.member} size={36} /> {creation.member.name} · {ago(creation.created)}
            </p>
          </div>
          <ScanBox url={`${urls.base}/creations/${creation.id}`} title="See it on your phone" body="Scan to view all photos and the story." />
        </Modal>
      )}
    </div>
  );
}

function KColumn({ title, count, dot, children }: { title: string; count: number; dot: string; children: React.ReactNode }) {
  return (
    <section className="flex min-h-0 flex-col rounded-2xl bg-surface p-3">
      <h2 className="flex items-center gap-2.5 px-2 pb-3 pt-1 text-[22px] font-semibold">
        <span className="size-3.5 rounded-full" style={{ background: dot }} />
        {title}
        <span className="rounded-full bg-surface-2 px-2.5 text-[17px] font-medium tabular-nums text-muted">{count}</span>
      </h2>
      <div data-col className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain [&>*]:shrink-0">
        {children}
      </div>
    </section>
  );
}

function KEmpty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-line-strong px-4 py-10 text-center text-[18px] text-muted">{text}</p>;
}

function KPanel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface">
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        <h2 className="text-[22px] font-semibold">{title}</h2>
        {action}
      </div>
      <div className="py-1">{children}</div>
    </section>
  );
}

function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-10" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="rise grid max-h-full w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] gap-10 overflow-y-auto rounded-2xl border border-line bg-surface p-10"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button onClick={onClose} className="pressable col-span-full flex h-16 items-center justify-center gap-2 rounded-xl bg-surface-2 text-[22px] font-semibold">
          <X className="size-7" /> Close
        </button>
      </div>
    </div>
  );
}

function ScanBox({ url, title, body }: { url: string; title: string; body: string }) {
  return (
    <div className="flex w-[340px] flex-col items-center gap-4 rounded-xl bg-surface-2 p-6 text-center">
      <QR value={url} size={280} label={title} />
      <p className="text-[26px] font-semibold">{title}</p>
      <p className="text-[18px] text-muted">{body}</p>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid h-full min-h-72 place-items-center rounded-xl border border-dashed border-line-strong text-center">
      <div>
        <p className="text-[30px] font-semibold">{title}</p>
        <p className="mt-2 text-[20px] text-muted">{body}</p>
      </div>
    </div>
  );
}

export type { Member };
