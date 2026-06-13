import Link from "next/link";
import { notFound } from "next/navigation";

import { updateWorkAction } from "@/app/admin/(protected)/works/actions";
import { WorkEditor } from "@/components/admin/works/work-editor";
import { getWorkRepository } from "@/lib/works/server-repository";

type Params = Promise<{ id: string }>;

export default async function EditWorkPage({ params }: { params: Params }) {
  const work = await getWorkRepository().getWorkById((await params).id);
  if (!work) notFound();
  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div><p className="eyebrow">EDIT WORK</p><h1>{work.name}</h1><p className="muted">保存后，公开作品页面会同步更新。</p></div>
        <Link className="btn" href="/admin/works">返回作品列表</Link>
      </header>
      <WorkEditor action={updateWorkAction.bind(null, work.id)} work={work} />
    </main>
  );
}
