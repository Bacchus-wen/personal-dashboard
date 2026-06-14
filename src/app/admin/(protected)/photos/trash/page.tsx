import Link from "next/link";

import { PhotoTrashCard } from "@/components/admin/photos/photo-trash-card";
import { getPhotoRepository } from "@/lib/photos/server-repository";
import { getPhotoPublicUrl } from "@/lib/photos/server-storage";

export default async function PhotosTrashPage() {
  let photos = null;
  try {
    photos = await getPhotoRepository().listTrash();
  } catch {
    photos = null;
  }

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">PHOTOS TRASH</p>
          <h1>照片回收站</h1>
          <p className="muted">恢复后会强制变为草稿；永久删除无法撤销。</p>
        </div>
        <Link className="btn" href="/admin/photos">返回照片管理</Link>
      </header>
      {!photos ? (
        <section className="admin-empty glass"><h2>回收站暂时无法加载</h2></section>
      ) : photos.length ? (
        <section className="trash-plan-grid">
          {photos.map((photo) => (
            <PhotoTrashCard key={photo.id} photo={photo} publicUrl={getPhotoPublicUrl(photo.storagePath)} />
          ))}
        </section>
      ) : (
        <section className="admin-empty glass"><h2>回收站是空的</h2></section>
      )}
    </main>
  );
}
