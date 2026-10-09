/** Browser-loadable PocketBase file URLs. Safe on server and client. */
export const PB_PUBLIC_URL = (process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');

/** `thumb` must be one of the field's configured thumb sizes, otherwise PocketBase serves the original. */
export function fileUrl(collection: string, recordId: string, filename: string | undefined | null, thumb?: string): string | null {
  if (!filename) return null;
  const base = `${PB_PUBLIC_URL}/api/files/${collection}/${recordId}/${encodeURIComponent(filename)}`;
  return thumb ? `${base}?thumb=${thumb}` : base;
}
