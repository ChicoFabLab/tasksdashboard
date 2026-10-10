import { createPublicKey, verify } from 'node:crypto';
import type { RecordModel } from 'pocketbase';
import { adminPb } from '@/lib/server/pb';
import { findOrCreateDiscordVolunteer } from '@/lib/server/members';
import { assigneeIds, createTaskRecord, finishTaskRecord, loadTask } from '@/lib/server/task-ops';
import { rateLimit } from '@/lib/server/rate-limit';
import { cleanName, ZONES } from '@/lib/types';
import { absoluteUrl } from '@/lib/site-config';

/**
 * Discord slash commands (/task create | list | claim | close), delivered by
 * Discord as signed HTTP requests. Every reply is ephemeral (only the person
 * who ran the command sees it). Register the commands with
 * scripts/discord-register-commands.mjs.
 */

const EPHEMERAL = 1 << 6;
const SUPPRESS_EMBEDS = 1 << 2;

// Ed25519 public key from the Discord developer portal, wrapped as SPKI DER.
function publicKey() {
  const hex = process.env.DISCORD_PUBLIC_KEY;
  if (!hex) return null;
  return createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(hex, 'hex')]), format: 'der', type: 'spki' });
}

function isValid(body: string, sig: string | null, ts: string | null) {
  const key = publicKey();
  if (!key || !sig || !ts || !/^[0-9a-f]{128}$/i.test(sig)) return false;
  try {
    return verify(null, Buffer.from(ts + body), key, Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}

const reply = (content: string) =>
  Response.json({ type: 4, data: { content, flags: EPHEMERAL | SUPPRESS_EMBEDS, allowed_mentions: { parse: [] } } });

type Option = { name: string; type: number; value?: string | number; focused?: boolean; options?: Option[] };

function opts(sub: Option | undefined) {
  const out: Record<string, string | number | undefined> = {};
  for (const o of sub?.options ?? []) out[o.name] = o.value;
  return out;
}

const esc = (s: string) => s.replace(/([\\*_~`|>[\]()])/g, '\\$1');
const link = (t: RecordModel) => `[#${t.task_number} ${esc(t.title)}](<${absoluteUrl(`/tasks/${t.id}`)}>)`;
const mins = (m: number) => (m >= 60 ? `${Math.round((m / 60) * 10) / 10} hr` : `${m} min`);

export async function POST(req: Request) {
  const body = await req.text();
  if (!isValid(body, req.headers.get('x-signature-ed25519'), req.headers.get('x-signature-timestamp'))) {
    return new Response('invalid request signature', { status: 401 });
  }
  const i = JSON.parse(body);

  if (i.type === 1) return Response.json({ type: 1 }); // PING

  const du = i.member?.user ?? i.user;
  if (!du?.id) return reply('Couldn’t tell who you are — try again from the server.');
  const sub: Option | undefined = i.data?.options?.[0];

  // ----- Autocomplete for the "task" option -----
  if (i.type === 4) {
    const focused = sub?.options?.find((o) => o.focused);
    const q = String(focused?.value ?? '').toLowerCase().trim();
    const pb = await adminPb();
    const { rec: me } = await findOrCreateDiscordVolunteer(du);
    const tasks = await pb.collection('tasks').getList(1, 200, {
      filter: 'status != "completed" && title !~ "[ARCHIVED]%" && (board = "" || board = "main")',
      sort: '-updated',
      fields: 'id,task_number,title,assigned_to,status',
    });
    // Your claimed tasks first, then everything else; filter by number or title.
    const ranked = tasks.items
      .filter((t) => !q || String(t.task_number) === q.replace('#', '') || t.title.toLowerCase().includes(q))
      .sort((a, b) => Number(assigneeIds(b).includes(me.id)) - Number(assigneeIds(a).includes(me.id)))
      .slice(0, 25);
    return Response.json({
      type: 8,
      data: {
        choices: ranked.map((t) => ({
          name: `${assigneeIds(t).includes(me.id) ? '★ ' : ''}#${t.task_number} ${t.title}`.slice(0, 100),
          value: t.id,
        })),
      },
    });
  }

  if (i.type !== 2 || i.data?.name !== 'task') return reply('Unknown command.');
  if (!rateLimit(`discord:${du.id}`, 20, 10 * 60 * 1000)) return reply('Slow down a little — try again in a few minutes.');

  const { rec: me } = await findOrCreateDiscordVolunteer(du);
  const myName = cleanName(me);
  const o = opts(sub);
  const pb = await adminPb();

  switch (sub?.name) {
    case 'create': {
      const title = String(o.title ?? '').trim().slice(0, 120);
      const zone = String(o.zone ?? 'General');
      const minutes = Math.min(1440, Math.max(5, Number(o.minutes) || 30));
      const details = String(o.details ?? '').trim().slice(0, 1000);
      if (title.length < 3) return reply('Give the task a title of at least 3 characters.');
      if (!(ZONES as readonly string[]).includes(zone)) return reply('Pick one of the listed zones.');
      const t = await createTaskRecord({ title, description: details, zone, estimatedMinutes: minutes, createdBy: { id: me.id, name: myName } });
      return reply(`✅ Created ${link(t)} · ${zone} · ~${mins(minutes)}\nIt’s on the board now. Close it later with \`/task close\`.`);
    }

    case 'list': {
      const base = 'title !~ "[ARCHIVED]%" && (board = "" || board = "main")';
      const [mine, open] = await Promise.all([
        pb.collection('tasks').getFullList({ filter: `${base} && status != "completed" && ` + pb.filter('assigned_to.id ?= {:me}', { me: me.id }), sort: '-updated' }),
        pb.collection('tasks').getList(1, 10, { filter: `${base} && status = "open"`, sort: '-created' }),
      ]);
      const lines: string[] = [];
      lines.push(mine.length ? `**Your tasks (${mine.length})**` : '**Your tasks** — none yet. Claim one with `/task claim`.');
      for (const t of mine.slice(0, 10)) lines.push(`• ${link(t)}`);
      lines.push('', `**Open tasks** (newest ${open.items.length} of ${open.totalItems})`);
      for (const t of open.items) lines.push(`• ${link(t)} · ${esc(t.zone)}${t.estimated_minutes ? ` · ~${mins(t.estimated_minutes)}` : ''}`);
      lines.push('', `Full board: <${absoluteUrl('/tasks')}>`);
      return reply(lines.join('\n').slice(0, 1990));
    }

    case 'claim': {
      const t = await loadTask(String(o.task ?? ''));
      if (!t) return reply('Couldn’t find that task — pick one from the list as you type.');
      if (t.status === 'completed') return reply(`${link(t)} is already done.`);
      if (!assigneeIds(t).includes(me.id)) await pb.collection('tasks').update(t.id, { 'assigned_to+': me.id, status: 'in_progress' });
      return reply(`👍 ${link(t)} is yours. When you’re done: \`/task close\`.`);
    }

    case 'close': {
      const t = await loadTask(String(o.task ?? ''));
      if (!t) return reply('Couldn’t find that task — pick one from the list as you type.');
      const minutes = Math.min(1440, Math.max(1, Number(o.minutes) || Number(t.estimated_minutes) || 30));
      const result = await finishTaskRecord({ taskId: t.id, userId: me.id, minutes, note: String(o.note ?? '').trim().slice(0, 500) });
      if (!result.ok) return reply(result.error);
      return reply(`🎉 Closed ${link(t)} — ${mins(minutes)} logged to you. Thanks!`);
    }
  }
  return reply('Unknown command.');
}
