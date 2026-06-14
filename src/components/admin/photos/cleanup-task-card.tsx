"use client";

import { useState, useTransition } from "react";

import { retryPhotoCleanupAction } from "@/app/admin/(protected)/photos/actions";
import type { StorageCleanupTask } from "@/lib/photos/types";

export function CleanupTaskCard({ task }: { task: StorageCleanupTask }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <article className="photo-admin-card glass card">
      <p className="eyebrow">STORAGE CLEANUP</p>
      <h2>{task.reason === "create_rollback" ? "创建回滚" : "替换旧文件"}</h2>
      <p className="mono">{task.objectPath}</p>
      <p className="muted">{task.lastError ?? "Storage operation failed."}</p>
      <p className="muted">{new Date(task.createdAt).toLocaleString()}</p>
      <button className="btn primary" disabled={pending} onClick={() => startTransition(async () => setMessage((await retryPhotoCleanupAction(task.id)).message))} type="button">
        {pending ? "正在重试..." : "重试清理"}
      </button>
      {message ? <p className="admin-notice" role="status">{message}</p> : null}
    </article>
  );
}
