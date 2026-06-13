import Link from "next/link";

import { createCollectionAction } from "@/app/admin/(protected)/collections/actions";
import { CollectionEditor } from "@/components/admin/collections/collection-editor";

export default function NewCollectionPage() {
  return <main className="admin-workspace"><header className="admin-workspace-head"><div><p className="eyebrow">NEW COLLECTION</p><h1>新建内容收藏</h1><p className="muted">可以先只填写标题并保存为草稿。</p></div><Link className="btn" href="/admin/collections">返回收藏列表</Link></header><CollectionEditor action={createCollectionAction} /></main>;
}
