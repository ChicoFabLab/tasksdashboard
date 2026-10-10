import 'server-only';
import type { RecordModel } from 'pocketbase';
import { adminPb, isNotFound } from './pb';
import { nextTaskNumber } from './data';
import { announceNewTask } from './discord';

/**
 * Task operations shared by the website (server actions) and the Discord
 * slash commands, so both paths validate, credit and announce identically.
 */

const ID_RE = /^[a-z0-9]{15}$/;

export async function loadTask(id: string): Promise<RecordModel | null> {
  if (!ID_RE.test(id)) return null;
  try {
    return await (await adminPb()).collection('tasks').getOne(id);
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export function assigneeIds(rec: RecordModel): string[] {
  return Array.isArray(rec.assigned_to) ? rec.assigned_to : rec.assigned_to ? [rec.assigned_to] : [];
}

export async function createTaskRecord(input: {
  title: string;
  description: string;
  zone: string;
  estimatedMinutes: number;
  createdBy: { id: string; name: string };
  image?: File;
}): Promise<RecordModel> {
  const pb = await adminPb();
  const data = new FormData();
  data.set('task_number', String(await nextTaskNumber()));
  data.set('title', input.title);
  data.set('description', input.description);
  data.set('zone', input.zone);
  data.set('estimated_minutes', String(input.estimatedMinutes));
  data.set('status', 'open');
  data.set('created_by', input.createdBy.id);
  data.set('board', process.env.BOARD_ID || 'main');
  if (input.image) data.set('image', input.image);
  const rec = await pb.collection('tasks').create(data);
  announceNewTask({ id: rec.id, title: rec.title, zone: input.zone, minutes: input.estimatedMinutes, by: input.createdBy.name });
  return rec;
}

export type FinishResult = { ok: true; task: RecordModel } | { ok: false; error: string };

export interface TimeEntry {
  volunteerId: string;
  minutes: number;
}

/**
 * Log time on a task. Each person gets their own minutes (the first entry is
 * the person logging). With `finish`, the task is marked done; without it the
 * time is recorded as partial progress and the loggers step off the task so
 * someone else can pick it up.
 */
export async function logTaskTime(input: {
  taskId: string;
  userId: string;
  entries: TimeEntry[];
  note: string;
  finish: boolean;
  photo?: File;
}): Promise<FinishResult> {
  const pb = await adminPb();
  const task = await loadTask(input.taskId);
  if (!task) return { ok: false, error: 'That task no longer exists.' };
  if (task.status === 'completed') return { ok: false, error: 'This task was already marked finished.' };

  // One entry per person, the logger first; ignore malformed ids and bad minutes.
  const seen = new Set<string>();
  const entries = input.entries.filter((e) => {
    if (!ID_RE.test(e.volunteerId) || seen.has(e.volunteerId)) return false;
    if (!Number.isInteger(e.minutes) || e.minutes < 1 || e.minutes > 24 * 60) return false;
    seen.add(e.volunteerId);
    return true;
  });
  if (!entries.length || entries[0].volunteerId !== input.userId) return { ok: false, error: 'Enter your own time first.' };
  if (entries.length > 11) return { ok: false, error: 'That’s a big crew — log up to 10 helpers at once.' };

  // Only credit people who actually exist.
  const others = entries.slice(1);
  const known = others.length
    ? new Set(
        (
          await pb.collection('volunteers').getFullList({
            filter: others.map((e, i) => pb.filter(`id = {:h${i}}`, { [`h${i}`]: e.volunteerId })).join(' || '),
            fields: 'id',
          })
        ).map((v) => v.id),
      )
    : new Set<string>();
  const team = entries.filter((e, i) => i === 0 || known.has(e.volunteerId));
  const teamIds = team.map((e) => e.volunteerId);

  if (input.finish) {
    // Mark the task done first so a double-tap can't credit twice.
    await pb.collection('tasks').update(input.taskId, { status: 'completed', assigned_to: [...new Set([...assigneeIds(task), ...teamIds])] });
  } else {
    // "I have to go": step off the task so it's clearly available again.
    const remaining = assigneeIds(task).filter((id) => !teamIds.includes(id));
    await pb.collection('tasks').update(input.taskId, { assigned_to: remaining, status: remaining.length ? 'in_progress' : 'open' });
  }

  for (const e of team) {
    const data = new FormData();
    data.set('task', input.taskId);
    data.set('volunteer', e.volunteerId);
    data.set('actual_minutes', String(e.minutes));
    data.set('completion_note', input.note);
    data.set('partial', String(!input.finish));
    if (e.volunteerId === input.userId && input.photo) data.set('photo', input.photo);
    await pb.collection('completions').create(data);
    await pb.collection('volunteers').update(e.volunteerId, { 'total_minutes+': e.minutes });
  }
  return { ok: true, task };
}

/** Mark a task finished and credit the user (plus optional helpers, same minutes each). */
export async function finishTaskRecord(input: {
  taskId: string;
  userId: string;
  minutes: number;
  note: string;
  helperIds?: string[];
  photo?: File;
}): Promise<FinishResult> {
  return logTaskTime({
    taskId: input.taskId,
    userId: input.userId,
    entries: [input.userId, ...(input.helperIds ?? [])].map((volunteerId) => ({ volunteerId, minutes: input.minutes })),
    note: input.note,
    finish: true,
    photo: input.photo,
  });
}

/** Change the minutes/note on a logged entry (owner or admin). Keeps total_minutes in step. */
export async function editTimeEntry(input: { completionId: string; actor: { id: string; isAdmin: boolean }; minutes: number; note: string }) {
  if (!ID_RE.test(input.completionId)) return { ok: false as const, error: 'Unknown entry.' };
  if (!Number.isInteger(input.minutes) || input.minutes < 1 || input.minutes > 24 * 60) return { ok: false as const, error: 'Minutes must be between 1 and 1440.' };
  const pb = await adminPb();
  let c: RecordModel;
  try {
    c = await pb.collection('completions').getOne(input.completionId);
  } catch (err) {
    if (isNotFound(err)) return { ok: false as const, error: 'That entry no longer exists.' };
    throw err;
  }
  if (c.volunteer !== input.actor.id && !input.actor.isAdmin) return { ok: false as const, error: 'You can only change your own time.' };
  const delta = input.minutes - (Number(c.actual_minutes) || 0);
  await pb.collection('completions').update(c.id, { actual_minutes: input.minutes, completion_note: input.note });
  if (delta) await pb.collection('volunteers').update(c.volunteer, { 'total_minutes+': delta });
  return { ok: true as const, taskId: c.task as string };
}
