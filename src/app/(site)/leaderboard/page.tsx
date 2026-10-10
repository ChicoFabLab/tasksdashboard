import Link from 'next/link';
import { PERIODS, leaderboard, recentWins, type Period } from '@/lib/server/data';
import { WinRow } from '@/components/cards';
import { EmptyState, LeaderList, PageHeader, Panel, cx } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Leaderboard' };

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const requested = (await searchParams).period;
  const period: Period = PERIODS.some((p) => p.key === requested) ? (requested as Period) : 'month';
  const [rows, wins] = await Promise.all([leaderboard(period, 25), recentWins(40)]);

  return (
    <>
      <PageHeader title="Leaderboard" subtitle="Who’s been pitching in, ranked by hours logged on finished tasks." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel
          title="Top contributors"
          action={
            <div role="tablist" aria-label="Period" className="flex rounded-lg bg-surface-2 p-0.5">
              {PERIODS.map((p) => (
                <Link
                  key={p.key}
                  role="tab"
                  aria-selected={p.key === period}
                  href={p.key === 'month' ? '/leaderboard' : `/leaderboard?period=${p.key}`}
                  className={cx('inline-flex h-9 items-center rounded-md px-3 text-sm font-medium', p.key === period ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          }
        >
          {rows.length ? (
            <LeaderList rows={rows} />
          ) : (
            <EmptyState title="No finished tasks in this period" body="Pick something from the board to get things moving." />
          )}
        </Panel>

        <Panel title="Activity · who finished what" className="scroll-mt-24" bodyClass="p-2">
          <div id="activity" />
          {wins.length ? wins.map((w) => <WinRow key={w.key} win={w} />) : <p className="p-3 text-sm text-muted">No activity yet.</p>}
        </Panel>
      </div>
    </>
  );
}
