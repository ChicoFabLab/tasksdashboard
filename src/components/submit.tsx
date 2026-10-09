'use client';
import { useFormStatus } from 'react-dom';
import { Button, type ButtonStyle } from './ui';

export function Submit({ children, pending, ...style }: ButtonStyle & { children: React.ReactNode; pending?: string }) {
  const { pending: isPending } = useFormStatus();
  return (
    <Button type="submit" disabled={isPending} aria-busy={isPending} {...style}>
      {isPending ? (pending ?? 'Saving…') : children}
    </Button>
  );
}
