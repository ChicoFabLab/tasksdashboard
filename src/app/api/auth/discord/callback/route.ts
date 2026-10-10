import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { RecordModel } from 'pocketbase';
import { adminPb, isNotFound } from '@/lib/server/pb';
import { exchangeDiscordCode, hasDiscordAdminRole } from '@/lib/server/discord';
import { getCurrentUser, safeNext, startSession } from '@/lib/server/session';
import { findByName } from '@/lib/server/members';
import { siteConfig } from '@/lib/site-config';

function to(path: string) {
  // Build from the configured public URL: behind the tunnel req.url is the internal host.
  const res = NextResponse.redirect(`${siteConfig.baseUrl.replace(/\/$/, '')}${path}`);
  res.cookies.delete({ name: 'cfl_oauth', path: '/api/auth/discord' });
  return res;
}

async function uniqueName(base: string): Promise<string> {
  const clean = base.replace(/[^\p{L}\p{N} ._'-]/gu, '').trim().slice(0, 26) || 'Maker';
  const padded = clean.length < 2 ? `${clean}_maker` : clean;
  if (!(await findByName(padded))) return padded;
  for (let i = 2; i < 50; i++) if (!(await findByName(`${padded} ${i}`))) return `${padded} ${i}`;
  return `${padded} ${randomBytes(2).toString('hex')}`;
}

export async function GET(req: NextRequest) {
  let saved: { nonce?: string; next?: string; mode?: string } = {};
  try {
    saved = JSON.parse(req.cookies.get('cfl_oauth')?.value || '{}');
  } catch {}
  const next = safeNext(saved.next, '/me');
  const errorPath = saved.mode === 'link' ? '/me/settings?error=' : `/login?next=${encodeURIComponent(next)}&error=`;

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  if (!code) return to(errorPath + 'discord');
  if (!saved.nonce || state !== saved.nonce) return to(errorPath + 'state');

  let du;
  try {
    du = await exchangeDiscordCode(code);
  } catch (err) {
    console.error('[discord] oauth failed:', (err as Error).message);
    return to(errorPath + 'discord');
  }

  const pb = await adminPb();
  const matches = await pb.collection('volunteers').getFullList({
    // volunteers has no `created` field; ids are time-ordered, so sort by id for "oldest first".
    filter: pb.filter('discord_id = {:d}', { d: du.id }),
    sort: 'id',
  });

  // ----- Link Discord to the signed-in account -----
  if (saved.mode === 'link') {
    const user = await getCurrentUser();
    if (!user) return to('/login?next=/me/settings');
    if (matches.some((m) => m.id !== user.id)) return to('/me/settings?error=discord_taken');
    await pb.collection('volunteers').update(user.id, { discord_id: du.id, discord_username: du.username });
    return to('/me/settings?linked=1');
  }

  // ----- Sign in (or sign up) with Discord -----
  let found: RecordModel | null = matches[0] ?? null;
  let isNew = false;
  if (!found) {
    try {
      const byEmail = await pb.collection('volunteers').getFirstListItem(pb.filter('email = {:e}', { e: `${du.id}@discord.user` }));
      await pb.collection('volunteers').update(byEmail.id, { discord_id: du.id });
      found = byEmail;
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }
  }
  let rec: RecordModel;
  if (found) {
    rec = found;
    if (rec.discord_username !== du.username) {
      await pb.collection('volunteers').update(rec.id, { discord_username: du.username });
    }
  } else {
    const pw = randomBytes(24).toString('base64url');
    rec = await pb.collection('volunteers').create({
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
    isNew = true;
  }

  // Zone Leaders on Discord become admins here. (Removal is manual, from /admin.)
  if (!rec.is_admin && (await hasDiscordAdminRole(du.id))) {
    await pb.collection('volunteers').update(rec.id, { is_admin: true });
  }

  await startSession(rec.id);
  return to(isNew && next === '/me' ? '/me?welcome=1' : next);
}
