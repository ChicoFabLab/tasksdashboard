import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { discordAuthorizeUrl, discordLoginEnabled } from '@/lib/server/discord';
import { safeNext } from '@/lib/server/session';

/** Start Discord OAuth. `?link=1` connects Discord to the signed-in account instead of signing in. */
export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get('next'), '/me');
  if (!discordLoginEnabled) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, req.url));
  const mode = req.nextUrl.searchParams.get('link') === '1' ? 'link' : 'login';
  const nonce = randomBytes(18).toString('base64url');
  const res = NextResponse.redirect(discordAuthorizeUrl(nonce));
  res.cookies.set('cfl_oauth', JSON.stringify({ nonce, next, mode }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/api/auth/discord',
  });
  return res;
}
