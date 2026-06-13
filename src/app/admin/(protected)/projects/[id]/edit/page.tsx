import Link from "next/link";
import { notFound } from "next/navigation";

import { updateFeaturedProjectAction } from "@/app/admin/(protected)/projects/actions";
import { ProjectEditor } from "@/components/admin/featured-projects/project-editor";
import { getFeaturedProjectRepository } from "@/lib/featured-projects/server-repository";

type Params = Promise<{ id: string }>;
export default async function EditProjectPage({ params }: { params: Params }) {
  const project = await getFeaturedProjectRepository().getById((await params).id);
  if (!project) notFound();
  return <main className="admin-workspace"><header className="admin-workspace-head"><div><p className="eyebrow">EDIT FEATURED PROJECT</p><h1>{project.name}</h1><p className="muted">保存后公开项目页和首页推荐候选会同步更新。</p></div><Link className="btn" href="/admin/projects">返回项目列表</Link></header><ProjectEditor action={updateFeaturedProjectAction.bind(null, project.id)} project={project} /></main>;
}
