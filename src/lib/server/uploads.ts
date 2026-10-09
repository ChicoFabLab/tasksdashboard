import 'server-only';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Returns valid image files from a form field, or an error message. */
export function readImages(form: FormData, field: string, max: number): { files: File[]; error?: string } {
  const files = form
    .getAll(field)
    .filter((f): f is File => typeof f === 'object' && f !== null && 'size' in f && (f as File).size > 0);
  if (files.length > max) return { files: [], error: `Up to ${max} photo${max === 1 ? '' : 's'}, please.` };
  for (const f of files) {
    if (!IMAGE_TYPES.includes(f.type)) return { files: [], error: 'Photos must be JPG, PNG, WebP or GIF.' };
    if (f.size > MAX_IMAGE_BYTES) return { files: [], error: 'Each photo must be under 10 MB.' };
  }
  return { files };
}

export function text(form: FormData, field: string, max: number): string {
  const v = form.get(field);
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function int(form: FormData, field: string, min: number, max: number): number | null {
  const raw = form.get(field);
  if (typeof raw !== 'string' || !/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
}
