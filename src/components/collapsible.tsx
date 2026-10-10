'use client';

import { useState } from 'react';

export function CollapsibleText({ text, className }: { text: string; className?: string }) {
  const long = text.length > 200 || text.split('\n').length > 4;
  const [open, setOpen] = useState(!long);
  return (
    <div>
      <div className={`${className ?? ''} ${open ? '' : 'line-clamp-3'}`}>{text}</div>
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 h-11 font-semibold text-accent underline underline-offset-4">
          {open ? 'Show less' : 'More details'}
        </button>
      )}
    </div>
  );
}
