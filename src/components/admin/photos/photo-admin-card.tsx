"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { movePhotoToTrashAction } from "@/app/admin/(protected)/photos/actions";
import { PhotoImage } from "@/components/photos/photo-image";
import { PHOTO_VISIBILITY_LABELS } from "@/lib/photos/constants";
import type { Photo } from "@/lib/photos/types";

export function PhotoAdminCard({
  photo,
  publicUrl,
}: {
  photo: Photo;
  publicUrl: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <article className="photo-admin-card glass card">
      <PhotoImage
        adminFilename={photo.originalFilename}
        alt="后台照片预览"
        className="photo-admin-image"
        src={publicUrl}
      />
      <div className="photo-admin-card-body">
        <p className="eyebrow">PHOTO</p>
        <h2>{photo.originalFilename}</h2>
        <div className="plan-meta-row">
          <span className="pill">{PHOTO_VISIBILITY_LABELS[photo.visibility]}</span>
          <span className="pill mono">#{photo.sortOrder}</span>
        </div>
        <div className="admin-plan-actions">
          <Link className="btn primary" href={`/admin/photos/${photo.id}/edit`}>
            编辑
          </Link>
          <button
            className="btn danger"
            disabled={pending}
            onClick={() =>
              startTransition(async () =>
                setMessage((await movePhotoToTrashAction(photo.id)).message),
              )
            }
            type="button"
          >
            {pending ? "处理中..." : "移入回收站"}
          </button>
        </div>
        {message ? <p className="admin-notice" role="status">{message}</p> : null}
      </div>
    </article>
  );
}
