"use client";

import Link from "next/link";
import { type CSSProperties, useCallback, useState } from "react";

import { PhotoImage } from "./photo-image";
import { PhotoLightbox } from "./photo-lightbox";
import { groupPhotos, polaroidTransform, totalPhotoGroups } from "@/lib/photos/stack";
import type { PublicPhoto } from "@/lib/photos/types";

type LightboxState = { index: number; trigger: HTMLElement | null } | null;

export function PublicAlbum({
  photos,
  group,
  failed,
}: {
  photos: PublicPhoto[];
  group: number;
  failed: boolean;
}) {
  const current = groupPhotos(photos, group);
  const [topId, setTopId] = useState(current[0]?.id ?? "");
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  if (failed) {
    return <section className="admin-empty glass"><h2>相册暂时无法加载</h2><p className="muted">请稍后刷新页面。</p></section>;
  }
  if (!photos.length) {
    return <section className="admin-empty glass"><h2>相册还是空的</h2><p className="muted">公开照片会在这里组成拍立得堆叠。</p></section>;
  }

  const totalGroups = totalPhotoGroups(photos.length);
  const activate = (photo: PublicPhoto, trigger: HTMLElement) => {
    if (topId !== photo.id) {
      setTopId(photo.id);
      return;
    }
    setLightbox({
      index: photos.findIndex((candidate) => candidate.id === photo.id),
      trigger,
    });
  };

  return (
    <section className="public-album" aria-label="公开照片相册">
      <div className="public-album-stage">
        {current.map((photo, index) => {
          const transform = polaroidTransform(photo.id);
          const style = {
            "--photo-x": `${transform.x}px`,
            "--photo-y": `${transform.y}px`,
            "--photo-rotate": `${transform.rotate}deg`,
            zIndex: photo.id === topId ? current.length + 1 : index + 1,
          } as CSSProperties;
          return (
            <button
              aria-label={`照片 ${index + 1}${photo.id === topId ? "，再次点击打开" : "，点击置顶"}`}
              className={`public-polaroid ${photo.id === topId ? "is-top" : ""}`}
              key={photo.id}
              onClick={(event) => activate(photo, event.currentTarget)}
              style={style}
              type="button"
            >
              <PhotoImage alt="" src={photo.publicUrl} />
            </button>
          );
        })}
      </div>
      <nav className="public-album-controls" aria-label="相册分组">
        {group > 1 ? <Link className="btn" href={`/album?group=${group - 1}`}>上一组</Link> : <span />}
        <span className="pill mono">{group} / {totalGroups}</span>
        {group < totalGroups ? <Link className="btn" href={`/album?group=${group + 1}`}>下一组</Link> : <span />}
      </nav>
      {lightbox ? <PhotoLightbox initialIndex={lightbox.index} onClose={closeLightbox} photos={photos} trigger={lightbox.trigger} /> : null}
    </section>
  );
}
