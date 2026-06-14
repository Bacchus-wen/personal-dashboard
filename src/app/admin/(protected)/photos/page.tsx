import Link from "next/link";

import { PhotoAdminCard } from "@/components/admin/photos/photo-admin-card";
import {
  PHOTO_VISIBILITIES,
  PHOTO_VISIBILITY_LABELS,
  type PhotoVisibility,
} from "@/lib/photos/constants";
import { getPhotoRepository } from "@/lib/photos/server-repository";
import { getPhotoPublicUrl } from "@/lib/photos/server-storage";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function visibilityFrom(value: string | string[] | undefined): PhotoVisibility | null {
  const selected = Array.isArray(value) ? value[0] : value;
  return PHOTO_VISIBILITIES.includes(selected as PhotoVisibility)
    ? (selected as PhotoVisibility)
    : null;
}

export default async function AdminPhotosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const visibility = visibilityFrom((await searchParams).visibility);
  let photos = null;
  try {
    photos = await getPhotoRepository().listAdmin(visibility);
  } catch {
    photos = null;
  }

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">PHOTOS</p>
          <h1>照片管理</h1>
          <p className="muted">维护公开相册、草稿和归档照片。</p>
        </div>
        <div className="admin-workspace-actions">
          <Link className="btn" href="/admin">返回后台</Link>
          <Link className="btn" href="/admin/photos/cleanup">清理任务</Link>
          <Link className="btn" href="/admin/photos/trash">回收站</Link>
          <Link className="btn primary" href="/admin/photos/new">上传照片</Link>
        </div>
      </header>
      <nav className="admin-plan-filters glass" aria-label="照片状态筛选">
        <Link className="btn" href="/admin/photos">全部</Link>
        {PHOTO_VISIBILITIES.map((value) => (
          <Link className="btn" href={`/admin/photos?visibility=${value}`} key={value}>
            {PHOTO_VISIBILITY_LABELS[value]}
          </Link>
        ))}
      </nav>
      {!photos ? (
        <section className="admin-empty glass">
          <h2>照片暂时无法加载</h2>
          <p className="muted">请确认已执行流程 5A 数据库迁移，或稍后重试。</p>
        </section>
      ) : photos.length ? (
        <section className="photo-admin-grid">
          {photos.map((photo) => (
            <PhotoAdminCard
              key={photo.id}
              photo={photo}
              publicUrl={getPhotoPublicUrl(photo.storagePath)}
            />
          ))}
        </section>
      ) : (
        <section className="admin-empty glass">
          <h2>没有符合条件的照片</h2>
          <p className="muted">上传照片，或切换状态筛选。</p>
        </section>
      )}
    </main>
  );
}
