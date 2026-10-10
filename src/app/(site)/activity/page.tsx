import Link from 'next/link';
import { PERIODS, recentWins, tasksLogged, type Period } from '@/lib/server/data';
import { WinRow } from '@/components/cards';
import { EmptyState, LoggedList, PageHeader, Panel, cx } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Activity' };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const requested = (await searchParams).period;
  let period: Period;
  let rows;
  if (PERIODS.some((p) => p.key === requested)) {
    period = requested as Period;
    rows = await tasksLogged(period, 25);
  } else {
    // Default to the most recent period that actually has a few people in it.
    period = 'month';
    rows = await tasksLogged('month', 25);
    if (rows.length < 3) [period, rows] = ['90d', await tasksLogged('90d', 25)];
    if (rows.length < 3) [period, rows] = ['all', await tasksLogged('all', 25)];
  }
  const wins = await recentWins(40);

  return (
    <>
      <PageHeader title="Activity" subtitle="What’s been getting done around the lab, and who’s been pitching in." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel
          title="Tasks logged"
          action={
            <div role="tablist" aria-label="Period" className="flex rounded-lg bg-surface-2 p-0.5">
              {PERIODS.map((p) => (
                <Link
                  key={p.key}
                  role="tab"
                  aria-selected={p.key === period}
                  href={`/activity?period=${p.key}`}
                  className={cx('inline-flex h-9 items-center rounded-md px-3 text-sm font-medium', p.key === period ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          }
        >
          {rows.length ? (
            <LoggedList rows={rows} />
          ) : (
            <EmptyState
              title="Quiet stretch"
              body="Nobody has finished a task in this period yet — be the first."
              action={
                <Link href="/activity?period=all" className="font-semibold text-accent hover:underline">
                  See all time
                </Link>
              }
            />
          )}
        </Panel>

        <Panel title="Who finished what" className="scroll-mt-24" bodyClass="p-2">
          <div id="activity" />
          {wins.length ? wins.map((w) => <WinRow key={w.key} win={w} />) : <p className="p-3 text-sm text-muted">No activity yet.</p>}
        </Panel>
      </div>
    </>
  );
}
