import 'server-only';
import { siteConfig } from '../site-config';

/**
 * Discord is optional. Everything here degrades to a no-op when it isn't
 * configured, and notification failures never block the user's action.
 */

const API = 'https://discord.com/api/v10';

export const discordLoginEnabled = Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);

export function discordRedirectUri() {
  return `${siteConfig.baseUrl.replace(/\/$/, '')}/api/auth/discord/callback`;
}

export function discordAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: discordRedirectUri(),
    response_type: 'code',
    scope: 'identify',
    state,
    prompt: 'consent',
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}

export async function exchangeDiscordCode(code: string): Promise<DiscordUser> {
  const tokenRes = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: discordRedirectUri(),
    }),
    cache: 'no-store',
  });
  if (!tokenRes.ok) {
    // Discord's error_description (e.g. "Invalid \"redirect_uri\" in request.") is safe to log and pinpoints config issues.
    const detail = await tokenRes.text().catch(() => '');
    throw new Error(`Discord token exchange failed (${tokenRes.status}) ${detail.slice(0, 200)}`);
  }
  const { access_token } = await tokenRes.json();
  const userRes = await fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: 'no-store',
  });
  if (!userRes.ok) throw new Error(`Discord user lookup failed (${userRes.status})`);
  return userRes.json();
}

const ADMIN_ROLES = (process.env.DISCORD_ADMIN_ROLES || 'Zone Leader')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

async function bot(path: string, init?: RequestInit) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    console.warn(`[discord] ${init?.method || 'GET'} ${path} -> ${res.status}`);
    return null;
  }
  return res.json();
}

/** True if the Discord user holds one of the admin roles in the lab's server. Null if unknown. */
export async function hasDiscordAdminRole(discordUserId: string): Promise<boolean | null> {
  const guild = process.env.DISCORD_GUILD_ID;
  if (!guild) return null;
  try {
    const [member, roles] = await Promise.all([
      bot(`/guilds/${guild}/members/${discordUserId}`),
      bot(`/guilds/${guild}/roles`),
    ]);
    if (!member || !Array.isArray(roles)) return null;
    const names = roles
      .filter((r: { id: string }) => member.roles?.includes(r.id))
      .map((r: { name: string }) => r.name.toLowerCase());
    return names.some((n: string) => ADMIN_ROLES.includes(n));
  } catch {
    return null;
  }
}

/** Escape Discord markdown in user-supplied text. */
function md(s: string, max = 120) {
  const clipped = s.length > max ? s.slice(0, max - 1) + '…' : s;
  return clipped.replace(/([\\*_~`|>\[\]()#-])/g, '\\$1').replace(/\s+/g, ' ');
}

/**
 * Brief one-line post to the lab's general channel. Only two things are ever
 * announced: new tasks and new creations. Never throws; never pings anyone.
 */
function post(content: string) {
  const channel = process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
  if (!channel || !process.env.DISCORD_BOT_TOKEN) return;
  void bot(`/channels/${channel}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      content,
      allowed_mentions: { parse: [] },
      flags: 1 << 2, // SUPPRESS_EMBEDS: keep it to one line, no link preview card
    }),
  }).catch(() => {});
}

function siteLink(path: string) {
  return `${siteConfig.baseUrl.replace(/\/$/, '')}${path}`;
}

export function announceNewTask(t: { id: string; title: string; zone: string; minutes: number; by: string }) {
  const time = t.minutes >= 60 ? `~${Math.round((t.minutes / 60) * 10) / 10} hr` : `~${t.minutes} min`;
  post(`🛠️ **${md(t.by, 40)}** posted a task: [${md(t.title)}](<${siteLink(`/tasks/${t.id}`)}>) · ${md(t.zone, 30)} · ${time}`);
}

export function announceNewCreation(c: { id: string; title: string; by: string }) {
  post(`✨ **${md(c.by, 40)}** shared a creation: [${md(c.title)}](<${siteLink(`/creations/${c.id}`)}>)`);
}
