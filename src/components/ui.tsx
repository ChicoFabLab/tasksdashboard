import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import type { Member, TaskStatus } from '@/lib/types';
import { zoneColor } from '@/lib/format';

export function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none select-none';
const sizes = {
  sm: 'h-10 px-3.5 text-sm',
  md: 'h-12 px-5 text-[15px]',
  lg: 'h-14 px-6 text-base',
  xl: 'h-16 px-8 text-lg',
};
const variants = {
  primary: 'pressable bg-accent text-accent-ink hover:bg-accent-strong [--press:0_2px_0_var(--accent-strong)]',
  dark: 'pressable bg-ink text-paper hover:bg-ink-2 [--press:0_3px_0_var(--line-strong)]',
  secondary: 'pressable bg-surface text-ink border border-line-strong hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2 active:bg-surface-2',
  danger: 'pressable bg-surface text-bad border border-line-strong hover:bg-bad-soft',
  hivis: 'pressable bg-hivis text-hivis-ink hover:brightness-95 [--press:0_3px_0_#7a9a12]',
};

export type ButtonStyle = { variant?: keyof typeof variants; size?: keyof typeof sizes; block?: boolean };

export function buttonClass({ variant = 'primary', size = 'md', block }: ButtonStyle = {}, extra?: string) {
  return cx(base, sizes[size], variants[variant], block && 'w-full', extra);
}

export function Button({ variant, size, block, className, ...props }: ComponentProps<'button'> & ButtonStyle) {
  return <button className={buttonClass({ variant, size, block }, className)} {...props} />;
}

export function ButtonLink({ variant, size, block, className, ...props }: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link className={buttonClass({ variant, size, block }, className)} {...props} />;
}

export function Avatar({ member, size = 40, ring }: { member: Pick<Member, 'name' | 'photo' | 'initials'>; size?: number; ring?: boolean }) {
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.38) };
  const cls = cx(
    'shrink-0 rounded-full overflow-hidden grid place-items-center font-semibold bg-surface-2 text-ink-2',
    ring && 'ring-2 ring-surface',
  );
  if (member.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={member.photo} alt="" className={cx(cls, 'object-cover')} style={style} loading="lazy" />;
  }
  return (
    <span className={cls} style={style} aria-hidden>
      {member.initials}
    </span>
  );
}

export function AvatarStack({ members, size = 32, max = 4 }: { members: Member[]; size?: number; max?: number }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <span className="flex -space-x-2">
      {shown.map((m) => (
        <Avatar key={m.id || m.name} member={m} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className="grid place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted ring-2 ring-surface"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

export function names(members: Member[], max = 3) {
  const ns = members.map((m) => m.name);
  if (ns.length <= max) return ns.length > 1 ? `${ns.slice(0, -1).join(', ')} & ${ns.at(-1)}` : ns[0] ?? '';
  return `${ns.slice(0, max).join(', ')} +${ns.length - max}`;
}

export function ZoneTag({ zone, className }: { zone: string; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2 text-[15px] font-medium text-ink-2', className)}>
      <span className="size-3 shrink-0 rounded-full" style={{ background: zoneColor(zone) }} aria-hidden />
      {zone}
    </span>
  );
}

const STATUS: Record<TaskStatus, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-accent-soft text-accent-strong' },
  in_progress: { label: 'In progress', cls: 'bg-warn-soft text-warn' },
  completed: { label: 'Done', cls: 'bg-good-soft text-good' },
  pending_approval: { label: 'In review', cls: 'bg-surface-2 text-muted' },
};

export function StatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  const s = STATUS[status] ?? STATUS.open;
  return <span className={cx('inline-flex h-7 items-center rounded-full px-3 text-[13px] font-semibold', s.cls, className)}>{s.label}</span>;
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('rounded-2xl border border-line bg-surface', className)} {...props} />;
}

export function SectionHeader({ title, action, kicker }: { title: string; action?: ReactNode; kicker?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="display text-2xl font-bold sm:text-[28px]">{title}</h2>
        {kicker && <p className="mt-0.5 text-[15px] text-muted">{kicker}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="mat rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
      <p className="text-xl font-bold">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-muted">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'good' | 'bad'; children: ReactNode }) {
  const cls = { info: 'bg-surface-2 text-ink', good: 'bg-good-soft text-good', bad: 'bg-bad-soft text-bad' }[tone];
  return (
    <div role={tone === 'bad' ? 'alert' : 'status'} className={cx('rounded-xl px-4 py-3 text-[15px] font-medium', cls)}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="display text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-muted sm:text-lg">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export const inputClass =
  'block w-full rounded-xl border border-line-strong bg-surface px-4 h-12 text-base text-ink placeholder:text-muted/80 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[15px] font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Dashboard KPI tile. */
export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface p-3 sm:p-5">
      <p className="truncate text-xs font-medium text-muted sm:text-sm">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight sm:mt-1 sm:text-[34px]">{value}</p>
      {hint && <p className="mt-1 hidden truncate text-[13px] text-muted sm:block">{hint}</p>}
    </div>
  );
}

/** Bordered panel with a header row — the basic dashboard container. */
export function Panel({ title, action, children, className, bodyClass }: { title: string; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cx('rounded-2xl border border-line bg-surface', className)}>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-line px-4 sm:px-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      <div className={bodyClass ?? 'p-2'}>{children}</div>
    </section>
  );
}

export function LeaderList({ rows, size = 'md' }: { rows: { member: Member; minutes: number; tasks: number }[]; size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  const max = Math.max(1, ...rows.map((r) => r.minutes));
  return (
    <ol>
      {rows.map((r, i) => (
        <li key={r.member.id}>
          <Link href={`/makers/${r.member.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2">
            <span className={cx('w-6 text-center font-semibold tabular-nums', i < 3 ? 'text-accent' : 'text-muted', lg && 'text-xl')}>{i + 1}</span>
            <Avatar member={r.member} size={lg ? 48 : 36} />
            <span className="min-w-0 flex-1">
              <span className={cx('flex items-baseline justify-between gap-3', lg ? 'text-xl' : 'text-[15px]')}>
                <span className="truncate font-semibold">{r.member.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">{formatHoursLabel(r.minutes)}</span>
              </span>
              <span className="mt-1 flex items-center gap-3">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(4, (r.minutes / max) * 100)}%` }} />
                </span>
                <span className={cx('shrink-0 text-muted tabular-nums', lg ? 'text-base' : 'text-[13px]')}>
                  {r.tasks} {r.tasks === 1 ? 'task' : 'tasks'}
                </span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function formatHoursLabel(minutes: number) {
  const h = minutes / 60;
  return h < 1 ? `${Math.round(minutes)} min` : `${h < 10 ? Math.round(h * 10) / 10 : Math.round(h)} h`;
}
