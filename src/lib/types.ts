import type { RecordModel } from 'pocketbase';
import { fileUrl as fu } from './files';

/**
 * View models. Records are mapped to these on the server so pages only ever
 * receive the public-safe fields (never emails, Discord ids or tokens).
 */

export const ZONES = [
  'General',
  'Woodshop',
  '3D Printing',
  'Electronics',
  'Laser Cutting',
  'CNC',
  'Vinyl',
  'Metal Shop',
  'Waterjet',
  'CNC Plasma',
  'Mill',
  'Lathe',
  'Admin',
] as const;
export type Zone = (typeof ZONES)[number];

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'pending_approval';

export interface Member {
  id: string;
  name: string;
  photo: string | null;
  initials: string;
  email?: string;
}

export interface Task {
  id: string;
  number: number;
  title: string;
  description: string;
  zone: Zone;
  estimatedMinutes: number;
  status: TaskStatus;
  assignees: Member[];
  createdBy: string;
  image: string | null;
  created: string;
  updated: string;
}

export interface Completion {
  id: string;
  minutes: number;
  note: string;
  photo: string | null;
  created: string;
  /** Time logged without finishing the task ("I did some, someone else can finish"). */
  partial: boolean;
  member: Member;
  task: { id: string; number: number; title: string; zone: Zone } | null;
}

export interface Creation {
  id: string;
  title: string;
  description: string;
  photos: string[];
  thumbs: string[];
  featured: boolean;
  created: string;
  member: Member;
}

export function cleanName(rec: Partial<RecordModel> | null | undefined): string {
  if (!rec) return 'A maker';
  const candidates = [rec.username, rec.name, rec.discord_username];
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const v = c.trim();
    // Never surface emails or placeholder values publicly.
    if (v && v !== 'undefined' && v !== 'Volunteer' && !v.includes('@')) return v;
  }
  return 'A maker';
}

export function initials(name: string) {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/);
  const s = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return (s || name[0] || '?').toUpperCase();
}

export function toMember(rec: RecordModel | undefined | null): Member {
  if (!rec) return { id: '', name: 'A maker', photo: null, initials: '?' };
  const name = cleanName(rec);
  return {
    id: rec.id,
    name,
    initials: initials(name),
    photo: fu('volunteers', rec.id, rec.profile_photo, '160x160'),
  };
}

export function toTask(rec: RecordModel): Task {
  const assigned = (rec.expand?.assigned_to as RecordModel[] | undefined) ?? [];
  return {
    id: rec.id,
    number: Number(rec.task_number) || 0,
    title: rec.title || 'Untitled task',
    description: rec.description || '',
    zone: (ZONES as readonly string[]).includes(rec.zone) ? rec.zone : 'General',
    estimatedMinutes: Number(rec.estimated_minutes) || 0,
    status: rec.status || 'open',
    assignees: assigned.map(toMember),
    createdBy: rec.created_by || '',
    image: fu('tasks', rec.id, rec.image, '800x0'),
    created: rec.created,
    updated: rec.updated,
  };
}

export function toCompletion(rec: RecordModel): Completion {
  const t = rec.expand?.task as RecordModel | undefined;
  return {
    id: rec.id,
    minutes: Number(rec.actual_minutes) || 0,
    note: rec.completion_note && rec.completion_note !== 'Task completed' && rec.completion_note !== 'Completed successfully'
      ? rec.completion_note
      : '',
    photo: fu('completions', rec.id, rec.photo, '800x0'),
    created: rec.created,
    partial: rec.partial === true,
    member: toMember(rec.expand?.volunteer as RecordModel | undefined),
    task: t
      ? { id: t.id, number: Number(t.task_number) || 0, title: t.title || 'Task', zone: t.zone || 'General' }
      : null,
  };
}

export function toCreation(rec: RecordModel): Creation {
  const photos: string[] = Array.isArray(rec.photos) ? rec.photos : rec.photos ? [rec.photos] : [];
  return {
    id: rec.id,
    title: rec.title || 'Untitled',
    description: rec.description || '',
    photos: photos.map((p) => fu('creations', rec.id, p)!).filter(Boolean),
    thumbs: photos.map((p) => fu('creations', rec.id, p, '800x0')!).filter(Boolean),
    featured: rec.featured === true,
    created: rec.created,
    member: toMember(rec.expand?.volunteer as RecordModel | undefined),
  };
}
