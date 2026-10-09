#!/usr/bin/env node
/**
 * Restore the API rules and auth options saved by pb-migrate-2026.mjs, so the
 * previous app version (which writes to PocketBase from the browser) works again.
 *
 *   PB_URL=http://127.0.0.1:8091 PB_EMAIL=... PB_PASSWORD=... node scripts/pb-rollback-2026.mjs pb-snapshot-XXXX.json
 *
 * New fields (is_admin, pw_hash, completions.photo, creations.featured) are left in
 * place: the old app ignores them and removing them would delete data.
 */
import PocketBase from 'pocketbase';
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/pb-rollback-2026.mjs <snapshot.json>');
  process.exit(1);
}
const snapshot = JSON.parse(readFileSync(file, 'utf8'));
const pb = new PocketBase(process.env.PB_URL || 'http://127.0.0.1:8091');
pb.autoCancellation(false);
await pb.collection('_superusers').authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

for (const old of snapshot) {
  if (old.system) continue;
  let current;
  try {
    current = await pb.collections.getOne(old.id);
  } catch {
    continue;
  }
  const patch = {
    listRule: old.listRule,
    viewRule: old.viewRule,
    createRule: old.createRule,
    updateRule: old.updateRule,
    deleteRule: old.deleteRule,
  };
  if (old.type === 'auth') patch.passwordAuth = old.passwordAuth;
  // creations.description was required before; restoring that would block creations saved without one.
  await pb.collections.update(current.id, patch);
  console.log(`restored rules: ${old.name}`);
}
console.log('Done. API rules are back to their pre-redesign state.');
