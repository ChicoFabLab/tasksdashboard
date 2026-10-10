'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminPb } from '@/lib/server/pb';
import { getCurrentUser, type CurrentUser } from '@/lib/server/session';
import { assigneeIds, createTaskRecord, finishTaskRecord, loadTask } from '@/lib/server/task-ops';
import { int, readImages, text } from '@/lib/server/uploads';
import { rateLimit } from '@/lib/server/rate-limit';
import { ZONES } from '@/lib/types';
import type { FormState } from './auth';


async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

function refresh(taskId?: string) {
  revalidatePath('/', 'layout');
  if (taskId) revalidatePath(`/tasks/${taskId}`);
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

  const result = await finishTaskRecord({
    taskId,
    userId: user.id,
    minutes,
    note,
    helperIds: form.getAll('helpers').map(String),
    photo: files[0],
  });
  if (!result.ok) return { error: result.error };

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

  const rec = await createTaskRecord({
    title: fields.title,
    description: fields.description,
    zone: fields.zone,
    estimatedMinutes: fields.estimated_minutes,
    createdBy: { id: user.id, name: user.name },
    image: files[0],
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
