#!/usr/bin/env node
/**
 * Rotate the token-signing secrets for superusers and volunteers. Every existing
 * token becomes invalid (the old app leaked superuser tokens into browser cookies).
 * Admins signed into the PocketBase dashboard will need to sign in again.
 *
 *   PB_URL=... PB_EMAIL=... PB_PASSWORD=... node scripts/pb-rotate-token-secrets.mjs
 */
import PocketBase from 'pocketbase';
import { randomBytes } from 'node:crypto';

const pb = new PocketBase(process.env.PB_URL || 'http://127.0.0.1:8091');
pb.autoCancellation(false);
await pb.collection('_superusers').authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);
// Superusers last: rotating it invalidates this script's own token.
for (const name of ['volunteers', '_superusers']) {
  const c = await pb.collections.getOne(name);
  await pb.collections.update(c.id, { authToken: { ...c.authToken, secret: randomBytes(36).toString('base64url') } });
  console.log(`rotated authToken secret: ${name}`);
}
