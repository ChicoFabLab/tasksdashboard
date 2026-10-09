import { discordLoginEnabled } from '@/lib/server/discord';
import { buttonClass } from './ui';

const ERRORS: Record<string, string> = {
  discord: 'Discord sign-in didn’t go through. Try again, or use a password instead.',
  discord_taken: 'That Discord account is already connected to a different member.',
  state: 'That sign-in link expired. Please try again.',
};

export function AuthShell({ title, subtitle, children, next, error }: { title: string; subtitle: string; children: React.ReactNode; next: string; error?: string }) {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-muted sm:text-lg">{subtitle}</p>
      {error && ERRORS[error] && (
        <p role="alert" className="mt-5 rounded-xl bg-bad-soft px-4 py-3 text-[15px] font-medium text-bad">
          {ERRORS[error]}
        </p>
      )}
      <div className="mt-7 rounded-2xl border border-line bg-surface p-5 sm:p-7">{children}</div>
      {discordLoginEnabled && (
        <>
          <div className="my-6 flex items-center gap-4 text-sm text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          {/* Plain link: this kicks off a server redirect to Discord. */}
          <a href={`/api/auth/discord?next=${encodeURIComponent(next)}`} className={buttonClass({ variant: 'secondary', size: 'lg', block: true })}>
            <svg viewBox="0 0 24 24" className="size-5" fill="#5865F2" aria-hidden>
              <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.2a18.3 18.3 0 0 0-5.5 0L8.7 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18a19.9 19.9 0 0 0 6 3l1.3-2a13 13 0 0 1-1.9-.9l.4-.3c3.9 1.8 8.2 1.8 12.1 0l.4.3-1.9.9 1.2 2a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.5-13.6ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
            </svg>
            Continue with Discord
          </a>
        </>
      )}
    </div>
  );
}
