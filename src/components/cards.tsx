import Link from 'next/link';
import { Check, Clock, Images, Star } from 'lucide-react';
import type { Creation, Task } from '@/lib/types';
import type { Win } from '@/lib/server/data';
import { capitalize, formatMinutes, timeAgo, zoneColor } from '@/lib/format';
import { Avatar, AvatarStack, ZoneTag, cx, names } from './ui';

/** Trello-style zone label. */
export function ZoneLabel({ zone, large }: { zone: string; large?: boolean }) {
  return (
    <span
      className={cx('inline-flex items-center rounded-md font-semibold text-[#111]', large ? 'h-9 px-3 text-[19px]' : 'h-6 px-2 text-[13px]')}
      style={{ background: zoneColor(zone) }}
    >
      {zone}
    </span>
  );
}

/** Card body shared by the site board (links) and the kiosk board (buttons). */
export function TaskCardBody({ task, large }: { task: Task; large?: boolean }) {
  return (
    <>
      {task.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={task.image} alt="" className={cx('w-full object-cover', large ? 'h-44' : 'aspect-[16/9]')} loading="lazy" />
      )}
      <span className={cx('flex flex-col', large ? 'gap-3 p-4' : 'gap-2 p-3')}>
        <span className="flex flex-wrap items-center gap-1.5">
          <ZoneLabel zone={task.zone} large={large} />
        </span>
        <span className={cx('cap font-semibold leading-snug', large ? 'text-[24px]' : 'text-[15px]')}>{task.title}</span>
        {task.estimatedMinutes > 0 || !large ? (
          <span className={cx('flex items-center gap-3 text-muted', large ? 'text-[20px]' : 'text-[13px]')}>
            {task.estimatedMinutes > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className={large ? 'size-5' : 'size-3.5'} aria-hidden /> {formatMinutes(task.estimatedMinutes)}
              </span>
            )}
            {!large && <span className="tabular-nums">#{task.number}</span>}
          </span>
        ) : null}
        {task.assignees.length > 0 && task.status !== 'completed' && (
          <span className={cx('flex items-center gap-2 border-t border-line pt-2', large ? 'text-[20px]' : 'text-[13px]')}>
            <AvatarStack members={task.assignees} size={large ? 34 : 22} max={3} />
            <span className="min-w-0 flex-1 truncate">
              <strong>{names(task.assignees, 2)}</strong>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-warn">
              <span className="size-2 rounded-full bg-warn" aria-hidden /> working
            </span>
          </span>
        )}
      </span>
    </>
  );
}

export const cardClass =
  'pressable block w-full overflow-hidden rounded-xl border border-line bg-surface text-left shadow-[0_1px_2px_rgb(0_0_0/0.06)] hover:border-line-strong hover:shadow-md';

export function TaskCard({ task, href }: { task: Task; href?: string }) {
  return (
    <Link href={href ?? `/tasks/${task.id}`} className={cardClass}>
      <TaskCardBody task={task} />
    </Link>
  );
}

/**
 * Compact task tile — the workhorse. Title first, one meta line, photo as a
 * thumbnail. Small enough that a screen shows many tasks at once.
 */
export function TaskTileBody({ task, large }: { task: Task; large?: boolean }) {
  const busy = task.assignees.length > 0 && task.status !== 'completed';
  return (
    <span className={cx('flex w-full items-start', large ? 'gap-4 p-4' : 'gap-3 p-3')}>
      <span className="min-w-0 flex-1">
        <span className={cx('cap line-clamp-2 font-semibold leading-snug', large ? 'text-[22px]' : 'text-[15px]')}>{task.title}</span>
        <span className={cx('mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted', large ? 'text-[18px]' : 'text-[13px]')}>
          <span className="inline-flex items-center gap-1.5">
            <span className={cx('shrink-0 rounded-full', large ? 'size-3' : 'size-2.5')} style={{ background: zoneColor(task.zone) }} aria-hidden />
            {task.zone}
          </span>
          {task.estimatedMinutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className={large ? 'size-[18px]' : 'size-3.5'} aria-hidden /> {formatMinutes(task.estimatedMinutes)}
            </span>
          )}
        </span>
        {busy && (
          <span className={cx('mt-2 flex items-center gap-2 font-medium text-warn', large ? 'text-[18px]' : 'text-[13px]')}>
            <AvatarStack members={task.assignees} size={large ? 30 : 20} max={3} />
            <span className="truncate">{names(task.assignees, 1)} on it</span>
          </span>
        )}
      </span>
      {task.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={task.image} alt="" className={cx('shrink-0 rounded-lg object-cover', large ? 'size-24' : 'size-16')} loading="lazy" />
      )}
    </span>
  );
}

export const tileClass =
  'pressable flex w-full min-w-0 rounded-xl border border-line bg-surface text-left hover:border-line-strong hover:shadow-sm';

export function TaskTile({ task }: { task: Task }) {
  return (
    <Link href={`/tasks/${task.id}`} className={tileClass}>
      <TaskTileBody task={task} />
    </Link>
  );
}

