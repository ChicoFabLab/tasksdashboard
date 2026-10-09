import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { discordLoginEnabled } from '@/lib/server/discord';
import { logout } from '@/app/actions/auth';
import { Button, Notice, PageHeader, buttonClass } from '@/components/ui';
import { DiscordUnlink, PasswordForm, ProfileForm } from '@/components/settings-forms';

const sectionClass = 'rounded-2xl border border-line bg-surface p-5 sm:p-7';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings' };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ linked?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/me/settings');
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" />
      {sp.linked && <Notice tone="good">Discord connected.</Notice>}
      {sp.error === 'discord_taken' && <Notice tone="bad">That Discord account is already connected to another member. Ask an admin to merge them.</Notice>}
      {sp.error && sp.error !== 'discord_taken' && <Notice tone="bad">Discord didn’t connect. Please try again.</Notice>}

      <section className={sectionClass}>
        <h2 className="mb-5 text-xl font-semibold">Profile</h2>
        <ProfileForm name={user.name} photo={user.photo} />
      </section>

      <section className={sectionClass}>
        <h2 className="text-xl font-semibold">Password</h2>
        <p className="mb-5 mt-1 text-[15px] text-muted">
          {user.hasPassword ? 'Sign in with your display name (or email) and this password.' : 'Set one so you can sign in without Discord — handy on the lab’s shared screen.'}
        </p>
        <PasswordForm hasPassword={user.hasPassword} />
      </section>

      {discordLoginEnabled && (
        <section className={sectionClass}>
          <h2 className="text-xl font-semibold">Discord</h2>
          <p className="mb-5 mt-1 text-[15px] text-muted">
            {user.discordLinked ? 'Connected. You can sign in with Discord.' : 'Optional. Connect it to sign in with Discord too.'}
          </p>
          {user.discordLinked ? (
            <DiscordUnlink />
          ) : (
            <a href="/api/auth/discord?link=1&next=/me/settings" className={buttonClass({ variant: 'secondary' })}>
              Connect Discord
            </a>
          )}
        </section>
      )}

      <form action={logout}>
        <Button type="submit" variant="ghost" block size="lg">
          Sign out
        </Button>
      </form>
    </div>
  );
}
