import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { PageHeader } from '@/components/ui';
import { TaskForm } from '@/components/task-form';

export const metadata = { title: 'Post a task' };

export default async function NewTaskPage() {
  if (!(await getCurrentUser())) redirect('/login?next=/tasks/new');
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Post a task" subtitle="Something around the lab that someone could knock out in an hour or two." />
      <TaskForm />
    </div>
  );
}
