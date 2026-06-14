import Link from "next/link";

import { ProjectTrashCard } from "@/components/admin/featured-projects/project-trash-card";
import { getFeaturedProjectRepository } from "@/lib/featured-projects/server-repository";

export default async function ProjectsTrashPage() {
  let projects = null;
  try { projects = await getFeaturedProjectRepository().listTrash(); } catch { projects = null; }
  return <main className="admin-workspace"><header className="admin-workspace-head"><div><p className="eyebrow">PROJECTS TRASH</p><h1>优秀项目回收站</h1><p className="muted">恢复后强制变为草稿；永久删除无法撤销。</p></div><Link className="btn" href="/admin/projects">返回项目列表</Link></header>{!projects ? <section className="admin-empty glass"><h2>回收站暂时无法加载</h2><p className="muted">请稍后刷新页面。</p></section> : projects.length ? <section className="trash-plan-grid">{projects.map((project) => <ProjectTrashCard key={project.id} project={project} />)}</section> : <section className="admin-empty glass"><h2>回收站是空的</h2><p className="muted">移入回收站的项目会显示在这里。</p></section>}</main>;
}
