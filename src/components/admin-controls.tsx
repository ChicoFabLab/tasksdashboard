'use client';

import { useState, useTransition } from 'react';
import { deleteCompletion, reopenTask, setAdmin, setTempPassword } from '@/app/actions/admin';
import type { FormState } from '@/app/actions/auth';
import { Button } from './ui';

function useAct() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<FormState>();
  return { pending, msg, run: (fn: () => Promise<FormState>) => start(async () => setMsg(await fn())) };
}

function Msg({ msg }: { msg: FormState }) {
  if (!msg) return null;
  return <span className={msg.error ? 'text-sm text-bad' : 'text-sm text-good'}>{msg.error ?? msg.ok}</span>;
}

export function AdminToggle({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  const { pending, msg, run } = useAct();
  return (
    <span className="inline-flex items-center gap-2">
      <Button size="sm" variant={isAdmin ? 'secondary' : 'ghost'} disabled={pending} onClick={() => run(() => setAdmin(id, !isAdmin))}>
        {isAdmin ? 'Remove admin' : 'Make admin'}
      </Button>
      <Msg msg={msg} />
    </span>
  );
}

export function ReopenButton({ id }: { id: string }) {
  const { pending, msg, run } = useAct();
  return (
    <span className="inline-flex items-center gap-2">
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => confirm('Reopen this task? Logged time stays.') && run(() => reopenTask(id))}>
        Reopen
      </Button>
      <Msg msg={msg} />
    </span>
  );
}

export function DeleteCompletionButton({ id }: { id: string }) {
  const { pending, msg, run } = useAct();
  return (
    <span className="inline-flex items-center gap-2">
      <Button size="sm" variant="danger" disabled={pending} onClick={() => confirm('Remove this logged time? The minutes come off their total.') && run(() => deleteCompletion(id))}>
        Remove
      </Button>
      <Msg msg={msg} />
    </span>
  );
}

export function TempPasswordButton({ id, name }: { id: string; name: string }) {
  const { pending, msg, run } = useAct();
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => confirm(`Set a temporary password for ${name}? Any current password stops working.`) && run(() => setTempPassword(id))}>
        Temp password
      </Button>
      {msg?.ok ? <code className="rounded bg-surface-2 px-2 py-1 font-mono text-sm">{msg.ok.replace('Temporary password: ', '')}</code> : <Msg msg={msg} />}
    </span>
  );
}
