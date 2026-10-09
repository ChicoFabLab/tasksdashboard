'use client';

import { useState } from 'react';
import { cx } from './ui';

export function Gallery({ photos, thumbs, title }: { photos: string[]; thumbs: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) return <div className="mat aspect-[4/3] rounded-2xl border border-line" />;
  return (
    <div>
      <a href={photos[i]} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-line bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbs[i] ?? photos[i]} alt={`${title} — photo ${i + 1} of ${photos.length}`} className="max-h-[72vh] w-full object-contain" />
      </a>
      {photos.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {thumbs.map((t, idx) => (
            <button
              key={t}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show photo ${idx + 1}`}
              aria-current={idx === i}
              className={cx('size-20 shrink-0 overflow-hidden rounded-xl border-2 transition', idx === i ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
