'use client';

import { useActionState, useState, useTransition } from 'react';
import { setPassword } from '@/app/actions/auth';
import { unlinkDiscord, updateProfile } from '@/app/actions/profile';
import type { FormState } from '@/app/actions/auth';
import { Button, Field, Notice, inputClass } from './ui';
import { PhotoInput } from './photo-input';
import { Submit } from './submit';

export function ProfileForm({ name, photo }: { name: string; photo: string | null }) {
  const [state, action] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Notice tone="bad">{state.error}</Notice>}
      {state?.ok && <Notice tone="good">{state.ok}</Notice>}
      <Field label="Display name" htmlFor="name">
        <input id="name" name="name" required minLength={2} maxLength={31} defaultValue={name} className={inputClass} />
      </Field>
      <Field label="Profile photo" hint="Helps people recognise you on the big screen.">
        <PhotoInput name="photo" existing={photo} label="Add a photo" />
        {photo && (
          <label className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="remove_photo" className="size-4" /> Remove current photo
          </label>
        )}
      </Field>
      <Submit>Save profile</Submit>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(setPassword, undefined);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Notice tone="bad">{state.error}</Notice>}
      {state?.ok && <Notice tone="good">{state.ok}</Notice>}
      {hasPassword && (
        <Field label="Current password" htmlFor="current">
          <input id="current" name="current" type="password" required autoComplete="current-password" className={inputClass} />
        </Field>
      )}
      <Field label={hasPassword ? 'New password' : 'Password'} htmlFor="password" hint="At least 8 characters.">
        <input id="password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={inputClass} />
      </Field>
      <Submit>{hasPassword ? 'Change password' : 'Set password'}</Submit>
    </form>
  );
}

export function DiscordUnlink() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<FormState>();
  return (
    <div className="space-y-3">
      <Button variant="danger" size="sm" disabled={pending} onClick={() => start(async () => setMsg(await unlinkDiscord()))}>
        Disconnect Discord
      </Button>
      {msg?.error && <Notice tone="bad">{msg.error}</Notice>}
      {msg?.ok && <Notice tone="good">{msg.ok}</Notice>}
    </div>
  );
}
