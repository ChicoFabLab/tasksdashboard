'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import type { Member } from '@/lib/types';
import { cx, inputClass } from './ui';

/** Keyword search + person + sort controls for the task board. State lives in the URL. */
export function BoardFilters({ people, activeCount, children }: { people: Member[]; activeCount: number; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [, start] = useTransition();
  const first = useRef(true);

  const set = (changes: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) (v ? p.set(k, v) : p.delete(k));
    const s = p.toString();
    start(() => router.replace(`${path}${s ? `?${s}` : ''}`, { scroll: false }));
  };

  // Search as you type (debounced).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => set({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="text"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className={cx(inputClass, 'pl-11 pr-10')}
          />
          {q && (
            <button type="button" onClick={() => setQ('')} className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted" aria-label="Clear search">
              <X className="size-4" />
            </button>
          )}
        </div>
        {/* Phones: everything else lives behind one button so tasks start near the top. */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="board-filter-panel"
          className={cx(
            'inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border px-4 font-semibold sm:hidden',
            open || activeCount ? 'border-accent bg-accent-soft text-ink' : 'border-line-strong bg-surface',
          )}
        >
          <SlidersHorizontal className="size-5" aria-hidden />
          Filters
          {activeCount > 0 && <span className="grid size-6 place-items-center rounded-full bg-accent text-xs text-accent-ink">{activeCount}</span>}
        </button>
      </div>

      <div id="board-filter-panel" className={cx('space-y-3', !open && 'hidden sm:block')}>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select aria-label="Person" value={params.get('who') ?? ''} onChange={(e) => set({ who: e.target.value })} className={cx(inputClass, 'sm:w-48')}>
            <option value="">Anyone</option>
            {people.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select aria-label="Sort" value={params.get('sort') ?? ''} onChange={(e) => set({ sort: e.target.value })} className={cx(inputClass, 'sm:w-44')}>
            <option value="">Newest first</option>
            <option value="quickest">Quickest first</option>
            <option value="zone">By zone</option>
          </select>
        </div>
        {children}
      </div>
    </div>
  );
}
