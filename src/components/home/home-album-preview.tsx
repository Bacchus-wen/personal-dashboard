import Link from "next/link";

import { PhotoImage } from "@/components/photos/photo-image";
import type { PublicPhoto } from "@/lib/photos/types";

export function HomeAlbumPreview({
  photos,
}: {
  photos: PublicPhoto[] | null;
}) {
  return (
    <Link className="album-preview glass lift" href="/album" aria-label="进入相册">
      {photos?.length ? (
        <div className="photo-strip">
          {photos.map((photo) => (
            <span className="mini-photo" key={photo.id}>
              <PhotoImage alt="" src={photo.publicUrl} />
            </span>
          ))}
        </div>
      ) : (
        <div className="home-album-empty">
          <strong>{photos ? "相册还是空的" : "相册暂时不可用"}</strong>
          <span className="muted">
            {photos ? "公开照片会显示在这里。" : "稍后再来看看。"}
          </span>
        </div>
      )}
      <span className="preview-label">Album · 最近的光影</span>
    </Link>
  );
}
