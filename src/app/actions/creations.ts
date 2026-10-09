'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminPb, isNotFound } from '@/lib/server/pb';
import { getCurrentUser } from '@/lib/server/session';
import { announce } from '@/lib/server/discord';
import { readImages, text } from '@/lib/server/uploads';
import { rateLimit } from '@/lib/server/rate-limit';
import { absoluteUrl } from '@/lib/site-config';
import { fileUrl } from '@/lib/files';
import type { FormState } from './auth';

const ID_RE = /^[a-z0-9]{15}$/;

export async function createCreation(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/creations/new');
  if (!rateLimit(`creation:${user.id}`, 20, 60 * 60 * 1000)) return { error: 'Lots of sharing! Try again in a bit.' };

  const title = text(form, 'title', 100);
  const description = text(form, 'description', 3000);
  if (title.length < 2) return { error: 'Give it a name.' };
  const { files, error } = readImages(form, 'photos', 6);
  if (error) return { error };
  if (files.length === 0) return { error: 'Add at least one photo — that’s the best part.' };

  const data = new FormData();
  data.set('volunteer', user.id);
  data.set('title', title);
  // The original schema required a description; keep a readable fallback.
  data.set('description', description || ' ');
  data.set('board', process.env.BOARD_ID || 'main');
  for (const f of files) data.append('photos', f);

  const rec = await (await adminPb()).collection('creations').create(data);
  const photos: string[] = rec.photos || [];
  announce({
    title: `✨ ${user.name} shared “${title}”`,
    description: description || undefined,
    url: absoluteUrl(`/creations/${rec.id}`),
    image: photos[0] ? fileUrl('creations', rec.id, photos[0]) : null,
  });
  revalidatePath('/', 'layout');
  redirect(`/creations/${rec.id}?shared=1`);
}

async function loadOwned(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/creations/${id}`);
  if (!ID_RE.test(id)) return null;
  try {
    const rec = await (await adminPb()).collection('creations').getOne(id);
    if (rec.volunteer !== user.id && !user.isAdmin) return null;
    return { rec, user };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function updateCreation(_: FormState, form: FormData): Promise<FormState> {
  const id = text(form, 'id', 20);
  const owned = await loadOwned(id);
  if (!owned) return { error: 'You can only edit your own creations.' };
  const title = text(form, 'title', 100);
  const description = text(form, 'description', 3000);
  if (title.length < 2) return { error: 'Give it a name.' };
  await (await adminPb()).collection('creations').update(id, { title, description: description || ' ' });
  revalidatePath('/', 'layout');
  redirect(`/creations/${id}`);
}

export async function deleteCreation(id: string): Promise<FormState> {
  const owned = await loadOwned(id);
  if (!owned) return { error: 'You can only remove your own creations.' };
  await (await adminPb()).collection('creations').delete(id);
  revalidatePath('/', 'layout');
  redirect('/creations');
}

export async function toggleFeatured(id: string): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user?.isAdmin || !ID_RE.test(id)) return { error: 'Admins only.' };
  const pb = await adminPb();
  const rec = await pb.collection('creations').getOne(id, { fields: 'id,featured' });
  await pb.collection('creations').update(id, { featured: !rec.featured });
  revalidatePath('/', 'layout');
  return { ok: rec.featured ? 'Removed from featured.' : 'Featured!' };
}
