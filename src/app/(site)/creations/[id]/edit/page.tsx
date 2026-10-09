import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { getCreation } from '@/lib/server/data';
import { PageHeader } from '@/components/ui';
import { CreationForm } from '@/components/creation-form';

export const metadata = { title: 'Edit creation' };

export default async function EditCreationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/creations/${id}/edit`);
  const c = await getCreation(id);
  if (!c) notFound();
  if (c.volunteerId !== user.id && !user.isAdmin) redirect(`/creations/${id}`);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit creation" />
      <CreationForm creation={c} />
    </div>
  );
}
