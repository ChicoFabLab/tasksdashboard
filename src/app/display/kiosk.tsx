'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hand, X } from 'lucide-react';
import type { Creation, Member, Task } from '@/lib/types';
import type { Win } from '@/lib/server/data';
import { capitalize, formatMinutes, shortMinutes, zoneCode, zoneColor } from '@/lib/format';
import { siteConfig } from '@/lib/site-config';
import { QR } from '@/components/qr';
import { LogoMark } from '@/components/logo';
import { DoneStamp, MakerFace } from '@/components/cards';
import { Avatar, AvatarStack, cx, names } from '@/components/ui';

const REFRESH_MS = 30_000;
const ATTRACT_AFTER_MS = 60_000;
const SPOTLIGHT_MS = 9_000;

type Slide = { kind: 'win'; key: string; win: Win } | { kind: 'creation'; key: string; creation: Creation };

function ago(d: string) {
  const s = (Date.now() - new Date(d.replace(' ', 'T')).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hr ago`;
  if (s < 86400 * 14) return `${Math.round(s / 86400)} days ago`;
  if (s < 86400 * 60) return `${Math.round(s / (86400 * 7))} weeks ago`;
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
  stats: { tasks: number; hours: number; window: string; lastWin: { member: Member; created: string } | null };
  urls: { base: string; signup: string; share: string; tasks: string };
}) {
  const router = useRouter();
  const [view, setView] = useState<'open' | 'in_progress'>('open');
  const [zone, setZone] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [attract, setAttract] = useState(false);
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
      if (ws[i]) out.push(ws[i]);
      if (cs[i]) out.push(cs[i]);
    }
    return out;
  }, [wins, creations]);

  const reset = useCallback(() => {
    setSelected(null);
    setZone(null);
    setView('open');
    grid.current?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 15_000);
    const refresh = setInterval(() => router.refresh(), REFRESH_MS);
    const idle = setInterval(() => {
      if (Date.now() - lastTouch.current > ATTRACT_AFTER_MS) {
        reset();
        setAttract(true);
      }
    }, 3_000);
    const touch = () => {
      lastTouch.current = Date.now();
      setAttract(false);
    };
    window.addEventListener('pointerdown', touch, { capture: true });
    window.addEventListener('wheel', touch, { passive: true });
    window.addEventListener('keydown', touch);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
      clearInterval(idle);
      window.removeEventListener('pointerdown', touch, { capture: true });
      window.removeEventListener('wheel', touch);
      window.removeEventListener('keydown', touch);
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
  const clock = now?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/, '') ?? '';

  return (
    <div data-theme="dark" className="flex h-dvh select-none flex-col overflow-hidden bg-paper text-ink" onContextMenu={(e) => e.preventDefault()}>
      {/* Header */}
      <header className="flex items-center gap-8 border-b-[1.5px] border-line-strong px-8 py-4">
        <button onClick={reset} className="flex items-center gap-4 rounded-xl" aria-label="Back to start">
          <LogoMark size={60} />
          <span className="text-left">
            <span className="display block text-[38px] font-extrabold uppercase leading-none">{siteConfig.name}</span>
            <span className="mt-1 block font-mono text-[22px] font-medium text-muted">Pick a job · scan it · it’s yours</span>
          </span>
        </button>
        <dl className="ml-auto flex items-center gap-10">
          {stats.lastWin && (
            <div className="hidden items-center gap-3 2xl:flex">
              <Avatar member={stats.lastWin.member} size={56} />
              <div>
                <dd className="text-[22px] font-semibold leading-tight">{stats.lastWin.member.name}</dd>
                <dt className="text-[22px] leading-tight text-muted">finished a job {ago(stats.lastWin.created)}</dt>
              </div>
            </div>
          )}
          {[
            [stats.tasks, 'jobs done'],
            [stats.hours, 'hours given'],
          ].map(([v, l]) => (
            <div key={l} className="text-right">
              <dd className="display text-[64px] font-extrabold leading-[0.85] tabular-nums">{v}</dd>
              <dt className="text-[22px] text-muted">
                {l} <span className="font-mono text-[18px]">· {stats.window}</span>
              </dt>
            </div>
          ))}
        </dl>
        <time className="w-36 text-right font-mono text-[44px] font-semibold tabular-nums text-ink-2" suppressHydrationWarning>
          {clock}
        </time>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 px-6 pt-5 xl:grid-cols-[1fr_minmax(460px,30%)]">
        {/* Board */}
        <section className="flex min-h-0 flex-col">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {(
              [
                ['open', 'Open', open.length],
                ['in_progress', 'Being worked on', active.length],
              ] as const
            ).map(([k, label, n]) => (
              <button
                key={k}
                onClick={() => {
                  setView(k);
                  setZone(null);
                }}
                className={cx(
                  'pressable h-16 rounded-xl px-6 text-[24px] font-bold',
                  view === k ? 'bg-ink text-paper' : 'border-[1.5px] border-line-strong bg-surface text-ink-2',
                )}
              >
                {label} <span className="font-mono">{n}</span>
              </button>
            ))}
            <span className="mx-1 h-10 w-px bg-line-strong" aria-hidden />
            {zones.length > 1 &&
              [null, ...zones].map((z) => (
                <button
                  key={z ?? 'all'}
                  onClick={() => setZone(z)}
                  className={cx(
                    'inline-flex h-14 items-center gap-2.5 rounded-xl border-[1.5px] px-4 text-[22px] font-semibold',
                    zone === z ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface text-ink-2',
                  )}
                >
                  {z ? (
                    <span className="rounded-[2px] px-1.5 font-mono text-[18px] text-[#111]" style={{ background: zoneColor(z) }}>
                      {zoneCode(z)}
                    </span>
                  ) : (
                    'All'
                  )}
                </button>
              ))}
          </div>

          <div ref={grid} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
            {shown.length ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {shown.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className="pressable relative flex min-h-[208px] overflow-hidden rounded-2xl border-[1.5px] border-line-strong bg-surface text-left"
                  >
                    <span className="absolute inset-x-0 top-0 h-2.5" style={{ background: zoneColor(t.zone) }} aria-hidden />
                    <span className="flex min-w-0 flex-1 flex-col p-5 pt-6">
                      <span className="flex items-center gap-3 font-mono text-[20px] font-semibold uppercase">
                        <span className="rounded-[2px] px-2 text-[#111]" style={{ background: zoneColor(t.zone) }}>
                          {zoneCode(t.zone)}
                        </span>
                        {t.estimatedMinutes > 0 && <span className="text-ink-2">~{shortMinutes(t.estimatedMinutes)}</span>}
                        {t.estimatedMinutes > 0 && t.estimatedMinutes <= 30 && (
                          <span className="rounded-[2px] bg-hivis px-2 text-[16px] text-hivis-ink">Quick</span>
                        )}
                      </span>
                      <span className="cap display mt-3 line-clamp-2 text-[34px] font-bold leading-[1.02]">{t.title}</span>
                      <span className="mt-auto flex items-center gap-3 pt-3 text-[22px] text-muted">
                        {t.assignees.length > 0 ? (
                          <>
                            <AvatarStack members={t.assignees} size={40} />
                            <span className="truncate">{names(t.assignees, 1)} on it</span>
                          </>
                        ) : (
                          <span className="font-mono text-[18px]">#{t.number}</span>
                        )}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center pr-5 pt-2">
                      <QR value={`${urls.base}/tasks/${t.id}`} size={128} label={`Scan to claim ${t.title}`} />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid h-full min-h-80 place-items-center rounded-2xl border-[1.5px] border-dashed border-line-strong text-center">
                <div>
                  <p className="display text-[48px] font-extrabold uppercase">{view === 'open' ? 'Board’s clear!' : 'Nobody’s mid-job'}</p>
                  <p className="mt-2 text-[26px] text-muted">Spotted something that needs doing? Post it from your phone.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Spotlight + join */}
        <aside className="hidden min-h-0 flex-col gap-5 pb-5 xl:flex">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border-[1.5px] border-line-strong bg-surface">
            {s ? <Spotlight key={s.key} slide={s} /> : <EmptySpotlight />}
            {slides.length > 1 && (
              <span key={slide} className="absolute inset-x-0 top-0 h-1.5 origin-left bg-hivis" style={{ animation: `progress ${SPOTLIGHT_MS}ms linear both` }} aria-hidden />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <QRCard url={urls.signup} title="New here?" body="Make an account" />
            <QRCard url={urls.share} title="Made something?" body="Share it" />
          </div>
        </aside>
      </div>

      <Ticker wins={wins} />

      {/* Task sheet */}
      {current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-10" onClick={() => setSelected(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={current.title}
            className="rise relative grid max-h-full w-full max-w-6xl grid-cols-[1fr_auto] gap-12 overflow-hidden rounded-2xl border-[1.5px] border-line-strong bg-surface p-12 pt-14"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="absolute inset-x-0 top-0 h-3" style={{ background: zoneColor(current.zone) }} aria-hidden />
            <div className="min-w-0">
              <p className="flex items-center gap-4 font-mono text-[24px] font-semibold uppercase">
                <span className="rounded-[2px] px-2 text-[#111]" style={{ background: zoneColor(current.zone) }}>
                  {zoneCode(current.zone)}
                </span>
                <span className="text-muted">Task {current.number}</span>
                {current.estimatedMinutes > 0 && <span className="dim text-ink-2">{formatMinutes(current.estimatedMinutes)}</span>}
              </p>
              <h2 className="cap display mt-5 text-[64px] font-extrabold leading-[0.95]">{current.title}</h2>
              {current.description && <p className="mt-6 line-clamp-6 whitespace-pre-line text-[26px] leading-snug text-ink-2">{capitalize(current.description)}</p>}
              {current.assignees.length > 0 && (
                <div className="mt-8 flex items-center gap-4">
                  <AvatarStack members={current.assignees} size={56} />
                  <p className="text-[26px]">
                    <span className="font-semibold">{names(current.assignees)}</span> {current.assignees.length > 1 ? 'are' : 'is'} on it — join in!
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-5 text-center">
              <QR value={`${urls.base}/tasks/${current.id}`} size={340} label={`QR code to claim ${current.title}`} />
              <p className="display text-[40px] font-extrabold uppercase leading-none">Scan to claim</p>
              <p className="text-[22px] text-muted">Point your phone camera here</p>
            </div>
            <button onClick={() => setSelected(null)} className="pressable col-span-full flex h-20 items-center justify-center gap-3 rounded-xl bg-surface-2 text-[26px] font-bold">
              <X className="size-8" /> Close
            </button>
          </div>
        </div>
      )}

      {/* Attract mode */}
      {attract && (
        <div className="fixed inset-0 z-[60] grid grid-cols-[1fr_520px] bg-paper" aria-label="Showcase — touch to start">
          <div className="relative overflow-hidden">{s ? <Spotlight key={'a' + s.key} slide={s} huge /> : <EmptySpotlight />}</div>
          <div className="flex flex-col items-center justify-center gap-8 border-l-[1.5px] border-line-strong bg-surface p-12 text-center">
            <LogoMark size={88} />
            <p className="display text-[72px] font-extrabold uppercase leading-[0.9]">
              <span className="text-hivis">{open.length}</span> jobs need a hand
            </p>
            <QR value={urls.tasks} size={260} label="Scan to see open jobs" />
            <p className="text-[26px] text-ink-2">Scan to grab one on your phone</p>
            <p className="flex items-center gap-3 text-[24px] font-semibold text-muted">
              <Hand className="size-8 animate-pulse" aria-hidden /> or touch the screen
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Ticker({ wins }: { wins: Win[] }) {
  if (!wins.length) return null;
  const items = [...wins, ...wins]; // duplicated for a seamless loop
  return (
    <div className="relative flex h-[76px] shrink-0 items-center overflow-hidden border-t-[1.5px] border-line-strong bg-surface">
      <span className="z-10 flex h-full shrink-0 items-center bg-hivis px-6 font-mono text-[20px] font-semibold uppercase tracking-wider text-hivis-ink">
        Just finished
      </span>
      <div className="flex min-w-max items-center gap-12 pl-10" style={{ animation: `ticker ${wins.length * 7}s linear infinite` }}>
        {items.map((w, i) => (
          <span key={w.key + i} className="flex items-center gap-3 whitespace-nowrap text-[24px]">
            <AvatarStack members={w.members} size={44} max={2} />
            <strong>{names(w.members, 2)}</strong>
            <span className="cap text-ink-2">{w.task?.title ?? 'a task'}</span>
            <span className="font-mono text-[20px] text-muted">{formatMinutes(w.minutes)}</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

function QRCard({ url, title, body }: { url: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-line-strong bg-surface p-5 text-center">
      <QR value={url} size={136} label={`QR code: ${body}`} />
      <div>
        <p className="display text-[30px] font-extrabold uppercase leading-none">{title}</p>
        <p className="mt-1 text-[22px] text-muted">{body}</p>
      </div>
    </div>
  );
}

function Spotlight({ slide, huge }: { slide: Slide; huge?: boolean }) {
  if (slide.kind === 'creation') {
    const c = slide.creation;
    return (
      <div className="rise absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {c.thumbs[0] && <img src={c.photos[0] ?? c.thumbs[0]} alt="" className="kenburns absolute inset-0 size-full object-cover" />}
        <div className={cx('absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent text-white', huge ? 'p-14 pt-48' : 'p-7 pt-28')}>
          <p className="font-mono text-[22px] font-semibold uppercase tracking-wider text-hivis">Made here</p>
          <p className={cx('cap display mt-2 font-extrabold uppercase leading-[0.95]', huge ? 'text-[96px]' : 'text-[48px]')}>{c.title}</p>
          <div className="mt-5 flex items-center gap-4">
            <Avatar member={c.member} size={huge ? 72 : 52} />
            <span className={cx('font-semibold', huge ? 'text-[34px]' : 'text-[26px]')}>{c.member.name}</span>
            <span className="ml-auto text-[22px] text-white/75">{ago(c.created)}</span>
          </div>
        </div>
      </div>
    );
  }
  const w = slide.win;
  const zone = w.task?.zone ?? 'General';
  const lead = w.members[0];
  return (
    <div className="rise absolute inset-0 flex flex-col overflow-hidden">
      {w.photo ? (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={w.photo} alt="" className="kenburns size-full object-cover" />
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6 bg-surface-2 p-8">
          <span className="absolute inset-x-0 top-0 h-3" style={{ background: zoneColor(zone) }} aria-hidden />
          <MakerFace member={lead} zone={zone} size={huge ? 300 : 180} />
          <p className={cx('display text-center font-extrabold uppercase leading-[0.9]', huge ? 'text-[110px]' : 'text-[60px]')}>{lead.name}</p>
          {w.members.length > 1 && <p className="text-[26px] text-ink-2">with {names(w.members.slice(1), 2)}</p>}
        </div>
      )}
      <div className={cx('relative border-t-[1.5px] border-line-strong bg-surface', huge ? 'p-12' : 'p-7')}>
        <DoneStamp big className="absolute -top-6 right-7" />
        <p className="font-mono text-[22px] font-semibold uppercase tracking-wider text-muted">
          {zoneCode(zone)} · {ago(w.created)} · {formatMinutes(w.minutes)}
        </p>
        <p className={cx('cap display mt-2 line-clamp-2 font-bold leading-[1]', huge ? 'text-[64px]' : 'text-[38px]')}>{w.task?.title ?? 'A task'}</p>
        {w.photo && (
          <div className="mt-4 flex items-center gap-3">
            <AvatarStack members={w.members} size={48} max={3} />
            <span className="truncate text-[26px] font-semibold">{names(w.members, 2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptySpotlight() {
  return (
    <div className="grid size-full place-items-center p-10 text-center">
      <div>
        <p className="display text-[48px] font-extrabold uppercase leading-none">Your project here</p>
        <p className="mt-3 text-[24px] text-muted">Finish a job or share a creation and it shows up on this screen.</p>
      </div>
    </div>
  );
}
