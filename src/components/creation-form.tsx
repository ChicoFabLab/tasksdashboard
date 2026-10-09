'use client';

import { useActionState } from 'react';
import { createCreation, updateCreation } from '@/app/actions/creations';
import { Field, Notice, cx, inputClass } from './ui';
import { PhotoInput } from './photo-input';
import { Submit } from './submit';

export function CreationForm({ creation }: { creation?: { id: string; title: string; description: string } }) {
  const [state, action] = useActionState(creation ? updateCreation : createCreation, undefined);
  return (
    <form action={action} className="space-y-7">
      {creation && <input type="hidden" name="id" value={creation.id} />}
      {state?.error && <Notice tone="bad">{state.error}</Notice>}
      {!creation && (
        <Field label="Photos">
          <PhotoInput name="photos" multiple max={6} required label="Add photos of your project" />
        </Field>
      )}
      <Field label="What is it?" htmlFor="title">
        <input id="title" name="title" required minLength={2} maxLength={100} defaultValue={creation?.title} className={cx(inputClass, 'h-14 text-lg')} placeholder="e.g. Walnut cutting board" />
      </Field>
      <Field label="Tell the story (optional)" htmlFor="description" hint="Machines used, what you learned, what you’d do differently.">
        <textarea id="description" name="description" rows={5} maxLength={3000} defaultValue={creation?.description.trim()} className={cx(inputClass, 'h-auto py-3')} />
      </Field>
      <div className="border-t border-line pt-6">
        <Submit size="lg" pending={creation ? 'Saving…' : 'Uploading…'}>
          {creation ? 'Save changes' : 'Share it'}
        </Submit>
      </div>
    </form>
  );
}
