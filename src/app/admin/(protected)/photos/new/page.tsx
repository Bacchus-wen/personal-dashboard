import Link from "next/link";

import { PhotoUploadQueue } from "@/components/admin/photos/photo-upload-queue";

export default function NewPhotoPage() {
  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">NEW PHOTOS</p>
          <h1>批量上传照片</h1>
          <p className="muted">成功上传的照片会先保存为草稿。</p>
        </div>
        <Link className="btn" href="/admin/photos">
          返回照片管理
        </Link>
      </header>
      <PhotoUploadQueue />
    </main>
  );
}
