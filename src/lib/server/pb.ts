import 'server-only';
import PocketBase, { ClientResponseError } from 'pocketbase';

/**
 * Server-only PocketBase access.
 *
 * The browser never talks to PocketBase for writes. Every read and write goes
 * through server code that has already checked who the user is, using a
 * superuser client whose token never leaves the server.
 */

// Prefer a private URL on the server (e.g. http://127.0.0.1:8091) to skip the tunnel.
const PB_URL =
  process.env.POCKETBASE_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  'http://127.0.0.1:8090';

let adminClient: PocketBase | null = null;
let authPromise: Promise<void> | null = null;
let authedAt = 0;
// Re-auth periodically so a rotated token secret or PB restart heals itself.
const REAUTH_MS = 10 * 60 * 1000;

async function authenticate(client: PocketBase) {
  await client
    .collection('_superusers')
    .authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL!, process.env.POCKETBASE_ADMIN_PASSWORD!, {
      // Superuser tokens are short-lived on purpose; re-auth well before expiry.
      autoRefreshThreshold: 30 * 60,
    });
}

/** Shared superuser client. Safe to share: its auth never changes per request. */
export async function adminPb(): Promise<PocketBase> {
  if (!adminClient) {
    adminClient = new PocketBase(PB_URL);
    adminClient.autoCancellation(false);
  }
  if (!adminClient.authStore.isValid || Date.now() - authedAt > REAUTH_MS) {
    const client = adminClient;
    authPromise ??= authenticate(client)
      .then(() => {
        authedAt = Date.now();
      })
      .finally(() => {
        authPromise = null;
      });
    await authPromise;
  }
  return adminClient;
}

export function isNotFound(err: unknown) {
  return err instanceof ClientResponseError && err.status === 404;
}
