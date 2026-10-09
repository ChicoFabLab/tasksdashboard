'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { login, signup } from '@/app/actions/auth';
import { Field, Notice, cx, inputClass } from './ui';
import { Submit } from './submit';

function PasswordInput({ id, autoComplete }: { id: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} name="password" type={show ? 'text' : 'password'} required minLength={autoComplete === 'new-password' ? 8 : 1} maxLength={72} autoComplete={autoComplete} className={cx(inputClass, 'pr-14')} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {state?.error && <Notice tone="bad">{state.error}</Notice>}
      <Field label="Name or email" htmlFor="identifier">
        <input id="identifier" name="identifier" required autoComplete="username" autoCapitalize="none" defaultValue={state?.fields?.identifier} className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" autoComplete="current-password" />
      </Field>
      <Submit size="lg" block pending="Signing in…">
        Sign in
      </Submit>
      <p className="text-center text-[15px] text-muted">
        New here?{' '}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ next, needsInvite }: { next: string; needsInvite: boolean }) {
  const [state, action] = useActionState(signup, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {state?.error && <Notice tone="bad">{state.error}</Notice>}
      <Field label="Display name" htmlFor="name" hint="Shown on the board when you finish tasks.">
        <input id="name" name="name" required minLength={2} maxLength={31} autoComplete="nickname" defaultValue={state?.fields?.name} className={inputClass} />
      </Field>
      <Field label="Email (optional)" htmlFor="email" hint="Only used to help you get back in. Never shown publicly.">
        <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" defaultValue={state?.fields?.email} className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <PasswordInput id="password" autoComplete="new-password" />
      </Field>
      {needsInvite && (
        <Field label="Invite code" htmlFor="invite" hint="Ask at the front desk.">
          <input id="invite" name="invite" required className={inputClass} />
        </Field>
      )}
      <Submit size="lg" block pending="Creating account…">
        Create account
      </Submit>
      <p className="text-center text-[15px] text-muted">
        Already have one?{' '}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
