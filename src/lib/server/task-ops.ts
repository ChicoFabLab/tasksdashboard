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

/** Mark a task finished and credit the user (plus optional helpers). */
export async function finishTaskRecord(input: {
  taskId: string;
  userId: string;
  minutes: number;
  note: string;
  helperIds?: string[];
  photo?: File;
}): Promise<FinishResult> {
  const pb = await adminPb();
  const task = await loadTask(input.taskId);
  if (!task) return { ok: false, error: 'That task no longer exists.' };
  if (task.status === 'completed') return { ok: false, error: 'This task was already marked finished.' };

  const helperIds = [...new Set((input.helperIds ?? []).filter((id) => ID_RE.test(id) && id !== input.userId))].slice(0, 10);
  // Only credit helpers who actually exist.
  const helpers = helperIds.length
    ? await pb.collection('volunteers').getFullList({
        filter: helperIds.map((id, i) => pb.filter(`id = {:h${i}}`, { [`h${i}`]: id })).join(' || '),
        fields: 'id',
      })
    : [];
  const team = [input.userId, ...helpers.map((h) => h.id)];

  // Mark the task done first so a double-tap can't credit twice.
  await pb.collection('tasks').update(input.taskId, { status: 'completed', assigned_to: [...new Set([...assigneeIds(task), ...team])] });

  for (const vid of team) {
    const data = new FormData();
    data.set('task', input.taskId);
    data.set('volunteer', vid);
    data.set('actual_minutes', String(input.minutes));
    data.set('completion_note', input.note);
    if (vid === input.userId && input.photo) data.set('photo', input.photo);
    await pb.collection('completions').create(data);
    await pb.collection('volunteers').update(vid, { 'total_minutes+': input.minutes });
  }
  return { ok: true, task };
}
