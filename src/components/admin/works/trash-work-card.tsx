"use client";

import { useState, useTransition } from "react";

import { restoreWorkAction } from "@/app/admin/(protected)/works/actions";
import { DeleteWorkButton } from "./delete-work-button";
import {
  WORK_STATUS_LABELS,
  WORK_VISIBILITY_LABELS,
} from "@/lib/works/constants";
import type { Work } from "@/lib/works/types";

export function TrashWorkCard({ work }: { work: Work }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <article className="trash-plan-card glass card">
      <div>
        <p className="eyebrow">TRASHED WORK</p>
        <h2>{work.name}</h2>
        <p className="muted">{work.summary ?? "这条作品暂未填写简短摘要。"}</p>
      </div>
      <div className="plan-meta-row">
        <span className="pill">原状态：{WORK_STATUS_LABELS[work.status]}</span>
        <span className="pill">原可见性：{WORK_VISIBILITY_LABELS[work.visibility]}</span>
        <span className="pill">{work.deletedAt ? new Date(work.deletedAt).toLocaleString("zh-CN") : "未知删除时间"}</span>
      </div>
      <div className="admin-plan-actions">
        <button
          className="btn primary"
          disabled={pending}
          onClick={() =>
            startTransition(async () =>
              setMessage((await restoreWorkAction(work.id)).message),
            )
          }
          type="button"
        >
          {pending ? "正在恢复…" : "恢复为草稿"}
        </button>
        <DeleteWorkButton name={work.name} workId={work.id} />
      </div>
      {message ? <p className="admin-notice success" role="status">{message}</p> : null}
    </article>
  );
}
