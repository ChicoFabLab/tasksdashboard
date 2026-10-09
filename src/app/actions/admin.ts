'use server';

import { revalidatePath } from 'next/cache';
import { adminPb } from '@/lib/server/pb';
import { getCurrentUser } from '@/lib/server/session';
import { hashPassword } from '@/lib/server/password';
import { randomInt } from 'node:crypto';
import type { FormState } from './auth';

const ID_RE = /^[a-z0-9]{15}$/;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error('Admins only');
  return user;
}

export async function setAdmin(volunteerId: string, value: boolean): Promise<FormState> {
  const me = await requireAdmin();
  if (!ID_RE.test(volunteerId)) return { error: 'Unknown member.' };
  if (volunteerId === me.id && !value) return { error: 'You can’t remove your own admin access.' };
  await (await adminPb()).collection('volunteers').update(volunteerId, { is_admin: value });
  revalidatePath('/admin');
  return { ok: value ? 'Admin granted.' : 'Admin removed.' };
}

export async function deleteCompletion(completionId: string): Promise<FormState> {
  await requireAdmin();
  if (!ID_RE.test(completionId)) return { error: 'Unknown entry.' };
  const pb = await adminPb();
  const c = await pb.collection('completions').getOne(completionId);
  await pb.collection('completions').delete(completionId);
  if (c.volunteer) {
    const v = await pb.collection('volunteers').getOne(c.volunteer, { fields: 'id,total_minutes' });
    await pb.collection('volunteers').update(c.volunteer, {
      total_minutes: Math.max(0, (Number(v.total_minutes) || 0) - (Number(c.actual_minutes) || 0)),
    });
  }
  revalidatePath('/', 'layout');
  return { ok: 'Entry removed.' };
}

export async function reopenTask(taskId: string): Promise<FormState> {
  await requireAdmin();
  if (!ID_RE.test(taskId)) return { error: 'Unknown task.' };
  await (await adminPb()).collection('tasks').update(taskId, { status: 'open', assigned_to: [] });
  revalidatePath('/', 'layout');
  return { ok: 'Task reopened.' };
}

/** Give a member a one-off password to sign in with (they can change it in Settings). */
export async function setTempPassword(volunteerId: string): Promise<FormState> {
  await requireAdmin();
  if (!ID_RE.test(volunteerId)) return { error: 'Unknown member.' };
  const words = ['drill', 'lathe', 'laser', 'solder', 'clamp', 'router', 'chisel', 'vise', 'anvil', 'spool', 'joint', 'bevel'];
  const temp = `${words[randomInt(words.length)]}-${words[randomInt(words.length)]}-${randomInt(100, 1000)}`;
  await (await adminPb()).collection('volunteers').update(volunteerId, { pw_hash: await hashPassword(temp) });
  revalidatePath('/admin');
  return { ok: `Temporary password: ${temp}` };
}
