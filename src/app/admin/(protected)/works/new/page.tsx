import Link from "next/link";

import { createWorkAction } from "@/app/admin/(protected)/works/actions";
import { WorkEditor } from "@/components/admin/works/work-editor";

export default function NewWorkPage() {
  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div><p className="eyebrow">NEW WORK</p><h1>新建作品</h1><p className="muted">先填写名称保存草稿，再逐步补充和公开。</p></div>
        <Link className="btn" href="/admin/works">返回作品列表</Link>
      </header>
      <WorkEditor action={createWorkAction} />
    </main>
  );
}
