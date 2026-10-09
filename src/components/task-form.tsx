'use client';

import { useActionState, useState, useTransition } from 'react';
import { createTask, deleteTask, updateTask } from '@/app/actions/tasks';
import type { FormState } from '@/app/actions/auth';
import { ZONES, type Task } from '@/lib/types';
import { zoneColor } from '@/lib/format';
import { Button, Field, Notice, cx, inputClass } from './ui';
import { PhotoInput } from './photo-input';
import { Submit } from './submit';

export function TaskForm({ task, isAdmin }: { task?: Task; isAdmin?: boolean }) {
  const [state, action] = useActionState(task ? updateTask : createTask, undefined);
  const [zone, setZone] = useState<string>(task?.zone ?? 'General');
  const [del, setDel] = useState<FormState>();
  const [deleting, startDelete] = useTransition();

  return (
    <form action={action} className="space-y-7">
      {task && <input type="hidden" name="taskId" value={task.id} />}
      <input type="hidden" name="zone" value={zone} />
      {state?.error && <Notice tone="bad">{state.error}</Notice>}

      <Field label="What needs doing?" htmlFor="title">
        <input id="title" name="title" required minLength={3} maxLength={120} defaultValue={task?.title} className={cx(inputClass, 'h-14 text-lg')} placeholder="e.g. Empty the laser cutter crumb tray" />
      </Field>

      <Field label="Zone">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Zone">
          {ZONES.map((z) => (
            <button
              key={z}
              type="button"
              role="radio"
              aria-checked={zone === z}
              onClick={() => setZone(z)}
              className={cx(
                'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-medium transition',
                zone === z ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface hover:border-ink',
              )}
            >
              <span className="size-2.5 rounded-full" style={{ background: zoneColor(z) }} aria-hidden />
              {z}
            </button>
          ))}
        </div>
      </Field>

      <Field label="About how long? (minutes)" htmlFor="estimated_minutes">
        <input id="estimated_minutes" name="estimated_minutes" inputMode="numeric" pattern="[0-9]*" required defaultValue={task?.estimatedMinutes || 30} className={cx(inputClass, 'w-32')} />
      </Field>

      <Field label="Details (optional)" htmlFor="description" hint="Where things are, what “done” looks like, safety notes.">
        <textarea id="description" name="description" rows={5} maxLength={3000} defaultValue={task?.description} className={cx(inputClass, 'h-auto py-3')} />
      </Field>

      <Field label="Photo (optional)">
        <PhotoInput name="image" existing={task?.image} label="Add a reference photo" />
        {task?.image && (
          <label className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="remove_image" className="size-4" /> Remove current photo
          </label>
        )}
      </Field>

      {task && isAdmin && (
        <Field label="Status" htmlFor="status" hint="Setting a task back to Open clears who’s on it.">
          <select id="status" name="status" defaultValue={task.status} className={cx(inputClass, 'w-56')}>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Done</option>
          </select>
        </Field>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <Submit size="lg" pending={task ? 'Saving…' : 'Posting…'}>
          {task ? 'Save changes' : 'Post task'}
        </Submit>
        {task && (
          <Button
            type="button"
            variant="danger"
            size="lg"
            disabled={deleting}
            className="ml-auto"
            onClick={() => {
              if (confirm('Delete this task? This can’t be undone.')) startDelete(async () => setDel(await deleteTask(task.id)));
            }}
          >
            {deleting ? 'Deleting…' : 'Delete task'}
          </Button>
        )}
      </div>
      {del?.error && <Notice tone="bad">{del.error}</Notice>}
    </form>
  );
}
