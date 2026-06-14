import type { Metadata } from "next";

import { PageShell } from "@/components/chrome/page-shell";
import { CollectionCard } from "@/components/collections/collection-card";
import { CollectionFilters } from "@/components/collections/collection-filters";
import { parsePublicCollectionQuery } from "@/lib/collections/queries";
import { getCollectionRepository } from "@/lib/collections/server-repository";

export const metadata: Metadata = { title: "内容收藏" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CollectionsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parsePublicCollectionQuery(await searchParams);
  let data = null;
  try { data = await getCollectionRepository().listPublic(query); } catch { data = null; }
  return <PageShell eyebrow="COLLECTIONS" title="内容收藏" description="值得反复阅读或观看的外部文章与视频。"><CollectionFilters tags={data?.availableTags ?? []} />{!data ? <section className="admin-empty glass"><h2>内容收藏暂时无法加载</h2><p className="muted">请稍后重试。</p></section> : data.collections.length ? <section className="collection-grid">{data.collections.map((collection) => <CollectionCard collection={collection} key={collection.id} />)}</section> : <section className="admin-empty glass"><h2>没有符合条件的收藏</h2><p className="muted">调整类型、关键词或标签后重试。</p></section>}</PageShell>;
}
