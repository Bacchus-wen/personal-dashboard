"use client";

import { useRef, useState, useTransition } from "react";

import { permanentlyDeletePlanAction } from "@/app/admin/(protected)/plans/actions";

export function DeletePlanButton({
  planId,
  title,
}: {
  planId: string;
  title: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const permanentlyDelete = () => {
    startTransition(async () => {
      const result = await permanentlyDeletePlanAction(planId);
      setMessage(result.message);
      if (result.ok) {
        dialog.current?.close();
      }
    });
  };

  return (
    <>
      <button
        className="btn danger"
        disabled={pending}
        onClick={() => dialog.current?.showModal()}
        type="button"
      >
        永久删除
      </button>
      <dialog className="delete-dialog glass" ref={dialog}>
        <p className="eyebrow">PERMANENT DELETE</p>
        <h2>永久删除“{title}”？</h2>
        <p className="muted">删除后无法恢复，相关内容会立即从数据库中移除。</p>
        <div className="delete-dialog-actions">
          <button
            className="btn"
            disabled={pending}
            onClick={() => dialog.current?.close()}
            type="button"
          >
            取消
          </button>
          <button
            className="btn danger"
            disabled={pending}
            onClick={permanentlyDelete}
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
