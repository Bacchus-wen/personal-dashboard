import Link from "next/link";

import { TrashWorkCard } from "@/components/admin/works/trash-work-card";
import { getWorkRepository } from "@/lib/works/server-repository";

export default async function WorksTrashPage() {
  let works = null;
  try {
    works = await getWorkRepository().listTrashWorks();
  } catch {
    works = null;
  }
  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div><p className="eyebrow">WORKS TRASH</p><h1>作品回收站</h1><p className="muted">恢复后的作品会变为草稿；永久删除后无法找回。</p></div>
        <Link className="btn" href="/admin/works">返回作品列表</Link>
      </header>
      {!works ? (
        <section className="admin-empty glass"><h2>回收站暂时无法加载</h2><p className="muted">请稍后刷新页面。</p></section>
      ) : works.length ? (
        <section className="trash-plan-grid">{works.map((work) => <TrashWorkCard key={work.id} work={work} />)}</section>
      ) : (
        <section className="admin-empty glass"><h2>回收站是空的</h2><p className="muted">移入回收站的作品会显示在这里。</p></section>
      )}
    </main>
  );
}
