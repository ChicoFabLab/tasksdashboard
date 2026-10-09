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

