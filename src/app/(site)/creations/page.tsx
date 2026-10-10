import { Plus } from 'lucide-react';
import { listCreations } from '@/lib/server/data';
import { CreationCard } from '@/components/cards';
import { ButtonLink, EmptyState, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Creations' };

export default async function CreationsPage() {
  const creations = await listCreations({ limit: 120 });
  return (
    <>
      <PageHeader
        title="Creations"
        subtitle="Things people made at the lab. Yours belongs here too."
        action={
          <ButtonLink href="/creations/new" variant="sun">
            <Plus className="size-5" aria-hidden /> Share yours
          </ButtonLink>
        }
      />
      {creations.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {creations.map((c, i) => (
            <CreationCard key={c.id} creation={c} className={i === 0 && c.featured ? 'col-span-2 row-span-2' : undefined} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="The gallery is waiting"
          body="Laser-cut signs, 3D prints, furniture, circuits, half-finished experiments — it all counts."
          action={<ButtonLink href="/creations/new" variant="sun">Share the first one</ButtonLink>}
        />
      )}
    </>
  );
}
