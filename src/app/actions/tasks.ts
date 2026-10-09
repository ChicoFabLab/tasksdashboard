'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { RecordModel } from 'pocketbase';
import { adminPb, isNotFound } from '@/lib/server/pb';
import { getCurrentUser, type CurrentUser } from '@/lib/server/session';
import { nextTaskNumber } from '@/lib/server/data';
import { announce } from '@/lib/server/discord';
import { int, readImages, text } from '@/lib/server/uploads';
import { rateLimit } from '@/lib/server/rate-limit';
import { absoluteUrl } from '@/lib/site-config';
import { ZONES } from '@/lib/types';
import { fileUrl } from '@/lib/files';
import type { FormState } from './auth';

const ID_RE = /^[a-z0-9]{15}$/;

async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

async function loadTask(id: string): Promise<RecordModel | null> {
  if (!ID_RE.test(id)) return null;
  try {
    return await (await adminPb()).collection('tasks').getOne(id);
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

function refresh(taskId?: string) {
  revalidatePath('/', 'layout');
  if (taskId) revalidatePath(`/tasks/${taskId}`);
}

function assigneeIds(rec: RecordModel): string[] {
  return Array.isArray(rec.assigned_to) ? rec.assigned_to : rec.assigned_to ? [rec.assigned_to] : [];
}

export async function claimTask(taskId: string): Promise<FormState> {
  const user = await requireUser(`/tasks/${taskId}`);
  const task = await loadTask(taskId);
  if (!task) return { error: 'That task no longer exists.' };
  if (task.status === 'completed') return { error: 'Someone already finished this one.' };
  if (!assigneeIds(task).includes(user.id)) {
    await (await adminPb()).collection('tasks').update(taskId, { 'assigned_to+': user.id, status: 'in_progress' });
  }
  refresh(taskId);
  return { ok: 'It’s yours.' };
}

export async function unclaimTask(taskId: string): Promise<FormState> {
  const user = await requireUser(`/tasks/${taskId}`);
  const task = await loadTask(taskId);
  if (!task) return { error: 'That task no longer exists.' };
  if (task.status === 'completed') return { error: 'This task is already finished.' };
  const remaining = assigneeIds(task).filter((id) => id !== user.id);
  await (await adminPb())
    .collection('tasks')
    .update(taskId, { 'assigned_to-': user.id, status: remaining.length ? 'in_progress' : 'open' });
  refresh(taskId);
  return { ok: 'Released. It’s back on the board.' };
}

export async function finishTask(_: FormState, form: FormData): Promise<FormState> {
  const taskId = text(form, 'taskId', 20);
  const user = await requireUser(`/tasks/${taskId}`);
  if (!rateLimit(`finish:${user.id}`, 30, 60 * 60 * 1000)) return { error: 'Slow down a little — try again shortly.' };

  const minutes = int(form, 'minutes', 1, 24 * 60);
  if (minutes === null) return { error: 'How long did it take? Enter minutes between 1 and 1440.' };
  const note = text(form, 'note', 500);
  const { files, error } = readImages(form, 'photo', 1);
  if (error) return { error };

  const helperIds = [
    ...new Set(
      form
        .getAll('helpers')
        .map(String)
        .filter((id) => ID_RE.test(id) && id !== user.id),
    ),
  ].slice(0, 10);

  const pb = await adminPb();
  const task = await loadTask(taskId);
  if (!task) return { error: 'That task no longer exists.' };
  if (task.status === 'completed') return { error: 'This task was already marked finished.' };

  // Only credit helpers who actually exist.
  const helpers = helperIds.length
    ? await pb.collection('volunteers').getFullList({
        filter: helperIds.map((id, i) => pb.filter(`id = {:h${i}}`, { [`h${i}`]: id })).join(' || '),
        fields: 'id,username,discord_username',
      })
    : [];
  const team = [user.id, ...helpers.map((h) => h.id)];

  // Mark the task done first so a double-tap can't credit twice.
  await pb.collection('tasks').update(taskId, { status: 'completed', assigned_to: [...new Set([...assigneeIds(task), ...team])] });

  let photoUrl: string | null = null;
  for (const vid of team) {
    const data = new FormData();
    data.set('task', taskId);
    data.set('volunteer', vid);
    data.set('actual_minutes', String(minutes));
    data.set('completion_note', note);
    if (vid === user.id && files[0]) data.set('photo', files[0]);
    const rec = await pb.collection('completions').create(data);
    if (rec.photo) photoUrl = fileUrl('completions', rec.id, rec.photo);
    await pb.collection('volunteers').update(vid, { 'total_minutes+': minutes });
  }

  const names = [user.name, ...helpers.map((h) => h.username || h.discord_username || 'a friend')];
  announce({
    title: `✅ #${task.task_number} ${task.title}`,
    description: note || undefined,
    url: absoluteUrl(`/tasks/${taskId}`),
    fields: [
      { name: 'Finished by', value: names.join(', '), inline: true },
      { name: 'Time', value: `${minutes} min${team.length > 1 ? ' each' : ''}`, inline: true },
    ],
    image: photoUrl,
  });

  refresh(taskId);
  redirect(`/tasks/${taskId}?done=1`);
}

function readTaskFields(form: FormData) {
  const title = text(form, 'title', 120);
  const description = text(form, 'description', 3000);
  const zone = text(form, 'zone', 40);
  const estimated = int(form, 'estimated_minutes', 5, 24 * 60);
  if (title.length < 3) return { error: 'Give the task a short title (3+ characters).' } as const;
  if (!(ZONES as readonly string[]).includes(zone)) return { error: 'Pick a zone.' } as const;
  if (estimated === null) return { error: 'Estimate the time in minutes (5–1440).' } as const;
  return { title, description, zone, estimated_minutes: estimated } as const;
}

export async function createTask(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser('/tasks/new');
  if (!rateLimit(`create-task:${user.id}`, 30, 60 * 60 * 1000)) return { error: 'That’s a lot of tasks! Try again later.' };
  const fields = readTaskFields(form);
  if ('error' in fields) return { error: fields.error };
  const { files, error } = readImages(form, 'image', 1);
  if (error) return { error };

  const pb = await adminPb();
  const data = new FormData();
  data.set('task_number', String(await nextTaskNumber()));
  data.set('title', fields.title);
  data.set('description', fields.description);
  data.set('zone', fields.zone);
  data.set('estimated_minutes', String(fields.estimated_minutes));
  data.set('status', 'open');
  data.set('created_by', user.id);
  data.set('board', process.env.BOARD_ID || 'main');
  if (files[0]) data.set('image', files[0]);
  const rec = await pb.collection('tasks').create(data);

  announce({
    title: `🛠️ New task #${rec.task_number}: ${rec.title}`,
    description: fields.description || undefined,
    url: absoluteUrl(`/tasks/${rec.id}`),
    fields: [
      { name: 'Zone', value: fields.zone, inline: true },
      { name: 'Estimate', value: `${fields.estimated_minutes} min`, inline: true },
    ],
  });
  refresh();
  redirect(`/tasks/${rec.id}?created=1`);
}

async function requireTaskEditor(taskId: string) {
  const user = await requireUser(`/tasks/${taskId}/edit`);
  const task = await loadTask(taskId);
  if (!task) redirect('/tasks');
  if (!user.isAdmin && task.created_by !== user.id) redirect(`/tasks/${taskId}`);
  return { user, task };
}

export async function updateTask(_: FormState, form: FormData): Promise<FormState> {
  const taskId = text(form, 'taskId', 20);
  const { user } = await requireTaskEditor(taskId);
  const fields = readTaskFields(form);
  if ('error' in fields) return { error: fields.error };
  const { files, error } = readImages(form, 'image', 1);
  if (error) return { error };

  const data = new FormData();
  data.set('title', fields.title);
  data.set('description', fields.description);
  data.set('zone', fields.zone);
  data.set('estimated_minutes', String(fields.estimated_minutes));
  if (files[0]) data.set('image', files[0]);
  else if (form.get('remove_image') === 'on') data.set('image', '');
  const status = text(form, 'status', 20);
  if (user.isAdmin && ['open', 'in_progress', 'completed'].includes(status)) {
    data.set('status', status);
    if (status === 'open') data.set('assigned_to', '');
  }
  await (await adminPb()).collection('tasks').update(taskId, data);
  refresh(taskId);
  redirect(`/tasks/${taskId}`);
}

export async function deleteTask(taskId: string): Promise<FormState> {
  const { user } = await requireTaskEditor(taskId);
  const pb = await adminPb();
  const done = await pb.collection('completions').getList(1, 1, { filter: pb.filter('task = {:t}', { t: taskId }) });
  if (done.totalItems > 0 && !user.isAdmin) {
    return { error: 'People have logged time on this task, so only an admin can remove it.' };
  }
  if (done.totalItems > 0) return { error: 'This task has logged completions. Reopen or edit it instead of deleting history.' };
  await pb.collection('tasks').delete(taskId);
  refresh();
  redirect('/tasks');
}
