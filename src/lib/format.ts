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

export function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Zone label colours (dark text on these passes AA). */
export const ZONE_STYLE: Record<string, { color: string; code: string }> = {
  General: { color: '#9aa0a6', code: 'GEN' },
  Woodshop: { color: '#b07444', code: 'WSH' },
  '3D Printing': { color: '#4d8dff', code: '3DP' },
  Electronics: { color: '#2fbf71', code: 'ELC' },
  'Laser Cutting': { color: '#ff5a3c', code: 'LSR' },
  CNC: { color: '#9b7bff', code: 'CNC' },
  Vinyl: { color: '#e45bb3', code: 'VNL' },
  'Metal Shop': { color: '#8fa3b8', code: 'MTL' },
  Waterjet: { color: '#22c3d6', code: 'WJT' },
  'CNC Plasma': { color: '#ff9d2e', code: 'PLS' },
  Mill: { color: '#7fbf3f', code: 'MIL' },
  Lathe: { color: '#d9a441', code: 'LTH' },
  Admin: { color: '#b8a8ff', code: 'ADM' },
};

export function zoneColor(zone: string) {
  return (ZONE_STYLE[zone] ?? ZONE_STYLE.General).color;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
