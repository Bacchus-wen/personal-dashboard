"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { moveFeaturedProjectToTrashAction } from "@/app/admin/(protected)/projects/actions";
import { RECOMMENDATION_VISIBILITY_LABELS } from "@/lib/featured-projects/constants";
import type { FeaturedProject } from "@/lib/featured-projects/types";

export function ProjectAdminCard({ project }: { project: FeaturedProject }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <article className="admin-plan-card glass card">
      <div className="admin-plan-card-head"><div><p className="eyebrow">{project.featured ? "FEATURED PROJECT" : "GITHUB PROJECT"}</p><h2>{project.name}</h2></div><span className="pill mono">#{project.sortOrder}</span></div>
      <p className="muted">{project.summary ?? "这个项目暂未填写简介。"}</p>
      <div className="plan-meta-row"><span className="pill">{RECOMMENDATION_VISIBILITY_LABELS[project.visibility]}</span>{project.language ? <span className="pill">{project.language}</span> : null}<span className="pill">{project.tags.length} 个标签</span></div>
      <div className="admin-plan-actions">
        <Link className="btn primary" href={`/admin/projects/${project.id}/edit`}>编辑</Link>
        <button className="btn danger" disabled={pending} onClick={() => startTransition(async () => setMessage((await moveFeaturedProjectToTrashAction(project.id)).message))} type="button">{pending ? "处理中..." : "移入回收站"}</button>
      </div>
      {message ? <p className="admin-notice" role="status">{message}</p> : null}
    </article>
  );
}
