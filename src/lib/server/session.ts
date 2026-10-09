import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { adminPb, isNotFound } from './pb';
import { toMember, type Member } from '../types';

/**
 * Signed session cookie: base64url(payload).base64url(hmac-sha256).
 * The payload only carries the volunteer id and timestamps; everything else
 * (name, admin flag) is re-read from the database on each request, so a
 * stale or tampered cookie can never grant more than the record allows.
 */

const COOKIE = 'cfl_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET (or NEXTAUTH_SECRET) must be set');
  return s;
}

function sign(data: string) {
  return createHmac('sha256', secret()).update(data).digest('base64url');
}

type Payload = { v: string; iat: number; exp: number };

export function encodeSession(volunteerId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: Payload = { v: volunteerId, iat: now, exp: now + MAX_AGE };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined): Payload | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as Payload;
    if (typeof p.v !== 'string' || !/^[a-z0-9]{15}$/.test(p.v)) return null;
    if (p.exp < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

export async function startSession(volunteerId: string) {
  (await cookies()).set(COOKIE, encodeSession(volunteerId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  // Clear legacy cookies from the previous version (one held a superuser token).
  jar.delete('pb_auth');
  jar.delete('volunteer_session');
}

export type CurrentUser = Member & { isAdmin: boolean; hasPassword: boolean; discordLinked: boolean };

function envList(name: string) {
  return (process.env[name] || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** The signed-in volunteer, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const payload = decodeSession((await cookies()).get(COOKIE)?.value);
  if (!payload) return null;
  try {
    const pb = await adminPb();
    const rec = await pb.collection('volunteers').getOne(payload.v);
    const adminEmails = envList('ADMIN_EMAILS');
    const adminDiscord = envList('ADMIN_DISCORD_IDS');
    const isAdmin =
      rec.is_admin === true ||
      (rec.email && adminEmails.includes(String(rec.email).toLowerCase())) ||
      (rec.discord_id && adminDiscord.includes(String(rec.discord_id)));
    return {
      ...toMember(rec),
      email: rec.email || '',
      isAdmin: Boolean(isAdmin),
      hasPassword: Boolean(rec.pw_hash),
      discordLinked: Boolean(rec.discord_id),
    };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
});

/** Only allow same-site relative redirects (blocks //evil.com, javascript:, etc). */
export function safeNext(next: string | null | undefined, fallback = '/me'): string {
  if (!next || typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
