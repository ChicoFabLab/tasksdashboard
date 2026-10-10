import { notFound } from 'next/navigation';
import { getMember, memberActivity } from '@/lib/server/data';
import { Avatar } from '@/components/ui';
import { ActivityBody, ActivityStats } from '@/components/profile-sections';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const m = await getMember((await params).id);
  return { title: m?.name ?? 'Maker' };
}

export default async function MakerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getMember(id);
  if (!member) notFound();
  const a = await memberActivity(id);
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-5">
        <Avatar member={member} size={80} />
        <h1 className="display text-3xl font-bold sm:text-4xl">{member.name}</h1>
      </div>
      <ActivityStats a={a} />
      <ActivityBody a={a} />
    </div>
  );
}
