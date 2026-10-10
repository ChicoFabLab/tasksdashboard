#!/usr/bin/env node
/**
 * 2026 redesign — PocketBase changes. Additive and idempotent; safe to re-run.
 *
 *   PB_URL=http://127.0.0.1:8091 PB_EMAIL=... PB_PASSWORD=... node scripts/pb-migrate-2026.mjs [--dry-run]
 *
 * 1. Saves a JSON snapshot of every collection to ./pb-snapshot-<timestamp>.json (used by pb-rollback-2026.mjs).
 * 2. Adds optional fields: volunteers.is_admin, volunteers.pw_hash (hidden), completions.photo, completions.partial,
 *    creations.featured, creations.board; image limits + thumbnail sizes on file fields;
 *    makes creations.description optional.
 * 3. Locks API rules: public read for tasks/completions/creations, server-only writes everywhere,
 *    volunteers readable only by themselves, PocketBase password login disabled for volunteers
 *    (the app verifies passwords itself, with rate limiting).
 * 4. Hides every volunteer's email from the public API (emailVisibility=false).
 *
 * Never deletes records or fields.
 */
import PocketBase from 'pocketbase';
import { writeFileSync } from 'node:fs';

const dry = process.argv.includes('--dry-run');
const pb = new PocketBase(process.env.PB_URL || 'http://127.0.0.1:8091');
pb.autoCancellation(false);
await pb.collection('_superusers').authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

const all = await pb.collections.getFullList();
const snapshotFile = `pb-snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
writeFileSync(snapshotFile, JSON.stringify(all, null, 2));
console.log(`Snapshot saved: ${snapshotFile}`);

const IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MB = 1024 * 1024;

function ensureField(col, def) {
  const existing = col.fields.find((f) => f.name === def.name);
  if (existing) {
    Object.assign(existing, def, { id: existing.id });
    return `~ ${col.name}.${def.name}`;
  }
  col.fields.push(def);
  return `+ ${col.name}.${def.name}`;
}

const byName = Object.fromEntries(all.map((c) => [c.name, structuredClone(c)]));
const log = [];

// --- volunteers ---
{
  const c = byName.volunteers;
  log.push(ensureField(c, { name: 'is_admin', type: 'bool', required: false, hidden: false }));
  log.push(ensureField(c, { name: 'pw_hash', type: 'text', required: false, hidden: true, max: 300 }));
  const photo = c.fields.find((f) => f.name === 'profile_photo');
  if (photo) Object.assign(photo, { maxSelect: 1, maxSize: 10 * MB, mimeTypes: IMAGE, thumbs: ['160x160', '400x400'] });
  c.listRule = 'id = @request.auth.id';
  c.viewRule = 'id = @request.auth.id';
  c.createRule = null;
  c.updateRule = null;
  c.deleteRule = null;
  c.passwordAuth = { ...(c.passwordAuth || {}), enabled: false };
}
// --- completions ---
{
  const c = byName.completions;
  log.push(ensureField(c, { name: 'photo', type: 'file', required: false, maxSelect: 1, maxSize: 10 * MB, mimeTypes: IMAGE, thumbs: ['800x0', '160x160'], protected: false }));
  // Time logged without finishing the task (added after go-live).
  log.push(ensureField(c, { name: 'partial', type: 'bool', required: false }));
  Object.assign(c, { listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null });
}
// --- creations ---
{
  const c = byName.creations;
  log.push(ensureField(c, { name: 'featured', type: 'bool', required: false }));
  if (!c.fields.find((f) => f.name === 'board')) log.push(ensureField(c, { name: 'board', type: 'text', required: false, max: 50 }));
  const photos = c.fields.find((f) => f.name === 'photos');
  if (photos) Object.assign(photos, { maxSelect: 12, maxSize: 10 * MB, mimeTypes: IMAGE, thumbs: ['800x0', '400x400'] });
  const desc = c.fields.find((f) => f.name === 'description');
  if (desc) desc.required = false;
  Object.assign(c, { listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null });
}
// --- tasks ---
{
  const c = byName.tasks;
  const img = c.fields.find((f) => f.name === 'image');
  if (img) Object.assign(img, { mimeTypes: IMAGE, maxSize: 10 * MB, thumbs: ['800x0', '400x400'] });
  Object.assign(c, { listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null });
}
// --- everything else the old app could write to ---
for (const name of ['volunteer_hours', 'goals', 'goal_progress', 'badges', 'volunteers_old']) {
  const c = byName[name];
  if (!c) continue;
  Object.assign(c, { createRule: null, updateRule: null, deleteRule: null });
  if (name === 'volunteers_old') Object.assign(c, { listRule: null, viewRule: null });
}
if (byName.users) Object.assign(byName.users, { createRule: null });

const touched = ['volunteers', 'completions', 'creations', 'tasks', 'volunteer_hours', 'goals', 'goal_progress', 'badges', 'volunteers_old', 'users'].filter((n) => byName[n]);
console.log(log.join('\n'));
if (dry) {
  console.log('\n--dry-run: no changes written.');
  process.exit(0);
}
for (const name of touched) {
  const c = byName[name];
  await pb.collections.update(c.id, c);
  console.log(`updated ${name}`);
}

// Hide emails from the public API.
const vols = await pb.collection('volunteers').getFullList({ fields: 'id,emailVisibility' });
let hidden = 0;
for (const v of vols) {
  if (v.emailVisibility) {
    await pb.collection('volunteers').update(v.id, { emailVisibility: false });
    hidden++;
  }
}
console.log(`emailVisibility -> false for ${hidden} volunteers`);
console.log('Done.');
