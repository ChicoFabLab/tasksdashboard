import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import type { Member, TaskStatus } from '@/lib/types';
import { zoneCode, zoneColor } from '@/lib/format';

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
  primary: 'pressable bg-accent text-accent-ink hover:bg-accent-strong [--press:0_3px_0_var(--accent-strong)] hover:[--press:0_3px_0_var(--ink)]',
  dark: 'pressable bg-ink text-paper hover:bg-ink-2 [--press:0_3px_0_var(--line-strong)]',
  secondary: 'pressable bg-surface text-ink border-[1.5px] border-line-strong hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2 active:bg-surface-2',
  danger: 'pressable bg-surface text-bad border-[1.5px] border-line-strong hover:bg-bad-soft',
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

/** Machine-label style zone tag: solid colour chip with a mono code, plus the zone name. */
export function ZoneTag({ zone, className, bare }: { zone: string; className?: string; bare?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-2 text-[14px] font-medium text-ink-2', className)}>
      <span
        className="inline-flex h-[1.6em] items-center rounded-[2px] px-1.5 font-mono text-[0.8em] font-semibold tracking-wide text-[#111]"
        style={{ background: zoneColor(zone) }}
        aria-hidden={!bare}
      >
        {zoneCode(zone)}
      </span>
      {!bare && zone}
    </span>
  );
}

const STATUS: Record<TaskStatus, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-accent-soft text-accent-strong' },
  in_progress: { label: 'In progress', cls: 'bg-warn-soft text-warn' },
  completed: { label: 'Done', cls: 'bg-hivis text-hivis-ink' },
  pending_approval: { label: 'In review', cls: 'bg-surface-2 text-muted' },
};

export function StatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  const s = STATUS[status] ?? STATUS.open;
  return <span className={cx('inline-flex h-7 items-center rounded-[2px] px-2 font-mono text-[12px] font-semibold uppercase tracking-wider', s.cls, className)}>{s.label}</span>;
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('rounded-2xl border-[1.5px] border-line bg-surface', className)} {...props} />;
}

export function SectionHeader({ title, action, kicker }: { title: string; action?: ReactNode; kicker?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b-[1.5px] border-ink pb-2.5">
      <h2 className="display flex items-baseline gap-3 text-[28px] font-extrabold uppercase leading-none sm:text-[34px]">
        {title}
        {kicker && <span className="font-mono text-[13px] font-medium normal-case tracking-normal text-muted">{kicker}</span>}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="mat rounded-2xl border-[1.5px] border-dashed border-line-strong px-6 py-12 text-center">
      <p className="display text-2xl font-bold">{title}</p>
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
        <h1 className="display text-[40px] font-extrabold uppercase leading-[0.95] sm:text-[56px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-muted sm:text-lg">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export const inputClass =
  'block w-full rounded-xl border-[1.5px] border-line-strong bg-surface px-4 h-12 text-base text-ink placeholder:text-muted/80 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

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
