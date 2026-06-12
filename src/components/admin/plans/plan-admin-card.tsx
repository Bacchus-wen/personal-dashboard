"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { movePlanToTrashAction } from "@/app/admin/(protected)/plans/actions";
import { PLAN_PRIORITY_LABELS, PLAN_STATUS_LABELS, PLAN_VISIBILITY_LABELS } from "@/lib/plans/constants";
import type { Plan } from "@/lib/plans/types";

export function PlanAdminCard({ plan }: { plan: Plan }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <article className="admin-plan-card glass card">
      <div className="admin-plan-card-head"><div><p className="eyebrow">{plan.category?.name ?? "未分类"}</p><h2>{plan.title ?? "未命名规划"}</h2></div><span className={`pill priority-${plan.priority}`}>{PLAN_PRIORITY_LABELS[plan.priority]}优先级</span></div>
      <p className="muted">{plan.summary ?? "草稿暂未填写简短描述。"}</p>
      <div className="plan-meta-row"><span className="pill">{PLAN_STATUS_LABELS[plan.status]}</span><span className="pill">{PLAN_VISIBILITY_LABELS[plan.visibility]}</span><span className="pill mono">{plan.progress}%</span><span className="pill">{plan.deadline ?? "无截止日期"}</span></div>
      <div className="plan-progress" aria-label={`当前进度 ${plan.progress}%`}><span style={{ width: `${plan.progress}%` }} /></div>
      <div className="admin-plan-actions">
        <Link className="btn primary" href={`/admin/plans/${plan.id}/edit`}>编辑</Link>
        <button className="btn danger" disabled={pending} onClick={() => startTransition(async () => setMessage((await movePlanToTrashAction(plan.id)).message))} type="button">{pending ? "处理中…" : "移入回收站"}</button>
      </div>
      {message && <p className="admin-notice" role="status">{message}</p>}
    </article>
  );
}
