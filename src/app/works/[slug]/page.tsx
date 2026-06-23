import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/chrome/page-shell";
import { WorkDetail } from "@/components/works/work-detail";
import { publicMediaUrlForPath } from "@/lib/media/display";
import { resolveWorkDisplayMedia } from "@/lib/works/media";
import { getWorkRepository } from "@/lib/works/server-repository";

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  try {
    return await getWorkRepository().getPublicWorkBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const work = await load((await params).slug);
  if (!work) return {};
  const displayWork = resolveWorkDisplayMedia(work, publicMediaUrlForPath);
  return {
    title: work.seoTitle ?? work.name,
    description: work.seoDescription ?? work.summary ?? undefined,
    openGraph:
      displayWork.seoImagePath || displayWork.coverPath
        ? { images: [displayWork.seoImagePath ?? displayWork.coverPath!] }
        : undefined,
  };
}

export default async function WorkDetailPage({ params }: { params: Params }) {
  const work = await load((await params).slug);
  if (!work) notFound();
  return (
    <PageShell description={work.summary ?? "作品详情"} eyebrow="WORK DETAIL" title={work.name}>
      <WorkDetail work={work} />
    </PageShell>
  );
}
