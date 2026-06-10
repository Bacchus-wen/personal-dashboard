import type { Metadata } from "next";
import { PageShell } from "@/components/chrome/page-shell";
import { projects } from "@/data/site-content";

export const metadata: Metadata = { title: "我的项目" };

export default function ProjectsPage() {
  return <PageShell eyebrow="MADE BY THEODORE" title="我的项目" description="正在制作、维护与慢慢完善的东西。"><section className="project-grid">{projects.map((project) => <article className="project-card card glass lift" key={project.title}><div className="card-top"><div className="logo-block">{project.mark}</div><div><h2>{project.title} <span className="muted mono">{project.year}</span></h2><div className="tag-row">{project.tags.map((tag) => <span className="pill" key={tag}>{tag}</span>)}</div></div></div><p className="description">{project.description}</p><div><button className="btn">Website</button></div></article>)}</section></PageShell>;
}
