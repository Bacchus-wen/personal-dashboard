"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { moveWorkToTrashAction } from "@/app/admin/(protected)/works/actions";
import {
  WORK_STATUS_LABELS,
  WORK_VISIBILITY_LABELS,
} from "@/lib/works/constants";
import type { Work } from "@/lib/works/types";

export function WorkAdminCard({ work }: { work: Work }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <article className="admin-plan-card glass card">
      <div className="admin-plan-card-head">
        <div>
          <p className="eyebrow">{work.featured ? "FEATURED WORK" : "PORTFOLIO WORK"}</p>
          <h2>{work.name}</h2>
        </div>
        <span className="pill mono">#{work.sortOrder}</span>
      </div>
      <p className="muted">{work.summary ?? "这条作品暂未填写简短摘要。"}</p>
      <div className="plan-meta-row">
        <span className="pill">{WORK_STATUS_LABELS[work.status]}</span>
        <span className="pill">{WORK_VISIBILITY_LABELS[work.visibility]}</span>
        <span className="pill">{work.techStack.length} 个技术标签</span>
        <span className="pill">{new Date(work.updatedAt).toLocaleDateString("zh-CN")}</span>
      </div>
      <div className="admin-plan-actions">
        <Link className="btn primary" href={`/admin/works/${work.id}/edit`}>编辑</Link>
        <Link className="btn" href={`/admin/works/${work.id}/preview`}>预览</Link>
        <button
          className="btn danger"
          disabled={pending}
          onClick={() =>
            startTransition(async () =>
              setMessage((await moveWorkToTrashAction(work.id)).message),
            )
          }
          type="button"
        >
          {pending ? "处理中…" : "移入回收站"}
        </button>
      </div>
      {message ? <p className="admin-notice" role="status">{message}</p> : null}
    </article>
  );
}
