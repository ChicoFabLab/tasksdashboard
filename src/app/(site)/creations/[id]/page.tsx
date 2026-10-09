import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { getCreation } from '@/lib/server/data';
import { getCurrentUser } from '@/lib/server/session';
import { shortDate } from '@/lib/format';
import { Avatar, ButtonLink, Notice } from '@/components/ui';
import { Gallery } from '@/components/gallery';
import { CreationOwnerActions } from '@/components/creation-admin';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const c = await getCreation((await params).id);
  return { title: c?.title ?? 'Creation', openGraph: c?.thumbs[0] ? { images: [c.thumbs[0]] } : undefined };
}

export default async function CreationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ shared?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const [c, user] = await Promise.all([getCreation(id), getCurrentUser()]);
  if (!c) notFound();
  const owner = user?.id === c.volunteerId;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/creations" className="mb-5 inline-flex h-11 items-center gap-2 rounded-xl pr-3 text-[15px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-5" aria-hidden /> All creations
      </Link>
      {sp.shared && (
        <div className="mb-6">
          <Notice tone="good">Shared! It’s in the gallery and on the big screen.</Notice>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <Gallery photos={c.photos} thumbs={c.thumbs} title={c.title} />
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">{c.title}</h1>
          <Link href={`/makers/${c.member.id}`} className="mt-4 inline-flex items-center gap-3 rounded-full pr-3 hover:bg-surface-2">
            <Avatar member={c.member} size={44} />
            <span>
              <span className="block font-semibold">{c.member.name}</span>
              <span className="block text-sm text-muted">{shortDate(c.created)}</span>
            </span>
          </Link>
          {c.description.trim() && <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink-2">{c.description.trim()}</p>}
          {(owner || user?.isAdmin) && (
            <div className="mt-8 space-y-3 border-t border-line pt-6">
              <ButtonLink href={`/creations/${c.id}/edit`} variant="secondary" size="sm">
                <Pencil className="size-4" aria-hidden /> Edit
              </ButtonLink>
              <CreationOwnerActions id={c.id} canDelete canFeature={Boolean(user?.isAdmin)} featured={c.featured} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
