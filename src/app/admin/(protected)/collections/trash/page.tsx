import Link from "next/link";

import { CollectionTrashCard } from "@/components/admin/collections/collection-trash-card";
import { getCollectionRepository } from "@/lib/collections/server-repository";

export default async function CollectionsTrashPage() {
  let collections = null;
  try { collections = await getCollectionRepository().listTrash(); } catch { collections = null; }
  return <main className="admin-workspace"><header className="admin-workspace-head"><div><p className="eyebrow">COLLECTIONS TRASH</p><h1>内容收藏回收站</h1><p className="muted">恢复后强制变为草稿；永久删除无法撤销。</p></div><Link className="btn" href="/admin/collections">返回收藏列表</Link></header>{!collections ? <section className="admin-empty glass"><h2>回收站暂时无法加载</h2><p className="muted">请稍后刷新页面。</p></section> : collections.length ? <section className="trash-plan-grid">{collections.map((collection) => <CollectionTrashCard collection={collection} key={collection.id} />)}</section> : <section className="admin-empty glass"><h2>回收站是空的</h2><p className="muted">移入回收站的收藏会显示在这里。</p></section>}</main>;
}
