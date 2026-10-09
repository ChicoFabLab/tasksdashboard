export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  if (r === 0) return `${h} hr`;
  return `${h} hr ${r} min`;
}

export function formatHours(minutes: number): string {
  const h = minutes / 60;
  if (h < 10) return `${Math.round(h * 10) / 10}`;
  return `${Math.round(h)}`;
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** PocketBase dates look like "2025-10-07 18:22:01.123Z". */
export function parseDate(d: string): Date {
  return new Date(d.includes('T') ? d : d.replace(' ', 'T'));
}

export function timeAgo(d: string, now = Date.now()): string {
  const diff = (parseDate(d).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day');
  if (abs < 86400 * 60) return rtf.format(Math.round(diff / (86400 * 7)), 'week');
  return parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function shortDate(d: string): string {
  return parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function taskNo(n: number) {
  return `#${String(n).padStart(3, '0')}`;
}

/** Zone colours: used only as small dots/tags, never as large fills. */
export const ZONE_COLORS: Record<string, string> = {
  General: '#8a8578',
  Woodshop: '#a0672c',
  '3D Printing': '#2f6fd6',
  Electronics: '#1f9a6a',
  'Laser Cutting': '#d6402f',
  CNC: '#6b4fd1',
  Vinyl: '#c03d8f',
  'Metal Shop': '#5b6b7a',
  Waterjet: '#1d93b5',
  'CNC Plasma': '#c47a12',
  Mill: '#4f6d3a',
  Lathe: '#7a5a48',
  Admin: '#3f3d38',
};

export function zoneColor(zone: string) {
  return ZONE_COLORS[zone] ?? ZONE_COLORS.General;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
