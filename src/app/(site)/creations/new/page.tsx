import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { PageHeader } from '@/components/ui';
import { CreationForm } from '@/components/creation-form';

export const metadata = { title: 'Share a creation' };

export default async function NewCreationPage() {
  if (!(await getCurrentUser())) redirect('/login?next=/creations/new');
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Share a creation" subtitle="It’ll appear in the gallery, on your profile and on the lab’s big screen." />
      <CreationForm />
    </div>
  );
}
