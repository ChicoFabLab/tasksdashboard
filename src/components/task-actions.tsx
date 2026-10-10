'use client';

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Check, Clock, Pause, Pencil, Play, RotateCcw, Search, Timer, X } from 'lucide-react';
import { claimTask, editTime, finishTask, unclaimTask } from '@/app/actions/tasks';
import type { FormState } from '@/app/actions/auth';
import type { Member } from '@/lib/types';
import { Avatar, Button, Field, Notice, cx, inputClass } from './ui';
import { PhotoInput } from './photo-input';
import { Submit } from './submit';

export function ClaimButtons({ taskId, mine, status, autoClaim }: { taskId: string; mine: boolean; status: string; autoClaim?: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<FormState>();
  const run = (fn: (id: string) => Promise<FormState>) => start(async () => setMsg(await fn(taskId)));
  // Arriving back from sign-up/sign-in with ?claim=1: they already chose this task.
  const claimed = useRef(false);
  useEffect(() => {
    if (autoClaim && !claimed.current) {
      claimed.current = true;
      run(claimTask);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoClaim]);

  return (
    <div className="space-y-3">
      {msg?.error && <Notice tone="bad">{msg.error}</Notice>}
      {msg?.ok && <Notice tone="good">{msg.ok}</Notice>}
      {!mine ? (
        <Button size="xl" block disabled={pending} onClick={() => run(claimTask)}>
          {pending ? 'Claiming…' : status === 'in_progress' ? 'Join in on this task' : 'Claim this task'}
        </Button>
      ) : (
        <Button variant="ghost" block disabled={pending} onClick={() => run(unclaimTask)}>
          {pending ? 'Releasing…' : 'I can’t do it after all — release it'}
        </Button>
      )}
    </div>
  );
}

const QUICK: [number, string][] = [
  [15, '15m'],
  [30, '30m'],
  [45, '45m'],
  [60, '1h'],
  [90, '1½h'],
  [120, '2h'],
];

// ---------------- Timer ----------------
// Kept per device in localStorage so a reload (or locking your phone) doesn't lose it.
type TimerState = { start: number | null; banked: number }; // banked = ms accumulated while paused

function timerKey(taskId: string) {
  return `cfl-timer:${taskId}`;
}
function readTimer(taskId: string): TimerState {
  try {
    const v = JSON.parse(localStorage.getItem(timerKey(taskId)) || 'null');
    if (v && typeof v.banked === 'number') return v;
  } catch {}
  return { start: null, banked: 0 };
}
function writeTimer(taskId: string, t: TimerState) {
  try {
    if (!t.start && !t.banked) localStorage.removeItem(timerKey(taskId));
    else localStorage.setItem(timerKey(taskId), JSON.stringify(t));
  } catch {}
}
function elapsedMs(t: TimerState) {
  return t.banked + (t.start ? Date.now() - t.start : 0);
}
function clock(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(sec).padStart(2, '0')}`;
}

export function TaskTimer({ taskId, estimate, onUse }: { taskId: string; estimate: number; onUse?: (minutes: number) => void }) {
  const [t, setT] = useState<TimerState>({ start: null, banked: 0 });
  const [, tick] = useState(0);
  useEffect(() => setT(readTimer(taskId)), [taskId]);
  useEffect(() => {
    if (!t.start) return;
    const i = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [t.start]);
  const update = (next: TimerState) => {
    setT(next);
    writeTimer(taskId, next);
  };
  const ms = elapsedMs(t);
  const mins = Math.max(1, Math.ceil(ms / 60000));
  const pct = estimate > 0 ? Math.min(100, (ms / (estimate * 60000)) * 100) : 0;
  const running = Boolean(t.start);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <Timer className={cx('size-5', running ? 'text-accent' : 'text-muted')} aria-hidden />
        <span className="text-2xl font-semibold tabular-nums" aria-live="off">
          {clock(ms)}
        </span>
        {estimate > 0 && <span className="text-sm text-muted">of ~{estimate} min</span>}
        <span className="ml-auto flex gap-1.5">
          {running ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => update({ start: null, banked: elapsedMs(t) })}>
              <Pause className="size-4" aria-hidden /> Pause
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => update({ start: Date.now(), banked: t.banked })}>
              <Play className="size-4" aria-hidden /> {t.banked ? 'Resume' : 'Start timer'}
            </Button>
          )}
          {(t.banked > 0 || running) && (
            <Button type="button" size="sm" variant="ghost" aria-label="Reset timer" onClick={() => confirm('Reset the timer to zero?') && update({ start: null, banked: 0 })}>
              <RotateCcw className="size-4" aria-hidden />
            </Button>
          )}
        </span>
      </div>
      {estimate > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className={cx('h-full rounded-full', pct >= 100 ? 'bg-warn' : 'bg-accent')} style={{ width: `${pct}%` }} />
        </div>
      )}
      {onUse && ms >= 30000 && (
        <button type="button" onClick={() => onUse(mins)} className="mt-3 text-sm font-semibold text-accent hover:underline">
          Use timer: {mins} min
        </button>
      )}
    </div>
  );
}

export function clearTaskTimer(taskId: string) {
  writeTimer(taskId, { start: null, banked: 0 });
}

// ---------------- Log time / finish ----------------

export function FinishForm({
  taskId,
  estimate,
  members,
  me,
  defaultOpen,
}: {
  taskId: string;
  estimate: number;
  members: Member[];
  me: string;
  defaultOpen?: boolean;
}) {
  const [mode, setMode] = useState<'finish' | 'partial' | null>(defaultOpen ? 'finish' : null);
  const [state, action] = useActionState(finishTask, undefined);
  const [minutes, setMinutes] = useState(estimate > 0 ? String(estimate) : '');
  const [helpers, setHelpers] = useState<string[]>([]);
  const [helperMinutes, setHelperMinutes] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState(false);

  const others = useMemo(() => members.filter((m) => m.id !== me), [members, me]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? others.filter((m) => m.name.toLowerCase().includes(q)) : others).slice(0, 30);
  }, [others, query]);
  const chosen = helpers.map((id) => others.find((m) => m.id === id)).filter(Boolean) as Member[];
  // A helper's minutes follow yours until someone types a different number for them.
  const minsFor = (id: string) => helperMinutes[id] ?? minutes;
  const myMins = Number(minutes) || 0;
  const team = chosen.length + 1;
  const total = myMins + chosen.reduce((n, m) => n + (Number(minsFor(m.id)) || 0), 0);

  const sameForAll = () => setHelperMinutes({});
  const splitEvenly = () => {
    const each = Math.max(1, Math.round(total / team));
    setMinutes(String(each));
    setHelperMinutes(Object.fromEntries(chosen.map((m) => [m.id, String(each)])));
  };

  if (!mode) {
    return (
      <div className="space-y-3">
        <TaskTimer taskId={taskId} estimate={estimate} />
        <Button size="xl" variant="dark" block onClick={() => setMode('finish')}>
          <Check className="size-6" aria-hidden /> I finished it
        </Button>
        <Button size="lg" variant="secondary" block onClick={() => setMode('partial')}>
          <Clock className="size-5" aria-hidden /> Log my time, leave it open
        </Button>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        clearTaskTimer(taskId);
        return action(fd);
      }}
      className="space-y-6 rounded-2xl border border-line bg-surface p-5 sm:p-6"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="mode" value={mode} />
      {chosen.map((m) => (
        <span key={m.id}>
          <input type="hidden" name="helpers" value={m.id} />
          <input type="hidden" name={`helper_minutes_${m.id}`} value={minsFor(m.id)} />
        </span>
      ))}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Log your time</h2>
        <button type="button" onClick={() => setMode(null)} className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-2" aria-label="Cancel">
          <X className="size-5" />
        </button>
      </div>

      <div role="radiogroup" aria-label="Is the task done?" className="grid grid-cols-2 rounded-xl bg-surface-2 p-1">
        {(
          [
            ['finish', 'Finished it'],
            ['partial', 'Did some — leave it open'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={mode === k}
            onClick={() => setMode(k)}
            className={cx('min-h-11 rounded-lg px-2 text-sm font-semibold', mode === k ? 'bg-surface text-ink shadow-sm' : 'text-muted')}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'partial' && (
        <p className="-mt-3 text-sm text-muted">Your time is saved and you step off the task, so someone else can pick it up where you left off.</p>
      )}

      {state?.error && <Notice tone="bad">{state.error}</Notice>}

      <TaskTimer taskId={taskId} estimate={estimate} onUse={(m) => setMinutes(String(m))} />

      <Field label={chosen.length ? 'Your time' : 'How long did you work on it?'} htmlFor="minutes" hint="In minutes.">
        <div className="flex flex-wrap gap-2">
          {QUICK.map(([q, label]) => (
            <button
              key={q}
              type="button"
              onClick={() => setMinutes(String(q))}
              aria-pressed={minutes === String(q)}
              className={cx(
                'h-12 min-w-14 rounded-xl border px-3 text-[15px] font-semibold transition',
                minutes === String(q) ? 'border-accent bg-accent-soft text-ink' : 'border-line-strong bg-surface hover:border-ink',
              )}
            >
              {label}
            </button>
          ))}
          <input
            id="minutes"
            name="minutes"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            value={minutes}
            onChange={(e) => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className={cx(inputClass, 'w-24 text-center font-semibold')}
            aria-label="Your minutes"
            placeholder="min"
          />
        </div>
      </Field>

      <Field label="Who else worked on it?" hint={chosen.length ? 'Adjust anyone’s minutes, or use the buttons to even it out.' : 'Optional — they get credit too.'}>
        {chosen.length > 0 && (
          <>
            <ul className="mb-3 divide-y divide-line rounded-xl border border-line">
              {chosen.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                  <Avatar member={m} size={32} />
                  <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={minsFor(m.id)}
                    onChange={(e) => setHelperMinutes((h) => ({ ...h, [m.id]: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className={cx(inputClass, 'h-11 w-20 text-center')}
                    aria-label={`${m.name}'s minutes`}
                  />
                  <span className="text-sm text-muted">min</span>
                  <button
                    type="button"
                    onClick={() => setHelpers((h) => h.filter((x) => x !== m.id))}
                    className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface-2"
                    aria-label={`Remove ${m.name}`}
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <Button type="button" size="sm" variant="secondary" onClick={sameForAll}>
                Everyone {myMins || '…'} min
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={splitEvenly} disabled={!total}>
                Split {total} min evenly ({team} people)
              </Button>
              <span className="text-muted">Total: {total} min</span>
            </div>
          </>
        )}
        {picking ? (
          <div className="rounded-xl border border-line-strong">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search names"
                className="h-12 w-full rounded-t-xl border-b border-line bg-transparent pl-11 pr-4 focus:outline-none"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto p-1">
              {matches.map((m) => {
                const on = helpers.includes(m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setHelpers((h) => (on ? h.filter((x) => x !== m.id) : [...h, m.id].slice(0, 10)))}
                      className={cx('flex h-14 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-surface-2', on && 'bg-accent-soft')}
                    >
                      <Avatar member={m} size={36} />
                      <span className="flex-1 font-medium">{m.name}</span>
                      {on && <Check className="size-5 text-accent-strong" aria-hidden />}
                    </button>
                  </li>
                );
              })}
              {matches.length === 0 && <li className="px-3 py-4 text-sm text-muted">No one by that name.</li>}
            </ul>
            <div className="border-t border-line p-2">
              <Button type="button" variant="secondary" size="sm" block onClick={() => setPicking(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setPicking(true)}>
            {chosen.length ? 'Add someone else' : 'Add helpers'}
          </Button>
        )}
      </Field>

      {mode === 'finish' && (
        <Field label="Show it off (optional)" hint="A before/after or finished photo gets featured on the big screen.">
          <PhotoInput name="photo" label="Add a photo" />
        </Field>
      )}

      <Field label={mode === 'partial' ? 'Where did you leave it? (optional)' : 'Anything to note? (optional)'} htmlFor="note">
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          className={cx(inputClass, 'h-auto py-3')}
          placeholder={mode === 'partial' ? 'e.g. Sorted the top two bins, bottom shelf still to do' : 'e.g. Restocked PLA, black is running low'}
        />
      </Field>

      <Submit size="xl" block pending="Saving…">
        {mode === 'finish' ? (
          <>
            <Check className="size-6" aria-hidden /> Mark as finished
          </>
        ) : (
          <>
            <Clock className="size-6" aria-hidden /> Save my time
          </>
        )}
      </Submit>
    </form>
  );
}

// ---------------- Edit a logged entry ----------------

export function EditTimeButton({ id, minutes, note }: { id: string; minutes: number; note: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(editTime, undefined);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-accent hover:bg-surface-2">
        <Pencil className="size-3.5" aria-hidden /> Edit time
      </button>
    );
  }
  return (
    <form action={action} className="mt-2 flex w-full flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="text-sm">
        <span className="mb-1 block text-muted">Minutes</span>
        <input name="minutes" inputMode="numeric" pattern="[0-9]*" required defaultValue={minutes} className={cx(inputClass, 'h-11 w-24 text-center')} />
      </label>
      <label className="min-w-48 flex-1 text-sm">
        <span className="mb-1 block text-muted">Note</span>
        <input name="note" maxLength={500} defaultValue={note} className={cx(inputClass, 'h-11')} />
      </label>
      <Submit size="sm">Save</Submit>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {state?.error && <p className="w-full text-sm text-bad">{state.error}</p>}
      {state?.ok && <p className="w-full text-sm text-good">{state.ok}</p>}
    </form>
  );
}
