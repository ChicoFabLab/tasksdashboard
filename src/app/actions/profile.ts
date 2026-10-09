'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminPb } from '@/lib/server/pb';
import { getCurrentUser } from '@/lib/server/session';
import { findByName } from '@/lib/server/members';
import { readImages, text } from '@/lib/server/uploads';
import type { FormState } from './auth';

const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} ._'-]{1,30}$/u;

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/me/settings');
  const name = text(form, 'name', 40);
  if (!NAME_RE.test(name)) return { error: 'Display names are 2–31 letters or numbers.' };
  const existing = await findByName(name);
  if (existing && existing.id !== user.id) return { error: 'That name is taken.' };
  const { files, error } = readImages(form, 'photo', 1);
  if (error) return { error };

  const data = new FormData();
  data.set('username', name);
  if (files[0]) data.set('profile_photo', files[0]);
  else if (form.get('remove_photo') === 'on') data.set('profile_photo', '');
  await (await adminPb()).collection('volunteers').update(user.id, data);
  revalidatePath('/', 'layout');
  return { ok: 'Profile saved.' };
}

export async function unlinkDiscord(): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/me/settings');
  if (!user.hasPassword) return { error: 'Set a password first so you can still sign in.' };
  await (await adminPb()).collection('volunteers').update(user.id, { discord_id: '', discord_username: '' });
  revalidatePath('/me/settings');
  return { ok: 'Discord disconnected.' };
}
