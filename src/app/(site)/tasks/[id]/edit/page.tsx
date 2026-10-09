import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { getTask } from '@/lib/server/data';
import { taskNo } from '@/lib/format';
import { PageHeader } from '@/components/ui';
import { TaskForm } from '@/components/task-form';

export const metadata = { title: 'Edit task' };

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/tasks/${id}/edit`);
  const task = await getTask(id);
  if (!task) notFound();
  if (!user.isAdmin && task.createdBy !== user.id) redirect(`/tasks/${id}`);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit ${taskNo(task.number)}`} />
      <TaskForm task={task} isAdmin={user.isAdmin} />
    </div>
  );
}
