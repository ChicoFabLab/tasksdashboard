import 'server-only';
import type { RecordModel } from 'pocketbase';
import { adminPb, isNotFound } from './pb';
import {
  toCompletion,
  toCreation,
  toMember,
  toTask,
  type Completion,
  type Creation,
  type Member,
  type Task,
  type TaskStatus,
} from '../types';

const BOARD = process.env.BOARD_ID || 'main';

/** Records created before boards existed have an empty board; treat them as the main board. */
function boardFilter(pb: Awaited<ReturnType<typeof adminPb>>) {
  return BOARD === 'main' ? `(board = "" || board = "main")` : pb.filter('board = {:b}', { b: BOARD });
}

// ---------- Tasks ----------

export async function listTasks(
  opts: { status?: TaskStatus | TaskStatus[]; zone?: string; limit?: number; includeArchived?: boolean } = {},
) {
  const pb = await adminPb();
  const parts = [boardFilter(pb)];
  // Tasks retired by renaming them "[ARCHIVED] …" stay out of public views.
  if (!opts.includeArchived) parts.push('title !~ "[ARCHIVED]%"');
  const statuses = opts.status ? (Array.isArray(opts.status) ? opts.status : [opts.status]) : [];
  if (statuses.length) {
    parts.push('(' + statuses.map((s, i) => pb.filter(`status = {:s${i}}`, { [`s${i}`]: s })).join(' || ') + ')');
  }
  if (opts.zone) parts.push(pb.filter('zone = {:z}', { z: opts.zone }));
  const res = await pb.collection('tasks').getList(1, opts.limit ?? 200, {
    filter: parts.join(' && '),
    sort: '-created',
    expand: 'assigned_to',
  });
  return res.items.map(toTask);
}

export async function getTask(id: string): Promise<Task | null> {
  if (!/^[a-z0-9]{15}$/.test(id)) return null;
  const pb = await adminPb();
  try {
    return toTask(await pb.collection('tasks').getOne(id, { expand: 'assigned_to' }));
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

/** Task numbers are not unique in historical data; prefer the most relevant match. */
export async function findTasksByNumber(n: number): Promise<Task[]> {
  if (!Number.isInteger(n) || n <= 0) return [];
  const pb = await adminPb();
  const res = await pb.collection('tasks').getFullList({
    filter: pb.filter('task_number = {:n}', { n }) + ' && ' + boardFilter(pb),
    expand: 'assigned_to',
    sort: '-created',
  });
  const rank: Record<string, number> = { open: 0, in_progress: 1, pending_approval: 2, completed: 3 };
  return res.map(toTask).sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
}

export async function nextTaskNumber(): Promise<number> {
  const pb = await adminPb();
  const res = await pb.collection('tasks').getList(1, 1, { sort: '-task_number', fields: 'task_number' });
  return (Number(res.items[0]?.task_number) || 0) + 1;
}

export async function completionsForTask(taskId: string): Promise<Completion[]> {
  const pb = await adminPb();
  const res = await pb.collection('completions').getFullList({
    filter: pb.filter('task = {:t}', { t: taskId }),
    expand: 'volunteer,task',
    sort: '-created',
  });
  return res.map(toCompletion);
}

// ---------- Completions & stats ----------

export async function recentCompletions(limit = 12): Promise<Completion[]> {
  const pb = await adminPb();
  const res = await pb.collection('completions').getList(1, limit, {
    sort: '-created',
    expand: 'volunteer,task',
  });
  return res.items.map(toCompletion);
}

/**
 * Group completions that were logged together for the same task (a team finishing
 * a task produces one completion per person) so the feed shows one "win" per task.
 */
export interface Win {
  key: string;
  task: Completion['task'];
  members: Member[];
  minutes: number;
  note: string;
  photo: string | null;
  created: string;
}

export function groupWins(items: Completion[]): Win[] {
  const wins: Win[] = [];
  const byKey = new Map<string, Win>();
  for (const c of items) {
    const key = c.task ? `${c.task.id}:${c.created.slice(0, 13)}` : c.id;
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.members.some((m) => m.id === c.member.id)) existing.members.push(c.member);
      existing.minutes += c.minutes;
      existing.photo ||= c.photo;
      existing.note ||= c.note;
      continue;
    }
    const win: Win = {
      key,
      task: c.task,
      members: [c.member],
      minutes: c.minutes,
      note: c.note,
      photo: c.photo,
      created: c.created,
    };
    byKey.set(key, win);
    wins.push(win);
  }
  return wins;
}

export async function recentWins(limit = 8): Promise<Win[]> {
  return groupWins(await recentCompletions(limit * 3)).slice(0, limit);
}

function pbDate(d: Date) {
  return d.toISOString().replace('T', ' ');
}

export interface LabStats {
  tasksDone30d: number;
  hours30d: number;
  makers30d: number;
  openTasks: number;
  tasksDoneAllTime: number;
  hoursAllTime: number;
  topMakers: { member: Member; minutes: number; tasks: number }[];
  /** 'last 90 days' or 'all time' — whichever gives a meaningful leaderboard. */
  topMakersWindow: string;
  /** Most recent completion, for "last finished 3 days ago by …". */
  lastWin: { member: Member; created: string } | null;
}

