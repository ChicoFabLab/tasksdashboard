import { redirect } from 'next/navigation';
import { getCurrentUser, safeNext } from '@/lib/server/session';
import { AuthShell } from '@/components/auth-shell';
import { LoginForm } from '@/components/auth-forms';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to claim tasks and share what you make." next={next} error={sp.error}>
      <LoginForm next={next} />
    </AuthShell>
  );
}
