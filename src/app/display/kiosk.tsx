'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Sparkles, Trophy, X } from 'lucide-react';
import type { Creation, Task } from '@/lib/types';
import type { Win } from '@/lib/server/data';
import { formatMinutes, taskNo, zoneColor } from '@/lib/format';
import { siteConfig } from '@/lib/site-config';
import { QR } from '@/components/qr';
import { Avatar, AvatarStack, StatusPill, cx, names } from '@/components/ui';

const REFRESH_MS = 30_000;
const IDLE_MS = 90_000;
const SPOTLIGHT_MS = 9_000;

type Slide =
  | { kind: 'win'; key: string; win: Win }
  | { kind: 'creation'; key: string; creation: Creation };

function ago(d: string) {
  const s = (Date.now() - new Date(d.replace(' ', 'T')).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 14) return `${Math.round(s / 86400)}d ago`;
  if (s < 86400 * 60) return `${Math.round(s / (86400 * 7))}w ago`;
  return new Date(d.replace(' ', 'T')).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function Kiosk({
  tasks,
  wins,
  creations,
  stats,
  urls,
}: {
  tasks: Task[];
  wins: Win[];
  creations: Creation[];
  stats: { tasks: number; hours: number; third: number; thirdLabel: string; window: string };
  urls: { base: string; signup: string; share: string };
}) {
  const router = useRouter();
  const [view, setView] = useState<'open' | 'in_progress'>('open');
  const [zone, setZone] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const lastTouch = useRef(Date.now());

  const open = tasks.filter((t) => t.status === 'open');
  const active = tasks.filter((t) => t.status !== 'open');
  const pool = view === 'open' ? open : active;
  const zones = useMemo(() => [...new Set(pool.map((t) => t.zone))].sort(), [pool]);
  const shown = zone ? pool.filter((t) => t.zone === zone) : pool;
  const current = tasks.find((t) => t.id === selected) ?? null;

  const slides: Slide[] = useMemo(() => {
    const ws: Slide[] = wins.map((w) => ({ kind: 'win', key: `w${w.key}`, win: w }));
    const cs: Slide[] = creations.map((c) => ({ kind: 'creation', key: `c${c.id}`, creation: c }));
    const out: Slide[] = [];
    for (let i = 0; i < Math.max(ws.length, cs.length); i++) {
      if (cs[i]) out.push(cs[i]);
      if (ws[i]) out.push(ws[i]);
    }
    return out;
  }, [wins, creations]);

  const reset = useCallback(() => {
    setSelected(null);
    setZone(null);
    setView('open');
    grid.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Live data, clock, spotlight rotation and idle reset.
  useEffect(() => {
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 15_000);
    const refresh = setInterval(() => router.refresh(), REFRESH_MS);
    const idle = setInterval(() => {
      if (Date.now() - lastTouch.current > IDLE_MS) reset();
    }, 5_000);
    const touch = () => (lastTouch.current = Date.now());
    window.addEventListener('pointerdown', touch);
    window.addEventListener('wheel', touch, { passive: true });
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
      clearInterval(idle);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('wheel', touch);
    };
  }, [router, reset]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), SPOTLIGHT_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    if (!selected) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [selected]);

  const s = slides.length ? slides[slide % slides.length] : null;

  return (
    <div data-theme="dark" className="flex h-dvh select-none flex-col overflow-hidden bg-paper text-ink" onContextMenu={(e) => e.preventDefault()}>
      {/* Header */}
      <header className="flex items-center gap-6 border-b border-line px-8 py-5">
        <button onClick={reset} className="flex items-center gap-3 rounded-xl" aria-label="Back to start">
          <span className="grid size-14 place-items-center rounded-xl bg-accent font-mono text-xl font-bold text-accent-ink">
            {siteConfig.shortName.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'TD'}
          </span>
          <span className="text-left">
            <span className="block text-2xl font-semibold tracking-tight">{siteConfig.name}</span>
            <span className="block text-base text-muted">Tap a task · scan the code · it’s yours</span>
          </span>
        </button>
        <dl className="ml-auto hidden items-center gap-8 lg:flex">
          {[
            [stats.tasks, `tasks done · ${stats.window}`],
            [stats.hours, `hours given · ${stats.window}`],
            [stats.third, stats.thirdLabel],
          ].map(([v, l]) => (
            <div key={l} className="text-right">
              <dd className="text-3xl font-semibold tabular-nums">{v}</dd>
              <dt className="text-sm text-muted">{l}</dt>
            </div>
          ))}
        </dl>
        <time className="w-28 text-right font-mono text-3xl tabular-nums text-ink-2" suppressHydrationWarning>
          {now?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/, '') ?? ''}
        </time>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 p-6 xl:grid-cols-[1fr_minmax(440px,32%)]">
        {/* Tasks */}
        <section className="flex min-h-0 flex-col">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {(
              [
                ['open', `Open · ${open.length}`],
                ['in_progress', `In progress · ${active.length}`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => {
                  setView(k);
                  setZone(null);
                }}
                className={cx('h-14 rounded-2xl px-6 text-xl font-semibold transition', view === k ? 'bg-ink text-paper' : 'bg-surface text-muted')}
              >
                {label}
              </button>
            ))}
            <div className="no-scrollbar ml-2 flex gap-2 overflow-x-auto">
              {zones.length > 1 &&
                [null, ...zones].map((z) => (
                  <button
                    key={z ?? 'all'}
                    onClick={() => setZone(z)}
                    className={cx(
                      'inline-flex h-14 shrink-0 items-center gap-2 rounded-full border px-5 text-lg font-medium',
                      zone === z ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink-2',
                    )}
                  >
                    {z && <span className="size-3 rounded-full" style={{ background: zoneColor(z) }} />}
                    {z ?? 'All'}
                  </button>
                ))}
            </div>
          </div>

          <div ref={grid} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
            {shown.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {shown.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className="relative flex min-h-[200px] flex-col rounded-3xl border border-line bg-surface p-6 text-left transition active:scale-[0.98] active:bg-surface-2"
                  >
                    <span className="absolute inset-y-5 left-0 w-1.5 rounded-r-full" style={{ background: zoneColor(t.zone) }} />
                    <span className="flex items-center justify-between">
                      <span className="font-mono text-lg text-muted">{taskNo(t.number)}</span>
                      {t.status !== 'open' && <StatusPill status={t.status} className="h-8 text-sm" />}
                    </span>
                    <span className="mt-2 line-clamp-3 text-[26px] font-semibold leading-tight tracking-tight">{t.title}</span>
                    <span className="mt-auto flex items-center gap-5 pt-4 text-lg text-ink-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-3 rounded-full" style={{ background: zoneColor(t.zone) }} />
                        {t.zone}
                      </span>
                      {t.estimatedMinutes > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-muted">
                          <Clock className="size-5" /> {formatMinutes(t.estimatedMinutes)}
                        </span>
                      )}
                      {t.assignees.length > 0 && (
                        <span className="ml-auto">
                          <AvatarStack members={t.assignees} size={40} />
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mat grid h-full min-h-80 place-items-center rounded-3xl border border-dashed border-line-strong text-center">
                <div>
                  <p className="text-3xl font-semibold">{view === 'open' ? 'The board is clear!' : 'Nobody’s mid-task'}</p>
                  <p className="mt-2 text-xl text-muted">Spotted something that needs doing? Post it from your phone.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Spotlight + join */}
        <aside className="hidden min-h-0 flex-col gap-6 xl:flex">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-line bg-surface">
            {s ? <Spotlight key={s.key} slide={s} /> : <EmptySpotlight />}
            {slides.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {slides.map((x, i) => (
                  <span key={x.key} className={cx('h-1.5 rounded-full transition-all', i === slide % slides.length ? 'w-6 bg-accent' : 'w-1.5 bg-white/40')} />
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <QRCard url={urls.signup} title="New here?" body="Make an account" />
            <QRCard url={urls.share} title="Made something?" body="Share it here" />
          </div>
        </aside>
      </div>

      {/* Task sheet */}
      {current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8" onClick={() => setSelected(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={current.title}
            className="rise grid max-h-full w-full max-w-5xl grid-cols-1 gap-10 overflow-y-auto rounded-[32px] border border-line bg-surface p-10 md:grid-cols-[1fr_auto]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <span className="font-mono text-2xl text-muted">{taskNo(current.number)}</span>
                <span className="inline-flex items-center gap-2 text-xl text-ink-2">
                  <span className="size-3.5 rounded-full" style={{ background: zoneColor(current.zone) }} />
                  {current.zone}
                </span>
                {current.estimatedMinutes > 0 && <span className="text-xl text-muted">~{formatMinutes(current.estimatedMinutes)}</span>}
              </div>
              <h2 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight">{current.title}</h2>
              {current.description && <p className="mt-6 line-clamp-[8] whitespace-pre-line text-2xl leading-relaxed text-ink-2">{current.description}</p>}
              {current.assignees.length > 0 && (
                <div className="mt-8 flex items-center gap-4">
                  <AvatarStack members={current.assignees} size={48} />
                  <p className="text-xl">
                    <span className="font-semibold">{names(current.assignees)}</span> {current.assignees.length > 1 ? 'are' : 'is'} on it — join in!
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-5 text-center">
              <QR value={`${urls.base}/tasks/${current.id}`} size={300} label={`QR code to claim ${current.title}`} />
              <div>
                <p className="text-2xl font-semibold">Scan to claim</p>
                <p className="mt-1 text-lg text-muted">Open your phone camera and point it here</p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="col-span-full flex h-16 items-center justify-center gap-2 rounded-2xl bg-surface-2 text-xl font-semibold"
            >
              <X className="size-6" /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QRCard({ url, title, body }: { url: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-line bg-surface p-5 text-center 2xl:flex-row 2xl:text-left">
      <QR value={url} size={112} label={`QR code: ${body}`} />
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-tight">{title}</p>
        <p className="mt-1 text-base text-muted">{body}</p>
      </div>
    </div>
  );
}

function Spotlight({ slide }: { slide: Slide }) {
  if (slide.kind === 'creation') {
    const c = slide.creation;
    return (
      <div className="rise absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {c.thumbs[0] && <img src={c.thumbs[0]} alt="" className="absolute inset-0 size-full object-cover" />}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-7 pb-10 pt-24 text-white">
          <p className="inline-flex items-center gap-2 text-base font-semibold uppercase tracking-[0.1em] text-[#ffb98f]">
            <Sparkles className="size-5" /> Made here
          </p>
          <p className="mt-2 text-4xl font-semibold leading-tight tracking-tight">{c.title}</p>
          <div className="mt-4 flex items-center gap-3">
            <Avatar member={c.member} size={44} />
            <span className="text-xl font-medium">{c.member.name}</span>
            <span className="ml-auto text-lg text-white/70">{ago(c.created)}</span>
          </div>
        </div>
      </div>
    );
  }
  const w = slide.win;
  return (
    <div className="rise absolute inset-0 flex flex-col">
      {w.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={w.photo} alt="" className="min-h-0 w-full flex-1 object-cover" />
      ) : (
        <div className="mat grid min-h-0 flex-1 place-items-center">
          <span className="font-mono text-8xl font-semibold text-ink/80">{w.task ? taskNo(w.task.number) : '✓'}</span>
        </div>
      )}
      <div className="p-7 pb-10">
        <p className="inline-flex items-center gap-2 text-base font-semibold uppercase tracking-[0.1em] text-good">
          <Trophy className="size-5" /> Just finished · {ago(w.created)}
        </p>
        <p className="mt-2 line-clamp-2 text-3xl font-semibold leading-tight tracking-tight">{w.task?.title ?? 'A task'}</p>
        <div className="mt-4 flex items-center gap-3">
          <AvatarStack members={w.members} size={44} max={3} />
          <span className="truncate text-xl font-medium">{names(w.members, 2)}</span>
          <span className="ml-auto shrink-0 text-lg text-muted">{formatMinutes(w.minutes)}</span>
        </div>
      </div>
    </div>
  );
}

function EmptySpotlight() {
  return (
    <div className="mat grid size-full place-items-center p-10 text-center">
      <div>
        <p className="text-3xl font-semibold">Your project could be here</p>
        <p className="mt-2 text-xl text-muted">Finish a task or share a creation and it shows up on this screen.</p>
      </div>
    </div>
  );
}
