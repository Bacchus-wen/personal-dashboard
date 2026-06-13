import type { Metadata } from "next";

import { PageShell } from "@/components/chrome/page-shell";
import { WorkCard } from "@/components/works/work-card";
import { WorkFilters } from "@/components/works/work-filters";
import { parsePublicWorkQuery } from "@/lib/works/queries";
import { getWorkRepository } from "@/lib/works/server-repository";

export const metadata: Metadata = { title: "我的作品" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function WorksPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parsePublicWorkQuery(await searchParams);
  let data = null;
  try {
    data = await getWorkRepository().listPublicWorks(query);
  } catch {
    data = null;
  }
  return (
    <PageShell action="作品" description="这里记录已经完成、持续维护和仍在成长的网站项目。" eyebrow="SELECTED WORKS" title="我的作品">
      {!data ? (
        <section className="admin-empty glass"><h2>作品暂时无法加载</h2><p className="muted">请稍后刷新页面。</p></section>
      ) : (
        <>
          <WorkFilters technologies={data.availableTech} />
          {data.works.length ? (
            <section className="work-grid">{data.works.map((work) => <WorkCard key={work.id} work={work} />)}</section>
          ) : (
            <section className="admin-empty glass"><h2>暂无公开作品</h2><p className="muted">可以调整筛选条件，或稍后再次查看。</p></section>
          )}
        </>
      )}
    </PageShell>
  );
}
