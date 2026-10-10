#!/usr/bin/env node
/**
 * Fill in missing display names from Discord for members who have a discord_id
 * but an empty username and/or discord_username. Only empty fields are written.
 *
 *   PB_URL=... PB_EMAIL=... PB_PASSWORD=... DISCORD_BOT_TOKEN=... node scripts/pb-backfill-discord-names.mjs [--dry-run]
 */
import PocketBase from 'pocketbase';

const dry = process.argv.includes('--dry-run');
const pb = new PocketBase(process.env.PB_URL || 'http://127.0.0.1:8091');
pb.autoCancellation(false);
await pb.collection('_superusers').authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

const all = await pb.collection('volunteers').getFullList({ fields: 'id,username,discord_username,discord_id' });
const taken = new Set(all.map((v) => (v.username || '').toLowerCase()).filter(Boolean));
const todo = all.filter((v) => v.discord_id && (!v.username || !v.discord_username));

function clean(name) {
  const c = String(name || '').replace(/[^\p{L}\p{N} ._'-]/gu, '').trim().slice(0, 26);
  return c.length >= 2 ? c : '';
}

let changed = 0;
for (const v of todo) {
  const res = await fetch(`https://discord.com/api/v10/users/${v.discord_id}`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
  if (!res.ok) {
    console.log(`${v.id}: Discord lookup failed (${res.status})`);
    continue;
  }
  const du = await res.json();
  const patch = {};
  if (!v.discord_username && du.username) patch.discord_username = du.username;
  if (!v.username) {
    let name = clean(du.global_name) || clean(du.username);
    if (name) {
      let candidate = name;
      for (let i = 2; taken.has(candidate.toLowerCase()); i++) candidate = `${name} ${i}`;
      patch.username = candidate;
      taken.add(candidate.toLowerCase());
    }
  }
  if (!Object.keys(patch).length) continue;
  console.log(`${v.id}: ${JSON.stringify(patch)}${dry ? ' (dry run)' : ''}`);
  if (!dry) await pb.collection('volunteers').update(v.id, patch);
  changed++;
  await new Promise((r) => setTimeout(r, 300)); // be gentle with Discord's rate limits
}
console.log(`${changed} member(s) ${dry ? 'would be' : ''} updated.`);
