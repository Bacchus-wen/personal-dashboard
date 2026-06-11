"use client";

import { useState, useTransition } from "react";

import { restorePlanAction } from "@/app/admin/(protected)/plans/actions";
import { DeletePlanButton } from "@/components/admin/plans/delete-plan-button";
import {
  PLAN_STATUS_LABELS,
  PLAN_VISIBILITY_LABELS,
} from "@/lib/plans/constants";
import type { Plan } from "@/lib/plans/types";

export function TrashPlanCard({ plan }: { plan: Plan }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const title = plan.title ?? "未命名规划";

  return (
    <article className="trash-plan-card glass card">
      <div>
        <p className="eyebrow">{plan.category?.name ?? "未分类"}</p>
        <h2>{title}</h2>
        <p className="muted">{plan.summary ?? "这条草稿暂未填写简短描述。"}</p>
      </div>
      <div className="plan-meta-row">
        <span className="pill">原状态：{PLAN_STATUS_LABELS[plan.status]}</span>
        <span className="pill">原可见性：{PLAN_VISIBILITY_LABELS[plan.visibility]}</span>
        <span className="pill mono">
          删除于 {plan.deletedAt ? new Date(plan.deletedAt).toLocaleString("zh-CN") : "未知时间"}
        </span>
      </div>
      <div className="admin-plan-actions">
        <button
          className="btn primary"
          disabled={pending}
          onClick={() => startTransition(async () => setMessage((await restorePlanAction(plan.id)).message))}
          type="button"
        >
          {pending ? "正在恢复…" : "恢复为草稿"}
        </button>
        <DeletePlanButton planId={plan.id} title={title} />
      </div>
      {message ? <p className="admin-notice success" role="status">{message}</p> : null}
    </article>
  );
}
