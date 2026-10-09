'use client';

import { useState, useTransition } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { deleteCreation, toggleFeatured } from '@/app/actions/creations';
import type { FormState } from '@/app/actions/auth';
import { Button, Notice } from './ui';

export function CreationOwnerActions({ id, canDelete, canFeature, featured }: { id: string; canDelete: boolean; canFeature: boolean; featured: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<FormState>();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canFeature && (
          <Button variant="secondary" size="sm" disabled={pending} onClick={() => start(async () => setMsg(await toggleFeatured(id)))}>
            <Star className="size-4" aria-hidden /> {featured ? 'Unfeature' : 'Feature'}
          </Button>
        )}
        {canDelete && (
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (confirm('Remove this creation? This can’t be undone.')) start(async () => setMsg(await deleteCreation(id)));
            }}
          >
            <Trash2 className="size-4" aria-hidden /> Remove
          </Button>
        )}
      </div>
      {msg?.error && <Notice tone="bad">{msg.error}</Notice>}
      {msg?.ok && <Notice tone="good">{msg.ok}</Notice>}
    </div>
  );
}
