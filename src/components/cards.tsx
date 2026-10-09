import Link from 'next/link';
import { Images, Star } from 'lucide-react';
import type { Creation, Member, Task } from '@/lib/types';
import type { Win } from '@/lib/server/data';
import { capitalize, formatMinutes, shortMinutes, taskNo, timeAgo, zoneCode, zoneColor } from '@/lib/format';
import { Avatar, AvatarStack, StatusPill, cx, names } from './ui';

/** Mono "spec plate" strip: LSR · TASK 156 · ~1H30 */
export function SpecPlate({ zone, number, minutes, className }: { zone: string; number: number; minutes?: number; className?: string }) {
  return (
    <span className={cx('flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-wider text-muted', className)}>
      <span className="rounded-[2px] px-1.5 py-0.5 text-[#111]" style={{ background: zoneColor(zone) }}>
        {zoneCode(zone)}
      </span>
      <span>Task {number}</span>
      {minutes ? <span aria-label={`about ${formatMinutes(minutes)}`}>· ~{shortMinutes(minutes)}</span> : null}
    </span>
  );
}

export function TaskCard({ task, href }: { task: Task; href?: string }) {
  return (
    <Link
      href={href ?? `/tasks/${task.id}`}
      className="pressable group relative flex min-h-[164px] flex-col overflow-hidden rounded-2xl border-[1.5px] border-line-strong bg-surface hover:border-ink"
    >
      <span className="h-2.5 w-full shrink-0" style={{ background: zoneColor(task.zone) }} aria-hidden />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <SpecPlate zone={task.zone} number={task.number} minutes={task.estimatedMinutes} />
          {task.status !== 'open' && <StatusPill status={task.status} />}
        </div>
        <h3 className="cap display mt-3 line-clamp-3 text-[24px] font-bold leading-[1.05]">{task.title}</h3>
        <div className="mt-auto flex items-center gap-3 pt-4 text-sm text-muted">
          <span>{task.zone}</span>
          {task.assignees.length > 0 && task.status !== 'completed' && (
            <span className="ml-auto flex items-center gap-2">
              <span className="text-[13px]">{names(task.assignees, 1)}</span>
              <AvatarStack members={task.assignees} size={28} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** The hi-vis DONE stamp. */
export function DoneStamp({ className, big }: { className?: string; big?: boolean }) {
  return (
    <span
      className={cx(
        'stamp-in inline-block -rotate-[4deg] rounded-[3px] border-2 border-hivis-ink bg-hivis font-mono font-semibold uppercase tracking-widest text-hivis-ink',
        big ? 'px-3 py-1 text-xl' : 'px-2 py-0.5 text-[12px]',
        className,
      )}
    >
      Done
    </span>
  );
}

/** Big face for a photo-less win: avatar or initials on the zone colour. */
export function MakerFace({ member, zone, size }: { member: Member; zone: string; size: number }) {
  if (member.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={member.photo.replace('160x160', '400x400')} alt="" className="rounded-[4px] object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="display grid place-items-center rounded-[4px] font-extrabold text-[#111]"
      style={{ width: size, height: size, background: zoneColor(zone), fontSize: size * 0.42 }}
      aria-hidden
    >
      {member.initials}
    </span>
  );
}

export function WinCard({ win, className }: { win: Win; className?: string }) {
  const zone = win.task?.zone ?? 'General';
  const lead = win.members[0];
  const cls = cx('pressable relative flex flex-col overflow-hidden rounded-2xl border-[1.5px] border-line-strong bg-surface hover:border-ink', className);
  const body = win.photo ? (
    <>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={win.photo} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
        <DoneStamp className="absolute left-3 top-3" />
      </div>
      <WinFooter win={win} />
    </>
  ) : (
    // "Time card": the person is the hero, not the task number.
    <>
      <div className="relative flex aspect-[4/3] items-end gap-4 bg-surface-2 p-4">
        <span className="absolute inset-x-0 top-0 h-2.5" style={{ background: zoneColor(zone) }} aria-hidden />
        <MakerFace member={lead} zone={zone} size={96} />
        <div className="min-w-0 pb-1">
          <p className="display truncate text-[30px] font-extrabold leading-none">{lead.name}</p>
          {win.members.length > 1 && <p className="mt-1 truncate text-sm text-muted">+ {names(win.members.slice(1), 2)}</p>}
          <p className="mt-2 font-mono text-[22px] font-semibold leading-none">{formatMinutes(win.minutes)}</p>
        </div>
        <DoneStamp className="absolute right-3 top-5" />
      </div>
      <WinFooter win={win} hideNames />
    </>
  );
  return win.task ? (
    <Link href={`/tasks/${win.task.id}`} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function WinFooter({ win, hideNames }: { win: Win; hideNames?: boolean }) {
  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <p className="font-mono text-[12px] font-semibold uppercase tracking-wider text-muted">
        {win.task ? `${zoneCode(win.task.zone)} · ${taskNo(win.task.number)} · ` : ''}
        {timeAgo(win.created)}
      </p>
      <h3 className="cap line-clamp-2 text-[17px] font-semibold leading-snug">{win.task?.title ?? 'A task'}</h3>
      {win.note && <p className="line-clamp-2 text-sm text-muted">“{capitalize(win.note)}”</p>}
      {!hideNames && (
        <div className="mt-auto flex items-center gap-2.5 pt-1">
          <AvatarStack members={win.members} size={28} max={3} />
          <p className="min-w-0 truncate text-sm font-semibold">{names(win.members, 2)}</p>
          <span className="ml-auto shrink-0 font-mono text-sm">{formatMinutes(win.minutes)}</span>
        </div>
      )}
    </div>
  );
}

export function CreationCard({ creation, className }: { creation: Creation; className?: string }) {
  return (
    <Link
      href={`/creations/${creation.id}`}
      className={cx('pressable group block overflow-hidden rounded-2xl border-[1.5px] border-line-strong bg-surface hover:border-ink', className)}
    >
      <div className="relative bg-surface-2">
        {creation.thumbs[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creation.thumbs[0]} alt={creation.title} className="aspect-square w-full object-cover" loading="lazy" />
        ) : (
          <div className="mat aspect-square w-full" />
        )}
        {creation.featured && (
          <span className="absolute left-2.5 top-2.5 inline-flex h-7 items-center gap-1 rounded-[2px] bg-hivis px-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-hivis-ink">
            <Star className="size-3.5 fill-current" aria-hidden /> Featured
          </span>
        )}
        {creation.photos.length > 1 && (
          <span className="absolute right-2.5 top-2.5 inline-flex h-7 items-center gap-1 rounded-[2px] bg-black/70 px-2 font-mono text-[11px] font-semibold text-white">
            <Images className="size-3.5" aria-hidden /> {creation.photos.length}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 border-t-[1.5px] border-line p-3.5">
        <Avatar member={creation.member} size={34} />
        <div className="min-w-0">
          <h3 className="cap truncate font-semibold leading-tight">{creation.title}</h3>
          <p className="truncate text-sm text-muted">
            {creation.member.name} · {timeAgo(creation.created)}
          </p>
        </div>
      </div>
    </Link>
  );
}
