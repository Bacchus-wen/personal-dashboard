import Link from "next/link";

import { CollectionAdminCard } from "@/components/admin/collections/collection-admin-card";
import { CollectionFilters } from "@/components/admin/collections/collection-filters";
import { parseAdminCollectionQuery } from "@/lib/collections/queries";
import { getCollectionRepository } from "@/lib/collections/server-repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminCollectionsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseAdminCollectionQuery(await searchParams);
  let data = null;
  try { data = await getCollectionRepository().listAdmin(query); } catch { data = null; }
  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div><p className="eyebrow">COLLECTIONS</p><h1>内容收藏后台</h1><p className="muted">维护跳转到原网站的文章和视频收藏。</p></div>
        <div className="admin-workspace-actions"><Link className="btn" href="/admin">返回后台</Link><Link className="btn" href="/admin/collections/trash">回收站</Link><Link className="btn primary" href="/admin/collections/new">新建收藏</Link></div>
      </header>
      <CollectionFilters />
      {!data ? <section className="admin-empty glass"><h2>收藏暂时无法加载</h2><p className="muted">请确认已执行流程 4 数据库迁移，或稍后重试。</p></section> : data.collections.length ? <section className="admin-plan-grid">{data.collections.map((collection) => <CollectionAdminCard collection={collection} key={collection.id} />)}</section> : <section className="admin-empty glass"><h2>没有符合条件的收藏</h2><p className="muted">调整筛选条件，或创建第一条收藏。</p></section>}
    </main>
  );
}
