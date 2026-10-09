import { ButtonLink, EmptyState } from '@/components/ui';

export default function NotFound() {
  return <EmptyState title="Can’t find that" body="It may have been moved or removed." action={<ButtonLink href="/">Go home</ButtonLink>} />;
}
