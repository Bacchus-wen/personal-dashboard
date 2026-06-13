"use client";

import { useRef, useState, useTransition } from "react";

import {
  permanentlyDeleteCollectionAction,
  restoreCollectionAction,
} from "@/app/admin/(protected)/collections/actions";
import type { Collection } from "@/lib/collections/types";

export function CollectionTrashCard({ collection }: { collection: Collection }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <article className="trash-plan-card glass card">
      <div>
        <p className="eyebrow">TRASHED COLLECTION</p>
        <h2>{collection.title}</h2>
        <p className="muted">{collection.summary ?? "这条收藏暂未填写摘要。"}</p>
      </div>
      <div className="admin-plan-actions">
        <button className="btn primary" disabled={pending} onClick={() => startTransition(async () => setMessage((await restoreCollectionAction(collection.id)).message))} type="button">
          {pending ? "正在恢复..." : "恢复为草稿"}
        </button>
        <button className="btn danger" disabled={pending} onClick={() => dialog.current?.showModal()} type="button">
          永久删除
        </button>
      </div>
      {message ? <p className="admin-notice success" role="status">{message}</p> : null}
      <dialog className="delete-dialog" ref={dialog}>
        <h2>永久删除“{collection.title}”？</h2>
        <p className="muted">此操作无法撤销。</p>
        <div className="delete-dialog-actions">
          <button className="btn" onClick={() => dialog.current?.close()} type="button">取消</button>
          <button className="btn danger" onClick={() => startTransition(async () => { setMessage((await permanentlyDeleteCollectionAction(collection.id)).message); dialog.current?.close(); })} type="button">
            确认永久删除
          </button>
        </div>
      </dialog>
    </article>
  );
}