/** "Done" column card: what was finished and by whom. */
export function DoneCardBody({ win, large }: { win: Win; large?: boolean }) {
  return (
    <>
      {win.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={win.photo} alt="" className={cx('w-full object-cover', large ? 'h-44' : 'aspect-[16/9]')} loading="lazy" />
      )}
      <span className={cx('flex flex-col', large ? 'gap-3 p-4' : 'gap-2 p-3')}>
        {win.task && (
          <span className="flex items-center gap-1.5">
            <ZoneLabel zone={win.task.zone} large={large} />
          </span>
        )}
        <span className={cx('cap font-semibold leading-snug', large ? 'text-[24px]' : 'text-[15px]')}>{win.task?.title ?? 'A task'}</span>
        {win.note && (
          <span className={cx('line-clamp-2 text-ink-2', large ? 'text-[19px]' : 'text-[13px]')}>“{capitalize(win.note)}”</span>
        )}
        <span className={cx('flex items-center gap-2 border-t border-line pt-2', large ? 'text-[20px]' : 'text-[13px]')}>
          <AvatarStack members={win.members} size={large ? 36 : 24} max={3} />
          <span className="min-w-0 flex-1 truncate">
            <strong>{names(win.members, 2)}</strong>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-medium text-good">
            <Check className={large ? 'size-5' : 'size-3.5'} strokeWidth={3} aria-hidden /> {timeAgo(win.created)}
          </span>
        </span>
      </span>
    </>
  );
}

export function DoneCard({ win }: { win: Win }) {
  return win.task ? (
    <Link href={`/tasks/${win.task.id}`} className={cardClass}>
      <DoneCardBody win={win} />
    </Link>
  ) : (
    <div className={cardClass}>
      <DoneCardBody win={win} />
    </div>
  );
}

/** A Trello-style list column. */
export function BoardColumn({
  title,
  count,
  dot,
  children,
  className,
}: {
  title: string;
  count: number;
  dot: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('min-w-0 flex-col rounded-2xl bg-surface-2 p-2.5', className ?? 'flex')}>
      <h2 className="flex items-center gap-2 px-1.5 pb-2.5 pt-1 text-[15px] font-semibold">
        <span className="size-2.5 rounded-full" style={{ background: dot }} aria-hidden />
        {title}
        <span className="rounded-full bg-surface px-2 text-[13px] font-medium tabular-nums text-muted">{count}</span>
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/** One line of "who finished what" — the core of recognising people's work. */
export function WinRow({ win, size = 'md' }: { win: Win; size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  const body = (
    <>
      <span className="relative shrink-0">
        <Avatar member={win.members[0]} size={lg ? 56 : 44} />
        <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-good text-paper ring-2 ring-surface" aria-hidden>
          <Check className="size-3" strokeWidth={3.5} />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx('block leading-snug', lg ? 'text-xl' : 'text-[15px]')}>
          <strong>{names(win.members, 2)}</strong> <span className="text-muted">{win.partial ? 'worked on' : 'finished'}</span>{' '}
          <span className="cap font-semibold">{win.task?.title ?? 'a task'}</span>
        </span>
        <span className={cx('mt-0.5 flex flex-wrap items-center gap-x-3 text-muted', lg ? 'text-base' : 'text-sm')}>
          {timeAgo(win.created)}
          <span>{formatMinutes(win.minutes)}</span>
          {win.task && <ZoneTag zone={win.task.zone} className={lg ? 'text-base' : 'text-sm'} />}
        </span>
        {win.note && <span className={cx('mt-1 line-clamp-2 block text-ink-2', lg ? 'text-base' : 'text-sm')}>“{capitalize(win.note)}”</span>}
      </span>
      {win.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={win.photo} alt="" className={cx('shrink-0 rounded-xl object-cover', lg ? 'size-20' : 'size-16')} loading="lazy" />
      )}
    </>
  );
  const cls = 'flex items-start gap-3.5 rounded-xl p-3 hover:bg-surface-2';
  return win.task ? (
    <Link href={`/tasks/${win.task.id}`} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function CreationCard({ creation, className }: { creation: Creation; className?: string }) {
  return (
    <Link
      href={`/creations/${creation.id}`}
      className={cx('pressable group block overflow-hidden rounded-2xl border border-line-strong/70 bg-surface hover:border-ink', className)}
    >
      <div className="relative bg-surface-2">
        {creation.thumbs[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creation.thumbs[0]} alt={creation.title} className="aspect-square w-full object-cover" loading="lazy" />
        ) : (
          <div className="aspect-square w-full" />
        )}
        {creation.featured && (
          <span className="absolute left-2.5 top-2.5 inline-flex h-7 items-center gap-1 rounded-full bg-hivis px-2.5 text-xs font-semibold text-hivis-ink">
            <Star className="size-3.5 fill-current" aria-hidden /> Featured
          </span>
        )}
        {creation.photos.length > 1 && (
          <span className="absolute right-2.5 top-2.5 inline-flex h-7 items-center gap-1 rounded-full bg-black/70 px-2.5 text-xs font-semibold text-white">
            <Images className="size-3.5" aria-hidden /> {creation.photos.length}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 p-3.5">
        <span className="hidden sm:block">
          <Avatar member={creation.member} size={34} />
        </span>
        <div className="min-w-0">
          <h3 className="cap line-clamp-2 font-semibold leading-tight">{creation.title}</h3>
          <p className="truncate text-sm text-muted">
            {creation.member.name} · {timeAgo(creation.created)}
          </p>
        </div>
      </div>
    </Link>
  );
}
