import type { Metadata } from "next";

import { PageShell } from "@/components/chrome/page-shell";
import { FeaturedProjectCard } from "@/components/featured-projects/project-card";
import { FeaturedProjectFilters } from "@/components/featured-projects/project-filters";
import { parsePublicFeaturedProjectQuery } from "@/lib/featured-projects/queries";
import { getFeaturedProjectRepository } from "@/lib/featured-projects/server-repository";

export const metadata: Metadata = { title: "优秀项目" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parsePublicFeaturedProjectQuery(await searchParams);
  let data = null;
  try { data = await getFeaturedProjectRepository().listPublic(query); } catch { data = null; }
  return <PageShell eyebrow="FEATURED GITHUB PROJECTS" title="优秀项目" description="手动维护、值得深入了解的 GitHub 项目。"><FeaturedProjectFilters languages={data?.availableLanguages ?? []} tags={data?.availableTags ?? []} />{!data ? <section className="admin-empty glass"><h2>优秀项目暂时无法加载</h2><p className="muted">请稍后重试。</p></section> : data.projects.length ? <section className="featured-project-grid">{data.projects.map((project) => <FeaturedProjectCard key={project.id} project={project} />)}</section> : <section className="admin-empty glass"><h2>没有符合条件的项目</h2><p className="muted">调整关键词、语言或标签后重试。</p></section>}</PageShell>;
}
