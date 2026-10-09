'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';
import { Check, Search, X } from 'lucide-react';
import { claimTask, finishTask, unclaimTask } from '@/app/actions/tasks';
import type { FormState } from '@/app/actions/auth';
import type { Member } from '@/lib/types';
import { Avatar, Button, Field, Notice, cx, inputClass } from './ui';
import { PhotoInput } from './photo-input';
import { Submit } from './submit';

export function ClaimButtons({ taskId, mine, status }: { taskId: string; mine: boolean; status: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<FormState>();
  const run = (fn: (id: string) => Promise<FormState>) => start(async () => setMsg(await fn(taskId)));

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
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [state, action] = useActionState(finishTask, undefined);
  const [minutes, setMinutes] = useState(estimate > 0 ? String(estimate) : '');
  const [helpers, setHelpers] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState(false);

  const others = useMemo(() => members.filter((m) => m.id !== me), [members, me]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? others.filter((m) => m.name.toLowerCase().includes(q)) : others).slice(0, 30);
  }, [others, query]);
  const chosen = others.filter((m) => helpers.includes(m.id));

  if (!open) {
    return (
      <Button size="xl" variant="dark" block onClick={() => setOpen(true)}>
        <Check className="size-6" aria-hidden /> I finished it
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <input type="hidden" name="taskId" value={taskId} />
      {helpers.map((h) => (
        <input key={h} type="hidden" name="helpers" value={h} />
      ))}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Nice! Log your time</h2>
        <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-2" aria-label="Cancel">
          <X className="size-5" />
        </button>
      </div>

      {state?.error && <Notice tone="bad">{state.error}</Notice>}

      <Field label="How long did it take?" htmlFor="minutes" hint="Minutes per person.">
        <div className="flex flex-wrap gap-2">
          {QUICK.map(([q, label]) => (
            <button
              key={q}
              type="button"
              onClick={() => setMinutes(String(q))}
              aria-pressed={minutes === String(q)}
              className={cx(
                'h-12 min-w-16 rounded-xl border px-3 text-[15px] font-semibold transition',
                minutes === String(q) ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface hover:border-ink',
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
            className={cx(inputClass, 'w-28 text-center font-semibold')}
            aria-label="Minutes"
            placeholder="min"
          />
        </div>
      </Field>

      <Field label="Did anyone help?" hint="They’ll get the same credit.">
        {chosen.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2">
            {chosen.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setHelpers((h) => h.filter((x) => x !== m.id))}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface-2 pl-1.5 pr-3 text-sm font-medium"
                >
                  <Avatar member={m} size={30} /> {m.name} <X className="size-4 text-muted" aria-label="remove" />
                </button>
              </li>
            ))}
          </ul>
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

      <Field label="Show it off (optional)" hint="A before/after or finished photo gets featured on the big screen.">
        <PhotoInput name="photo" label="Add a photo" />
      </Field>

      <Field label="Anything to note? (optional)" htmlFor="note">
        <textarea id="note" name="note" rows={3} maxLength={500} className={cx(inputClass, 'h-auto py-3')} placeholder="e.g. Restocked PLA, black is running low" />
      </Field>

      <Submit size="xl" block pending="Saving…">
        <Check className="size-6" aria-hidden /> Mark as finished
      </Submit>
    </form>
  );
}
