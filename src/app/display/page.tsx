import type { Metadata } from 'next';
import { labStats, listCreations, listTasks, recentWins } from '@/lib/server/data';
import { absoluteUrl, siteConfig } from '@/lib/site-config';
import { Kiosk } from './kiosk';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: `${siteConfig.name} — Live board`, robots: { index: false } };

export default async function DisplayPage() {
  const [tasks, wins, creations, stats] = await Promise.all([
    listTasks({ status: ['open', 'in_progress'], limit: 200 }),
    recentWins(12),
    listCreations({ limit: 10 }),
    labStats(),
  ]);
  return (
    <Kiosk
      tasks={tasks}
      wins={wins}
      creations={creations}
      stats={{
        tasks: stats.tasksDone30d >= 10 ? stats.tasksDone30d : stats.tasksDoneAllTime,
        hours: stats.tasksDone30d >= 10 ? stats.hours30d : stats.hoursAllTime,
        window: stats.tasksDone30d >= 10 ? 'last 30 days' : 'all time',
        lastWin: stats.lastWin,
      }}
      urls={{ base: absoluteUrl(''), signup: absoluteUrl('/signup'), share: absoluteUrl('/creations/new'), tasks: absoluteUrl('/tasks') }}
    />
  );
}
