"use client";

import { useRef, useState, useTransition } from "react";

import {
  permanentlyDeletePhotoAction,
  restorePhotoAction,
} from "@/app/admin/(protected)/photos/actions";
import { PhotoImage } from "@/components/photos/photo-image";
import type { Photo } from "@/lib/photos/types";

export function PhotoTrashCard({ photo, publicUrl }: { photo: Photo; publicUrl: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <article className="trash-plan-card glass card">
      <PhotoImage adminFilename={photo.originalFilename} alt="回收站照片预览" src={publicUrl} />
      <h2>{photo.originalFilename}</h2>
      <div className="admin-plan-actions">
        <button className="btn primary" disabled={pending} onClick={() => startTransition(async () => setMessage((await restorePhotoAction(photo.id)).message))} type="button">
          {pending ? "处理中..." : "恢复为草稿"}
        </button>
        <button className="btn danger" disabled={pending} onClick={() => dialog.current?.showModal()} type="button">永久删除</button>
      </div>
      {message ? <p className="admin-notice" role="status">{message}</p> : null}
      <dialog className="delete-dialog glass" ref={dialog}>
        <p className="eyebrow">PERMANENT DELETE</p>
        <h2>永久删除这张照片？</h2>
        <p className="muted">Storage 文件和数据库记录都会被删除，且无法恢复。</p>
        <div className="delete-dialog-actions">
          <button className="btn" disabled={pending} onClick={() => dialog.current?.close()} type="button">取消</button>
          <button className="btn danger" disabled={pending} onClick={() => startTransition(async () => { const result = await permanentlyDeletePhotoAction(photo.id); setMessage(result.message); if (result.ok) dialog.current?.close(); })} type="button">确认永久删除</button>
        </div>
      </dialog>
    </article>
  );
}
