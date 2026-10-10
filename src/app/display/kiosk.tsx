'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Sparkles, Star, X } from 'lucide-react';
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
  const [gallery, setGallery] = useState(false);
  const [period, setPeriod] = useState<'month' | 'all'>(boards.month.length >= 3 ? 'month' : 'all');
  const [now, setNow] = useState<Date | null>(null);
  const [more, setMore] = useState(false);
  const [fits, setFits] = useState(0); // "I have N minutes" filter; 0 = any
  const grid = useRef<HTMLDivElement>(null);
  const logged = useRef<HTMLOListElement>(null);
  const lastTouch = useRef(Date.now());

  const pool = tasks.filter((t) => (view === 'open' ? t.status === 'open' : t.status !== 'open'));
  const zones = useMemo(() => [...new Set(pool.map((t) => t.zone))].sort(), [pool]);
  const shown = pool.filter((t) => (!zone || t.zone === zone) && (!fits || (t.estimatedMinutes > 0 && t.estimatedMinutes <= fits)));
  const task = tasks.find((t) => t.id === selectedTask) ?? null;
  const creation = creations.find((c) => c.id === selectedCreation) ?? null;
  const board = boards[period];
  const openCount = tasks.filter((t) => t.status === 'open').length;
  const doingCount = tasks.length - openCount;

  const reset = useCallback(() => {
    setSelectedTask(null);
    setSelectedCreation(null);
    setGallery(false);
    setZone(null);
    setFits(0);
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
          <button
            onClick={() => setGallery(true)}
            className="pressable ml-auto inline-flex h-16 items-center gap-3 rounded-2xl bg-sun px-6 text-[24px] font-bold text-sun-ink shadow-sm"
          >
            <Sparkles className="size-7" aria-hidden /> Creations
            {creations.length > 0 && <span className="rounded-full bg-sun-ink/15 px-2.5 text-[20px] tabular-nums">{creations.length}</span>}
          </button>
          <time className="ml-4 text-right text-[34px] font-semibold tabular-nums text-ink-2" suppressHydrationWarning>
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
            <div className="flex shrink-0 items-center rounded-xl bg-surface p-1" role="radiogroup" aria-label="Time available">
              {(
                [
                  [0, 'Any time'],
                  [30, '≤ 30m'],
                  [60, '≤ 1h'],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={fits === m}
                  onClick={() => {
                    setFits(m);
                    grid.current?.scrollTo({ top: 0 });
                  }}
                  className={cx('h-14 rounded-lg px-4 text-[19px] font-semibold', fits === m ? 'bg-accent text-accent-ink' : 'text-ink-2')}
                >
                  {label}
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
                    <strong>{names(w.members, 2)}</strong> <span className="text-muted">{w.partial ? 'worked on' : 'finished'}</span>{' '}
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

      {gallery && (
        <CreationGallery
          creations={creations}
          shareUrl={urls.share}
          onOpen={(id) => setSelectedCreation(id)}
          onClose={() => setGallery(false)}
          paused={Boolean(selectedCreation)}
          lastTouch={lastTouch}
        />
      )}

      {creation && (
        <Modal onClose={() => setSelectedCreation(null)} label={creation.title}>
          <CreationView key={creation.id} creation={creation} />
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

/** Full-screen, photo-first gallery of everything people have made. */
function CreationGallery({
  creations,
  shareUrl,
  onOpen,
  onClose,
  paused,
  lastTouch,
}: {
  creations: Creation[];
  shareUrl: string;
  onOpen: (id: string) => void;
  onClose: () => void;
  paused: boolean;
  lastTouch: React.RefObject<number>;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  // When nobody is touching, drift slowly down the wall of photos, then start over.
  useEffect(() => {
    const t = setInterval(() => {
      const el = scroller.current;
      if (!el || paused || Date.now() - lastTouch.current < 15_000) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) el.scrollTo({ top: 0, behavior: 'smooth' });
      else el.scrollBy({ top: 220, behavior: 'smooth' });
    }, 4_000);
    return () => clearInterval(t);
  }, [paused, lastTouch]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Creations" className="rise fixed inset-0 z-40 flex flex-col bg-paper">
      <div className="flex shrink-0 items-center gap-6 bg-surface px-8 py-5">
        <div>
          <h2 className="text-[40px] font-bold leading-tight tracking-tight">Made at the lab</h2>
          <p className="text-[20px] text-muted">
            {creations.length} {creations.length === 1 ? 'creation' : 'creations'} shared by members — tap one to see it up close
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4 rounded-2xl bg-sun p-3 pr-5 text-sun-ink">
          <QR value={shareUrl} size={92} label="Scan to share your creation" />
          <div>
            <p className="text-[22px] font-bold leading-tight">Made something?</p>
            <p className="text-[17px] opacity-80">Scan to share it</p>
          </div>
        </div>
        <button onClick={onClose} className="pressable inline-flex h-16 items-center gap-2 rounded-2xl bg-surface-2 px-6 text-[22px] font-semibold">
          <X className="size-7" /> Back to tasks
        </button>
      </div>
      <div className="stripes" aria-hidden />

      <div ref={scroller} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-8 py-7">
        {creations.length ? (
          <div
            className={cx('mx-auto gap-6', creations.length < 3 && 'max-w-[1300px]')}
            // Fewer creations get bigger cards; never more than 4 columns on the wall.
            style={{ columnCount: Math.min(4, Math.max(2, creations.length)) }}
          >
            {creations.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpen(c.id)}
                className="pressable group mb-6 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-surface text-left shadow-lg ring-1 ring-line"
              >
                <span className="relative block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.thumbs[0] && <img src={c.thumbs[0]} alt="" className="block w-full" loading="lazy" />}
                  {c.featured && (
                    <span className="absolute left-3 top-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-sun px-3.5 text-[16px] font-bold text-sun-ink shadow">
                      <Star className="size-4 fill-current" /> Featured
                    </span>
                  )}
                  {c.photos.length > 1 && (
                    <span className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[16px] font-semibold text-white">{c.photos.length} photos</span>
                  )}
                </span>
                <span className="block p-5">
                  <span className="cap line-clamp-2 block text-[24px] font-semibold leading-snug">{c.title}</span>
                  <span className="mt-3 flex items-center gap-3 text-[18px] text-ink-2">
                    <Avatar member={c.member} size={36} />
                    <span className="min-w-0 truncate font-medium">{c.member.name}</span>
                    <span className="ml-auto shrink-0 text-muted">{ago(c.created)}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="text-[36px] font-semibold">No creations yet</p>
              <p className="mt-2 text-[22px] text-muted">Scan the yellow code to share the first one.</p>
            </div>
          </div>
        )}
      </div>
      <div className="stripes" aria-hidden />
    </div>
  );
}

/** One creation, large: every photo (tap a thumbnail to switch), the story, who made it. */
function CreationView({ creation }: { creation: Creation }) {
  const [i, setI] = useState(0);
  const src = creation.photos[i] ?? creation.thumbs[i];
  return (
    <div className="min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="max-h-[560px] w-full rounded-xl bg-surface-2 object-contain" />}
      {creation.thumbs.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
          {creation.thumbs.map((t, idx) => (
            <button
              key={t}
              onClick={() => setI(idx)}
              aria-label={`Photo ${idx + 1}`}
              className={cx('size-24 shrink-0 overflow-hidden rounded-lg ring-4', idx === i ? 'ring-sun' : 'ring-transparent opacity-70')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <h2 className="cap mt-5 text-[38px] font-bold leading-tight">{creation.title}</h2>
      <p className="mt-2 flex items-center gap-3 text-[21px] text-ink-2">
        <Avatar member={creation.member} size={40} /> {creation.member.name} · {ago(creation.created)}
      </p>
      {creation.description.trim() && <p className="mt-4 line-clamp-5 whitespace-pre-line text-[21px] leading-relaxed text-ink-2">{capitalize(creation.description.trim())}</p>}
    </div>
  );
}
