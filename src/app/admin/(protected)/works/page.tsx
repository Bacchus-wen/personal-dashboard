import Link from "next/link";

import { WorkAdminCard } from "@/components/admin/works/work-admin-card";
import { AdminWorkFilters } from "@/components/admin/works/work-filters";
import { parseAdminWorkQuery } from "@/lib/works/queries";
import { getWorkRepository } from "@/lib/works/server-repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminWorksPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseAdminWorkQuery(await searchParams);
  let data = null;
  try {
    data = await getWorkRepository().listAdminWorks(query);
  } catch {
    data = null;
  }
  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div><p className="eyebrow">PORTFOLIO WORKS</p><h1>我的作品后台</h1><p className="muted">管理草稿、公开作品、排序和详情内容。</p></div>
        <div className="admin-workspace-actions"><Link className="btn" href="/admin">返回后台</Link><Link className="btn" href="/admin/works/trash">回收站</Link><Link className="btn primary" href="/admin/works/new">新建作品</Link></div>
      </header>
      <AdminWorkFilters />
      {!data ? (
        <section className="admin-empty glass"><h2>作品暂时无法加载</h2><p className="muted">请检查是否已执行作品数据库迁移，或稍后重试。</p></section>
      ) : data.works.length ? (
        <section className="admin-plan-grid">{data.works.map((work) => <WorkAdminCard key={work.id} work={work} />)}</section>
      ) : (
        <section className="admin-empty glass"><h2>没有符合条件的作品</h2><p className="muted">调整筛选条件，或创建第一项作品。</p></section>
      )}
    </main>
  );
}
