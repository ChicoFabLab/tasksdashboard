'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { cx } from './ui';

const MAX_EDGE = 2000;

/** Downscale large phone photos in the browser so uploads are fast on shop Wi-Fi. */
async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.2 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export function PhotoInput({
  name,
  multiple = false,
  max = 1,
  label = 'Add a photo',
  required,
  existing,
}: {
  name: string;
  multiple?: boolean;
  max?: number;
  label?: string;
  required?: boolean;
  existing?: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setError('');
    if (picked.length > max) {
      setError(`Pick up to ${max} photos.`);
      e.target.value = '';
      setPreviews([]);
      return;
    }
    setBusy(true);
    const files = await Promise.all(picked.map(shrink));
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    if (input.current) input.current.files = dt.files;
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    setBusy(false);
  }

  function clear() {
    if (input.current) input.current.value = '';
    setPreviews([]);
  }

  const shown = previews.length ? previews : existing ? [existing] : [];

  return (
    <div>
      <input
        ref={input}
        id={`photo-${name}`}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        required={required}
        onChange={onChange}
        className="peer sr-only"
      />
      {shown.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          {shown.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src + i} src={src} alt="" className="size-24 rounded-xl border border-line object-cover sm:size-28" />
          ))}
          <label
            htmlFor={`photo-${name}`}
            className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-line-strong px-4 text-sm font-semibold hover:bg-surface-2"
          >
            Change
          </label>
          {previews.length > 0 && (
            <button type="button" onClick={clear} className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm text-muted hover:bg-surface-2">
              <X className="size-4" aria-hidden /> Remove
            </button>
          )}
        </div>
      ) : (
        <label
          htmlFor={`photo-${name}`}
          className={cx(
            'flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-surface px-4 py-6 text-center transition hover:border-accent hover:bg-accent-soft/40',
            'peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-accent',
          )}
        >
          <Camera className="size-7 text-muted" aria-hidden />
          <span className="font-semibold">{busy ? 'Preparing…' : label}</span>
          <span className="text-sm text-muted">{multiple ? `Up to ${max} · ` : ''}JPG, PNG or WebP</span>
        </label>
      )}
      {error && <p className="mt-2 text-sm font-medium text-bad">{error}</p>}
    </div>
  );
}