export async function labStats(): Promise<LabStats> {
  const pb = await adminPb();
  const since = new Date(Date.now() - 30 * 864e5);
  const [all, open] = await Promise.all([
    pb.collection('completions').getFullList({
      fields: 'id,task,volunteer,actual_minutes,created,expand.volunteer.id,expand.volunteer.username,expand.volunteer.discord_username,expand.volunteer.profile_photo',
      expand: 'volunteer',
    }),
    pb.collection('tasks').getList(1, 1, {
      filter: `status = "open" && ${boardFilter(pb)}`,
      fields: 'id',
    }),
  ]);
  const recent = all.filter((c) => c.created >= pbDate(since));
  const minutes = (xs: RecordModel[]) => xs.reduce((s, c) => s + (Number(c.actual_minutes) || 0), 0);

  // Leaderboard: last 90 days, or all time if fewer than 3 people were active recently.
  const since90 = pbDate(new Date(Date.now() - 90 * 864e5));
  const recentMakers = new Set(all.filter((c) => c.created >= since90).map((c) => c.volunteer)).size;
  const cutoff = recentMakers >= 3 ? since90 : '';
  const tally = new Map<string, { member: Member; minutes: number; tasks: Set<string> }>();
  for (const c of all) {
    if (c.created < cutoff || !c.volunteer) continue;
    const t = tally.get(c.volunteer) ?? {
      member: toMember(c.expand?.volunteer as RecordModel),
      minutes: 0,
      tasks: new Set<string>(),
    };
    t.minutes += Number(c.actual_minutes) || 0;
    t.tasks.add(c.task);
    tally.set(c.volunteer, t);
  }

  return {
    tasksDone30d: new Set(recent.map((c) => c.task)).size,
    hours30d: Math.round(minutes(recent) / 60),
    makers30d: new Set(recent.map((c) => c.volunteer)).size,
    openTasks: open.totalItems,
    tasksDoneAllTime: new Set(all.map((c) => c.task)).size,
    hoursAllTime: Math.round(minutes(all) / 60),
    topMakers: [...tally.values()]
      .filter((t) => t.member.id)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5)
      .map((t) => ({ member: t.member, minutes: t.minutes, tasks: t.tasks.size })),
    topMakersWindow: cutoff ? 'Last 90 days' : 'All time',
    lastWin: (() => {
      const last = all.reduce<RecordModel | null>((a, c) => (!a || c.created > a.created ? c : a), null);
      return last ? { member: toMember(last.expand?.volunteer as RecordModel), created: last.created } : null;
    })(),
  };
}

// ---------- Creations ----------

export async function listCreations(opts: { limit?: number; volunteerId?: string } = {}): Promise<Creation[]> {
  const pb = await adminPb();
  const res = await pb.collection('creations').getList(1, opts.limit ?? 60, {
    sort: '-created',
    expand: 'volunteer',
    filter: opts.volunteerId ? pb.filter('volunteer = {:v}', { v: opts.volunteerId }) : '',
  });
  const items = res.items.map(toCreation);
  // Featured ones float to the top, newest first within each group.
  return items.sort((a, b) => Number(b.featured) - Number(a.featured));
}

export async function getCreation(id: string): Promise<(Creation & { volunteerId: string }) | null> {
  if (!/^[a-z0-9]{15}$/.test(id)) return null;
  const pb = await adminPb();
  try {
    const rec = await pb.collection('creations').getOne(id, { expand: 'volunteer' });
    return { ...toCreation(rec), volunteerId: rec.volunteer };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

// ---------- Members ----------

export async function getMember(id: string): Promise<Member | null> {
  if (!/^[a-z0-9]{15}$/.test(id)) return null;
  const pb = await adminPb();
  try {
    return toMember(await pb.collection('volunteers').getOne(id));
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export interface MemberActivity {
  completions: Completion[];
  creations: Creation[];
  activeTasks: Task[];
  minutes: number;
  tasksDone: number;
}

export async function memberActivity(id: string): Promise<MemberActivity> {
  const pb = await adminPb();
  const [completions, creations, active, logged] = await Promise.all([
    pb.collection('completions').getFullList({
      filter: pb.filter('volunteer = {:v}', { v: id }),
      expand: 'task,volunteer',
      sort: '-created',
    }),
    listCreations({ volunteerId: id }),
    pb.collection('tasks').getFullList({
      filter: pb.filter('assigned_to ?= {:v} && status != "completed"', { v: id }),
      expand: 'assigned_to',
      sort: '-updated',
    }),
    pb
      .collection('volunteer_hours')
      .getFullList({ filter: pb.filter('volunteer = {:v}', { v: id }), fields: 'hours' })
      .catch(() => [] as RecordModel[]),
  ]);
  const c = completions.map(toCompletion);
  const extra = logged.reduce((s, h) => s + (Number(h.hours) || 0) * 60, 0);
  return {
    completions: c,
    creations,
    activeTasks: active.map(toTask),
    minutes: Math.round(c.reduce((s, x) => s + x.minutes, 0) + extra),
    tasksDone: new Set(c.map((x) => x.task?.id).filter(Boolean)).size,
  };
}

/** Lightweight list for "who helped?" pickers — names and photos only. */
export async function listMembersForPicker(): Promise<Member[]> {
  const pb = await adminPb();
  const res = await pb.collection('volunteers').getFullList({
    fields: 'id,username,discord_username,profile_photo',
    sort: 'username',
  });
  return res.map(toMember).filter((m) => m.name !== 'A maker');
}
