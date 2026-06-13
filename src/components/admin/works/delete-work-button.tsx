"use client";

import { useRef, useState, useTransition } from "react";

import { permanentlyDeleteWorkAction } from "@/app/admin/(protected)/works/actions";

export function DeleteWorkButton({ name, workId }: { name: string; workId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <>
      <button className="btn danger" onClick={() => dialog.current?.showModal()} type="button">
        永久删除
      </button>
      <dialog className="delete-dialog glass" ref={dialog}>
        <p className="eyebrow">PERMANENT DELETE</p>
        <h2>永久删除“{name}”？</h2>
        <p className="muted">作品与全部截图记录会被删除，且无法恢复。</p>
        <div className="delete-dialog-actions">
          <button className="btn" disabled={pending} onClick={() => dialog.current?.close()} type="button">取消</button>
          <button
            className="btn danger"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await permanentlyDeleteWorkAction(workId);
                setMessage(result.message);
                if (result.ok) dialog.current?.close();
              })
            }
            type="button"
          >
            {pending ? "正在删除…" : "确认永久删除"}
          </button>
        </div>
        {message ? <p className="admin-notice error" role="alert">{message}</p> : null}
      </dialog>
    </>
  );
}
