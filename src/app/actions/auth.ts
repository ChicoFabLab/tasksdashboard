'use server';

import { redirect } from 'next/navigation';
import { adminPb } from '@/lib/server/pb';
import { hashPassword, verifyPassword } from '@/lib/server/password';
import { randomBytes } from 'node:crypto';
import { endSession, getCurrentUser, safeNext, startSession } from '@/lib/server/session';
import { clientIp, rateLimit } from '@/lib/server/rate-limit';
import { text } from '@/lib/server/uploads';
import type { RecordModel } from 'pocketbase';
import { findByEmail, findByName, placeholderEmail } from '@/lib/server/members';

export type FormState = { error?: string; ok?: string; fields?: Record<string, string> } | undefined;

const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} ._'-]{1,30}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const name = text(form, 'name', 40);
  const email = text(form, 'email', 120).toLowerCase();
  const password = String(form.get('password') || '');
  const next = safeNext(text(form, 'next', 300));
  const fields = { name, email };

  if (!rateLimit(`signup:${await clientIp()}`, 8, 60 * 60 * 1000)) {
    return { error: 'Too many sign-ups from this network. Try again later.', fields };
  }
  const invite = process.env.SIGNUP_INVITE_CODE;
  if (invite && text(form, 'invite', 100) !== invite) return { error: 'That invite code isn’t right.', fields };
  if (!NAME_RE.test(name)) {
    return { error: 'Pick a display name of 2–31 letters or numbers (spaces, . _ - and \' are fine).', fields };
  }
  if (email && !EMAIL_RE.test(email)) return { error: 'That email doesn’t look right. It’s optional — you can leave it blank.', fields };
  if (password.length < 8) return { error: 'Use at least 8 characters for your password.', fields };
  if (password.length > 72) return { error: 'That password is too long (72 characters max).', fields };

  if (await findByName(name)) return { error: 'That name is taken. Try adding an initial.', fields };
  if (email && (await findByEmail(email))) {
    return { error: 'There’s already an account with that email. Try signing in instead.', fields };
  }

  const pb = await adminPb();
  const internalPw = randomBytes(24).toString('base64url');
  let rec: RecordModel;
  try {
    rec = await pb.collection('volunteers').create({
      username: name,
      email: email || placeholderEmail(),
      emailVisibility: false,
      // PocketBase auth records need a password; the app checks pw_hash instead.
      password: internalPw,
      passwordConfirm: internalPw,
      pw_hash: await hashPassword(password),
      total_minutes: 0,
      active: true,
      board: process.env.BOARD_ID || 'main',
    });
  } catch (err) {
    console.error('[signup] create failed', err);
    return { error: 'Couldn’t create your account. Please try again.', fields };
  }
  await startSession(rec.id);
  redirect(next === '/me' ? '/me?welcome=1' : next);
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const id = text(form, 'identifier', 120);
  const password = String(form.get('password') || '');
  const next = safeNext(text(form, 'next', 300));
  const fields = { identifier: id };
  const ip = await clientIp();

  if (!id || !password) return { error: 'Enter your name or email and your password.', fields };
  if (!rateLimit(`login:${ip}`, 20, 15 * 60 * 1000) || !rateLimit(`login:${ip}:${id.toLowerCase()}`, 6, 15 * 60 * 1000)) {
    return { error: 'Too many attempts. Wait a few minutes and try again.', fields };
  }

  const rec = id.includes('@') ? await findByEmail(id) : await findByName(id);
  const fail = { error: 'That name/email and password don’t match.', fields };
  if (!rec) return fail;
  if (!rec.pw_hash) {
    return {
      error: rec.discord_id
        ? 'This account signs in with Discord. Use the Discord button, then set a password from your dashboard.'
        : 'This account doesn’t have a password yet. Ask a Zone Leader to help.',
      fields,
    };
  }
  if (!(await verifyPassword(password, rec.pw_hash))) return fail;
  await startSession(rec.id);
  redirect(next);
}

export async function logout() {
  await endSession();
  redirect('/');
}

export async function setPassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/me/settings');
  const current = String(form.get('current') || '');
  const password = String(form.get('password') || '');
  if (!rateLimit(`setpw:${user.id}`, 10, 15 * 60 * 1000)) return { error: 'Too many attempts. Try again later.' };
  if (password.length < 8 || password.length > 72) return { error: 'Use 8–72 characters for your password.' };

  const pb = await adminPb();
  const rec = await pb.collection('volunteers').getOne(user.id);
  if (rec.pw_hash && !(await verifyPassword(current, rec.pw_hash))) {
    return { error: 'Your current password isn’t right.' };
  }
  await pb.collection('volunteers').update(user.id, { pw_hash: await hashPassword(password) });
  return { ok: 'Password saved. You can now sign in with your name and password.' };
}
