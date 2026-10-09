import type { Metadata } from 'next';
import { labStats, listCreations, listTasks, recentWins } from '@/lib/server/data';
import { absoluteUrl, siteConfig } from '@/lib/site-config';
import { Kiosk } from './kiosk';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: `${siteConfig.name} — Live board`, robots: { index: false } };

export default async function DisplayPage() {
  const [tasks, wins, creations, stats] = await Promise.all([
    listTasks({ status: ['open', 'in_progress'], limit: 200 }),
    recentWins(10),
    listCreations({ limit: 10 }),
    labStats(),
  ]);
  return (
    <Kiosk
      tasks={tasks}
      wins={wins}
      creations={creations}
      stats={
        stats.tasksDone30d >= 5
          ? { tasks: stats.tasksDone30d, hours: stats.hours30d, third: stats.makers30d, thirdLabel: 'makers', window: '30 days' }
          : { tasks: stats.tasksDoneAllTime, hours: stats.hoursAllTime, third: stats.openTasks, thirdLabel: 'open now', window: 'all time' }
      }
      urls={{ base: absoluteUrl(''), signup: absoluteUrl('/signup'), share: absoluteUrl('/creations/new') }}
    />
  );
}
