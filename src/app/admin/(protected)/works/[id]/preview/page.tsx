import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkDetail } from "@/components/works/work-detail";
import { getWorkRepository } from "@/lib/works/server-repository";

type Params = Promise<{ id: string }>;

export default async function PreviewWorkPage({ params }: { params: Params }) {
  const work = await getWorkRepository().getWorkById((await params).id);
  if (!work) notFound();
  return (
    <main className="admin-workspace work-admin-preview">
      <header className="admin-workspace-head">
        <div><p className="eyebrow">DRAFT PREVIEW</p><h1>{work.name}</h1><p className="muted">此页面只有管理员可以访问。</p></div>
        <div className="admin-workspace-actions"><Link className="btn" href={`/admin/works/${work.id}/edit`}>返回编辑</Link><Link className="btn" href="/admin/works">作品列表</Link></div>
      </header>
      <WorkDetail preview work={work} />
    </main>
  );
}
