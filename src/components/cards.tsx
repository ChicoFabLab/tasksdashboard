import Link from 'next/link';
import { Clock, Images, Star } from 'lucide-react';
import type { Creation, Task } from '@/lib/types';
import type { Win } from '@/lib/server/data';
import { formatMinutes, taskNo, timeAgo, zoneColor } from '@/lib/format';
import { Avatar, AvatarStack, StatusPill, ZoneTag, cx, names } from './ui';

export function TaskCard({ task, href, size = 'md' }: { task: Task; href?: string; size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <Link
      href={href ?? `/tasks/${task.id}`}
      className={cx(
        'group relative flex flex-col rounded-2xl border border-line bg-surface transition hover:border-line-strong hover:shadow-card active:scale-[0.99]',
        lg ? 'min-h-[188px] p-6' : 'min-h-[156px] p-5',
      )}
    >
      <span className="absolute inset-y-4 left-0 w-1 rounded-r-full" style={{ background: zoneColor(task.zone) }} aria-hidden />
      <div className="flex items-center justify-between gap-3">
        <span className={cx('font-mono font-medium text-muted', lg ? 'text-base' : 'text-sm')}>{taskNo(task.number)}</span>
        {task.status !== 'open' && <StatusPill status={task.status} />}
      </div>
      <h3 className={cx('mt-2 font-semibold leading-snug tracking-tight text-balance', lg ? 'text-2xl' : 'text-lg')}>{task.title}</h3>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
        <ZoneTag zone={task.zone} className={lg ? 'text-base' : undefined} />
        {task.estimatedMinutes > 0 && (
          <span className={cx('inline-flex items-center gap-1.5 text-muted', lg ? 'text-base' : 'text-[13px]')}>
            <Clock className="size-4" aria-hidden /> ~{formatMinutes(task.estimatedMinutes)}
          </span>
        )}
        {task.assignees.length > 0 && task.status !== 'completed' && (
          <span className="ml-auto">
            <AvatarStack members={task.assignees} size={lg ? 34 : 28} />
          </span>
        )}
      </div>
    </Link>
  );
}

export function WinCard({ win, className }: { win: Win; className?: string }) {
  const href = win.task ? `/tasks/${win.task.id}` : undefined;
  const body = (
    <>
      {win.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={win.photo} alt="" className="aspect-[4/3] w-full rounded-t-2xl object-cover" loading="lazy" />
      ) : (
        <div
          className="mat relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-t-2xl bg-surface-2"
          aria-hidden
        >
          <span className="absolute left-0 top-0 h-full w-1.5" style={{ background: zoneColor(win.task?.zone ?? 'General') }} />
          <span className="font-mono text-4xl font-semibold text-ink/80">{win.task ? taskNo(win.task.number) : '✓'}</span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-good">Done · {timeAgo(win.created)}</p>
          <h3 className="mt-1 line-clamp-2 font-semibold leading-snug">{win.task?.title ?? 'A task'}</h3>
          {win.note && <p className="mt-1 line-clamp-2 text-sm text-muted">“{win.note}”</p>}
        </div>
        <div className="mt-auto flex items-center gap-2.5">
          <AvatarStack members={win.members} size={28} max={3} />
          <p className="min-w-0 truncate text-sm font-medium">{names(win.members, 2)}</p>
          <span className="ml-auto shrink-0 text-sm text-muted">{formatMinutes(win.minutes)}</span>
        </div>
      </div>
    </>
  );
  const cls = cx('flex flex-col rounded-2xl border border-line bg-surface transition hover:shadow-card', className);
  return href ? (
    <Link href={href} className={cls}>
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
      className={cx('group block overflow-hidden rounded-2xl border border-line bg-surface transition hover:shadow-card', className)}
    >
      <div className="relative bg-surface-2">
        {creation.thumbs[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creation.thumbs[0]}
            alt={creation.title}
            className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="mat aspect-square w-full" />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {creation.featured && (
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-accent px-2.5 text-xs font-bold text-accent-ink">
              <Star className="size-3.5 fill-current" aria-hidden /> Featured
            </span>
          )}
        </div>
        {creation.photos.length > 1 && (
          <span className="absolute right-3 top-3 inline-flex h-7 items-center gap-1 rounded-full bg-black/60 px-2.5 text-xs font-semibold text-white">
            <Images className="size-3.5" aria-hidden /> {creation.photos.length}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 p-4">
        <Avatar member={creation.member} size={32} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold leading-tight">{creation.title}</h3>
          <p className="truncate text-sm text-muted">
            {creation.member.name} · {timeAgo(creation.created)}
          </p>
        </div>
      </div>
    </Link>
  );
}
