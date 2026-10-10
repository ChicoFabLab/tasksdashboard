import type { Metadata } from 'next';
import { labStats, listCreations, listTasks, recentWins, tasksLogged } from '@/lib/server/data';
import { absoluteUrl, siteConfig } from '@/lib/site-config';
import { Kiosk } from './kiosk';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: `${siteConfig.name} — Live board`, robots: { index: false } };

export default async function DisplayPage() {
  const [tasks, wins, creations, stats, month, allTime] = await Promise.all([
    listTasks({ status: ['open', 'in_progress'], limit: 200 }),
    recentWins(7),
    listCreations({ limit: 60 }),
    labStats(),
    tasksLogged('month', 200),
    tasksLogged('all', 200),
  ]);
  return (
    <Kiosk
      tasks={tasks}
      wins={wins}
      creations={creations}
      boards={{ month, all: allTime }}
      stats={{ open: stats.openTasks, inProgress: stats.inProgressTasks, done: stats.tasksDoneAllTime, hours: stats.hoursAllTime }}
      urls={{ base: absoluteUrl(''), join: absoluteUrl('/login'), share: absoluteUrl('/creations/new') }}
    />
  );
}
