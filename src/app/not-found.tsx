import { ButtonLink, EmptyState } from '@/components/ui';
// Root fallback (outside the site layout)

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <EmptyState title="Can’t find that" body="It may have been moved or removed." action={<ButtonLink href="/">Go home</ButtonLink>} />
    </main>
  );
}
