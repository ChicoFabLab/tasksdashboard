'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, X } from 'lucide-react';
import type { Creation, Task } from '@/lib/types';
import type { LoggedRow, Win } from '@/lib/server/data';
import { capitalize, formatMinutes, zoneColor } from '@/lib/format';
import { QR } from '@/components/qr';
import { Logo } from '@/components/logo';
import { Avatar, AvatarStack, cx, names } from '@/components/ui';
import { TaskTileBody, tileClass } from '@/components/cards';

const REFRESH_MS = 30_000;
const IDLE_RESET_MS = 90_000;

function fmtHours(min: number) {
  const h = min / 60;
  return h < 1 ? `${Math.round(min)}m` : `${h < 10 ? Math.round(h * 10) / 10 : Math.round(h)}h`;
}

function ago(d: string) {
  const s = (Date.now() - new Date(d.replace(' ', 'T')).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 14) return `${Math.round(s / 86400)}d ago`;
  if (s < 86400 * 60) return `${Math.round(s / (86400 * 7))}w ago`;
  return new Date(d.replace(' ', 'T')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Wall touchscreen, 1920×1080. Space budget: header <8%, task grid ~72% (4×4 tiles),
 * right rail ~20%: phone QRs (join / share), creations, who finished what, tasks logged.
 * The only per-task QR is in the sheet that opens when a task is tapped.
 */
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
  boards: { month: LoggedRow[]; all: LoggedRow[] };
  stats: { open: number; inProgress: number; done: number; hours: number };
  urls: { base: string; join: string; share: string };
}) {
  const router = useRouter();
  const [view, setView] = useState<'open' | 'doing'>('open');
  const [zone, setZone] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedCreation, setSelectedCreation] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'all'>(boards.month.length >= 3 ? 'month' : 'all');
  const [now, setNow] = useState<Date | null>(null);
  const [more, setMore] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const logged = useRef<HTMLOListElement>(null);
  const lastTouch = useRef(Date.now());

  const pool = tasks.filter((t) => (view === 'open' ? t.status === 'open' : t.status !== 'open'));
  const zones = useMemo(() => [...new Set(pool.map((t) => t.zone))].sort(), [pool]);
  const shown = zone ? pool.filter((t) => t.zone === zone) : pool;
  const task = tasks.find((t) => t.id === selectedTask) ?? null;
  const creation = creations.find((c) => c.id === selectedCreation) ?? null;
  const board = boards[period];
  const openCount = tasks.filter((t) => t.status === 'open').length;
  const doingCount = tasks.length - openCount;

  const reset = useCallback(() => {
    setSelectedTask(null);
    setSelectedCreation(null);
    setZone(null);
    setView('open');
    grid.current?.scrollTo({ top: 0 });
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
    const key = (e: KeyboardEvent) => {
      touch();
      if (e.key === 'Escape') {
        setSelectedTask(null);
        setSelectedCreation(null);
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
      clearInterval(idle);
      window.removeEventListener('pointerdown', touch, { capture: true });
      window.removeEventListener('wheel', touch);
      window.removeEventListener('keydown', key);
    };
  }, [router, reset]);

  // Idle: gently scroll "Tasks logged" so everyone gets a moment on screen.
  useEffect(() => {
    const t = setInterval(() => {
      const el = logged.current;
      if (!el || Date.now() - lastTouch.current < 30_000 || selectedTask || selectedCreation) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) el.scrollTo({ top: 0, behavior: 'smooth' });
      else el.scrollBy({ top: 52, behavior: 'smooth' });
    }, 3_000);
    return () => clearInterval(t);
  }, [selectedTask, selectedCreation]);

  // "More below" hint + slow auto-paging when nobody is touching, so every task gets seen.
  useEffect(() => {
    const el = grid.current;
    if (!el) return;
    const check = () => setMore(el.scrollTop + el.clientHeight < el.scrollHeight - 12);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    const page = setInterval(() => {
      if (Date.now() - lastTouch.current < 30_000 || selectedTask || selectedCreation) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) el.scrollTo({ top: 0, behavior: 'smooth' });
      else el.scrollBy({ top: el.clientHeight * 0.9, behavior: 'smooth' });
    }, 12_000);
    return () => {
      el.removeEventListener('scroll', check);
      ro.disconnect();
      clearInterval(page);
    };
  }, [shown.length, selectedTask, selectedCreation]);

  return (
    <div data-theme="dark" className="flex h-dvh select-none flex-col overflow-hidden bg-paper text-ink" onContextMenu={(e) => e.preventDefault()}>
      {/* Header — kept short so tasks get the space */}
      <header className="shrink-0 bg-surface">
        <div className="flex h-[88px] items-center gap-6 px-6">
          <button onClick={reset} aria-label="Back to start" className="rounded-full">
            <Logo size="lg" href={null} />
          </button>
          <p className="ml-4 text-[26px] font-semibold text-ink">
            Volunteer jobs — <span className="text-accent">tap one</span>, scan, claim it on your phone
          </p>
          <time className="ml-auto text-right text-[34px] font-semibold tabular-nums text-ink-2" suppressHydrationWarning>
            {now?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/, '') ?? ''}
          </time>
        </div>
        <div className="stripes" aria-hidden />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_5px_420px] gap-5 p-5">
        {/* A) Tasks */}
        <section className="flex min-h-0 flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex shrink-0 rounded-xl bg-surface p-1">
              {(
                [
                  ['open', 'Open', openCount],
                  ['doing', 'In progress', doingCount],
                ] as const
              ).map(([k, label, n]) => (
                <button
                  key={k}
                  onClick={() => {
                    setView(k);
                    setZone(null);
                    grid.current?.scrollTo({ top: 0 });
                  }}
                  className={cx('h-14 rounded-lg px-5 text-[21px] font-semibold', view === k ? 'bg-accent text-accent-ink' : 'text-ink-2')}
                >
                  {label} <span className="tabular-nums opacity-80">{n}</span>
                </button>
              ))}
            </div>
            {zones.length > 1 && (
              <div className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,black_92%,transparent)] pr-10">
                {[null, ...zones].map((z) => (
                  <button
                    key={z ?? 'all'}
                    onClick={() => {
                      setZone(z);
                      grid.current?.scrollTo({ top: 0 });
                    }}
                    className={cx(
                      'inline-flex h-14 shrink-0 items-center gap-2 rounded-full border px-3 text-[18px] font-medium',
                      zone === z ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-ink-2',
                    )}
                  >
                    {z && <span className="size-3 rounded-full" style={{ background: zoneColor(z) }} />}
                    {z ?? 'All zones'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative min-h-0 flex-1">
            <div ref={grid} className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-2">
              {shown.length ? (
                <div className="grid grid-cols-4 gap-3">
                  {shown.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTask(t.id)}
                      className={cx(tileClass, 'min-h-[136px] !bg-surface')}
                    >
                      <TaskTileBody task={t} large />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="grid h-full place-items-center rounded-xl border border-dashed border-line-strong text-[24px] text-muted">
                  {view === 'open' ? 'No open tasks here right now.' : 'Nobody is mid-task right now.'}
                </p>
              )}
            </div>
            {more && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-paper to-transparent pb-2">
                <span className="rounded-full bg-surface-2 px-5 py-2 text-[19px] font-medium text-ink-2 shadow">Swipe up for more ↓</span>
              </div>
            )}
          </div>
        </section>

        <div className="stripes-v -my-5" aria-hidden />

        {/* Rail */}
        <aside className="flex min-h-0 flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <PhoneQR url={urls.share} title="Share a creation" body="Scan, snap, post" accent />
            <PhoneQR url={urls.join} title="Join / sign in" body="Free, takes 30 seconds" />
          </div>

          {creations.length > 0 && (
            <RailPanel title="Latest creations">
              <div className="grid grid-cols-2 gap-2.5 p-3 pt-0">
                {creations.slice(0, 2).map((c) => (
                  <button key={c.id} onClick={() => setSelectedCreation(c.id)} className="pressable overflow-hidden rounded-lg bg-surface-2 text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.thumbs[0] && <img src={c.thumbs[0]} alt="" className="aspect-[5/2] w-full object-cover" />}
                    <span className="cap block truncate px-2.5 py-1.5 text-[17px] font-medium">{c.title}</span>
                  </button>
                ))}
              </div>
            </RailPanel>
          )}

          <RailPanel title="Recently finished" className="shrink-0">
            <ul className="px-2">
              {wins.slice(0, 2).map((w) => (
                <li key={w.key} className="flex items-start gap-3 rounded-lg px-2 py-2">
                  <Avatar member={w.members[0]} size={40} />
                  <span className="min-w-0 text-[17px] leading-snug">
                    <strong>{names(w.members, 2)}</strong> <span className="text-muted">finished</span>{' '}
                    <span className="cap line-clamp-1 font-medium">{w.task?.title ?? 'a task'}</span>
                    <span className="text-[15px] text-muted">{ago(w.created)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </RailPanel>

          <RailPanel
            className="flex min-h-0 flex-1 flex-col"
            title="Tasks logged"
            action={
              <div className="flex rounded-lg bg-surface-2 p-0.5">
                {(
                  [
                    ['month', 'Month'],
                    ['all', 'All time'],
                  ] as const
                ).map(([k, l]) => (
                  <button key={k} onClick={() => {
                      setPeriod(k);
                      logged.current?.scrollTo({ top: 0 });
                    }} className={cx('h-14 rounded-md px-4 text-[18px] font-medium', period === k ? 'bg-surface text-ink shadow' : 'text-muted')}>
                    {l}
                  </button>
                ))}
              </div>
            }
          >
            {board.length ? (
              <ol ref={logged} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
                {board.map((r) => (
                  <li key={r.member.id} className="flex items-center gap-3 px-2 py-1.5">
                    <Avatar member={r.member} size={38} />
                    <span className="min-w-0 flex-1 truncate text-[19px] font-semibold">{r.member.name}</span>
                    <span className="text-right text-[18px] tabular-nums">
                      <span className="font-semibold">
                        {r.tasks} {r.tasks === 1 ? 'task' : 'tasks'}
                      </span>
                      <span className="text-muted"> · {fmtHours(r.minutes)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-4 pb-3 text-[17px] text-muted">No finished tasks yet this month.</p>
            )}
          </RailPanel>
        </aside>
      </div>

      <div className="stripes shrink-0" aria-hidden />

      {/* Task sheet — the only place a task QR appears */}
      {task && (
        <Modal onClose={() => setSelectedTask(null)} label={task.title}>
          <div className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {task.image && <img src={task.image} alt="" className="mb-6 max-h-[320px] w-full rounded-xl object-cover" />}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[20px] text-ink-2">
              <span className="inline-flex items-center gap-2">
                <span className="size-3.5 rounded-full" style={{ background: zoneColor(task.zone) }} />
                {task.zone}
              </span>
              {task.estimatedMinutes > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-6" /> About {formatMinutes(task.estimatedMinutes)}
                </span>
              )}
              <span className="text-muted">#{task.number}</span>
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
          <ScanBox url={`${urls.base}/tasks/${task.id}`} title="Scan to claim" body="Point your phone camera at the code. You can sign up right there." />
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
          <ScanBox url={`${urls.base}/creations/${creation.id}`} title="See it on your phone" body="All photos and the story behind it." />
        </Modal>
      )}
    </div>
  );
}

function PhoneQR({ url, title, body, accent }: { url: string; title: string; body: string; accent?: boolean }) {
  return (
    <div className={cx('flex flex-col items-center gap-2 rounded-2xl border p-3 text-center', accent ? 'border-sun bg-sun text-sun-ink' : 'border-line bg-surface')}>
      <QR value={url} size={132} label={`${title}: scan with your phone`} />
      <p className="text-[19px] font-semibold leading-tight">{title}</p>
      <p className={cx('-mt-1 text-[15px]', accent ? 'opacity-80' : 'text-muted')}>{body}</p>
    </div>
  );
}

function RailPanel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx('overflow-hidden rounded-2xl border border-line bg-surface', className)}>
      <div className="flex min-h-[56px] items-center justify-between px-4">
        <h2 className="text-[20px] font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const MODAL_SECONDS = 60;

function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  const [left, setLeft] = useState(MODAL_SECONDS);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    const reset = () => setLeft(MODAL_SECONDS);
    window.addEventListener('pointerdown', reset);
    return () => {
      clearInterval(t);
      window.removeEventListener('pointerdown', reset);
    };
  }, []);
  useEffect(() => {
    if (left <= 0) onClose();
  }, [left, onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-10" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="rise relative grid max-h-full w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] gap-10 overflow-y-auto rounded-2xl border border-line bg-surface p-10 pt-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-6 top-5 flex items-center gap-4">
          <span className="text-[18px] text-muted tabular-nums">Closes in {left}s</span>
          <button onClick={onClose} className="pressable inline-flex h-14 items-center gap-2 rounded-xl bg-surface-2 px-5 text-[20px] font-semibold">
            <X className="size-6" /> Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ScanBox({ url, title, body }: { url: string; title: string; body: string }) {
  return (
    <div className="flex w-[360px] flex-col items-center gap-4 self-start rounded-xl bg-surface-2 p-6 text-center">
      <p className="text-[32px] font-bold text-accent">{title}</p>
      <QR value={url} size={290} label={title} />
      <p className="text-[19px] text-muted">{body}</p>
    </div>
  );
}
