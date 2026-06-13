import Link from "next/link";

import { ProjectAdminCard } from "@/components/admin/featured-projects/project-admin-card";
import { ProjectFilters } from "@/components/admin/featured-projects/project-filters";
import { parseAdminFeaturedProjectQuery } from "@/lib/featured-projects/queries";
import { getFeaturedProjectRepository } from "@/lib/featured-projects/server-repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function AdminProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseAdminFeaturedProjectQuery(await searchParams);
  let data = null;
  try { data = await getFeaturedProjectRepository().listAdmin(query); } catch { data = null; }
  return <main className="admin-workspace"><header className="admin-workspace-head"><div><p className="eyebrow">FEATURED PROJECTS</p><h1>优秀项目后台</h1><p className="muted">手动维护值得推荐的 GitHub 项目。</p></div><div className="admin-workspace-actions"><Link className="btn" href="/admin">返回后台</Link><Link className="btn" href="/admin/projects/trash">回收站</Link><Link className="btn primary" href="/admin/projects/new">新建项目</Link></div></header><ProjectFilters languages={data?.availableLanguages ?? []} />{!data ? <section className="admin-empty glass"><h2>项目暂时无法加载</h2><p className="muted">请确认已执行流程 4 数据库迁移，或稍后重试。</p></section> : data.projects.length ? <section className="admin-plan-grid">{data.projects.map((project) => <ProjectAdminCard key={project.id} project={project} />)}</section> : <section className="admin-empty glass"><h2>没有符合条件的项目</h2><p className="muted">调整筛选条件，或创建第一条项目推荐。</p></section>}</main>;
}
