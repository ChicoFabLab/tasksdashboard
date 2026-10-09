import { redirect } from 'next/navigation';
import { getCurrentUser, safeNext } from '@/lib/server/session';
import { AuthShell } from '@/components/auth-shell';
import { SignupForm } from '@/components/auth-forms';

export const metadata = { title: 'Create account' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Join in" subtitle="Takes 20 seconds. No Discord required." next={next} error={sp.error}>
      <SignupForm next={next} needsInvite={Boolean(process.env.SIGNUP_INVITE_CODE)} />
    </AuthShell>
  );
}
