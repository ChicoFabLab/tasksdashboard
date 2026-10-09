'use client';

import { Button, EmptyState } from '@/components/ui';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      title="Something went wrong"
      body="The lab’s server hiccuped. Try again in a moment."
      action={
        <Button onClick={reset} variant="secondary">
          Try again
        </Button>
      }
    />
  );
}
