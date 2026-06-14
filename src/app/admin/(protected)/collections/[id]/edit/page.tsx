import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCollectionAction } from "@/app/admin/(protected)/collections/actions";
import { CollectionEditor } from "@/components/admin/collections/collection-editor";
import { getCollectionRepository } from "@/lib/collections/server-repository";

type Params = Promise<{ id: string }>;

export default async function EditCollectionPage({ params }: { params: Params }) {
  const collection = await getCollectionRepository().getById((await params).id);
  if (!collection) notFound();
  return <main className="admin-workspace"><header className="admin-workspace-head"><div><p className="eyebrow">EDIT COLLECTION</p><h1>{collection.title}</h1><p className="muted">保存后公开收藏页和首页推荐候选会同步更新。</p></div><Link className="btn" href="/admin/collections">返回收藏列表</Link></header><CollectionEditor action={updateCollectionAction.bind(null, collection.id)} collection={collection} /></main>;
}
