import { notFound } from "next/navigation";

import { updatePhotoAction } from "@/app/admin/(protected)/photos/actions";
import { PhotoEditor } from "@/components/admin/photos/photo-editor";
import { getPhotoRepository } from "@/lib/photos/server-repository";
import { getPhotoPublicUrl } from "@/lib/photos/server-storage";

export default async function EditPhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let photo = null;
  try {
    photo = await getPhotoRepository().getById(id);
  } catch {
    photo = null;
  }
  if (!photo) notFound();

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">EDIT PHOTO</p>
          <h1>编辑照片</h1>
          <p className="muted">公开页面不会展示原始文件名。</p>
        </div>
      </header>
      <PhotoEditor
        action={updatePhotoAction.bind(null, photo.id)}
        photo={photo}
        publicUrl={getPhotoPublicUrl(photo.storagePath)}
      />
    </main>
  );
}
