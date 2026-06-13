import Link from "next/link";

import { createFeaturedProjectAction } from "@/app/admin/(protected)/projects/actions";
import { ProjectEditor } from "@/components/admin/featured-projects/project-editor";

export default function NewProjectPage() { return <main className="admin-workspace"><header className="admin-workspace-head"><div><p className="eyebrow">NEW FEATURED PROJECT</p><h1>新建优秀项目</h1><p className="muted">可以先只填写名称并保存为草稿。</p></div><Link className="btn" href="/admin/projects">返回项目列表</Link></header><ProjectEditor action={createFeaturedProjectAction} /></main>; }
