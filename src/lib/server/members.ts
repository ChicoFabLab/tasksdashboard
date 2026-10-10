import 'server-only';
import { randomBytes } from 'node:crypto';
import type { RecordModel } from 'pocketbase';
import { adminPb, isNotFound } from './pb';

export async function findByName(name: string): Promise<RecordModel | null> {
  const pb = await adminPb();
  try {
    return await pb
      .collection('volunteers')
      .getFirstListItem(pb.filter('username:lower = {:n}', { n: name.toLowerCase() }));
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function findByEmail(email: string): Promise<RecordModel | null> {
  const pb = await adminPb();
  try {
    return await pb.collection('volunteers').getFirstListItem(pb.filter('email:lower = {:e}', { e: email.toLowerCase() }));
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

/** Unique placeholder for accounts created without an email (PocketBase auth needs one). */
export function placeholderEmail() {
  return `member-${randomBytes(6).toString('hex')}@no-email.invalid`;
}


async function uniqueName(base: string): Promise<string> {
  const clean = base.replace(/[^\p{L}\p{N} ._'-]/gu, '').trim().slice(0, 26) || 'Maker';
  const padded = clean.length < 2 ? `${clean}_maker` : clean;
  if (!(await findByName(padded))) return padded;
  for (let i = 2; i < 50; i++) if (!(await findByName(`${padded} ${i}`))) return `${padded} ${i}`;
  return `${padded} ${randomBytes(2).toString('hex')}`;
}

/** The member linked to a Discord account, creating one on first contact. */
export async function findOrCreateDiscordVolunteer(du: {
  id: string;
  username: string;
  global_name?: string | null;
}): Promise<{ rec: RecordModel; isNew: boolean }> {
  const pb = await adminPb();
  const matches = await pb.collection('volunteers').getFullList({
    filter: pb.filter('discord_id = {:d}', { d: du.id }),
    sort: 'id', // volunteers has no 'created' field
  });
  if (matches[0]) {
    if (matches[0].discord_username !== du.username) {
      await pb.collection('volunteers').update(matches[0].id, { discord_username: du.username });
    }
    return { rec: matches[0], isNew: false };
  }
  try {
    const byEmail = await pb.collection('volunteers').getFirstListItem(pb.filter('email = {:e}', { e: `${du.id}@discord.user` }));
    await pb.collection('volunteers').update(byEmail.id, { discord_id: du.id });
    return { rec: byEmail, isNew: false };
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }
  const pw = randomBytes(24).toString('base64url');
  const rec = await pb.collection('volunteers').create({
    username: await uniqueName(du.global_name || du.username),
    discord_id: du.id,
    discord_username: du.username,
    email: `${du.id}@discord.user`,
    emailVisibility: false,
    password: pw,
    passwordConfirm: pw,
    total_minutes: 0,
    active: true,
    board: process.env.BOARD_ID || 'main',
  });
  return { rec, isNew: true };
}
