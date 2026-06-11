"use client";

import { useState } from "react";

import { DeadlineLabel } from "@/components/plans/deadline-label";
import { MarkdownContent } from "@/components/plans/markdown-content";
import {
  PLAN_PRIORITY_LABELS,
  PLAN_STATUS_LABELS,
} from "@/lib/plans/constants";
import type { Plan } from "@/lib/plans/types";
import { validateRelatedUrl } from "@/lib/plans/validation";

export function PlanCard({ plan }: { plan: Plan }) {
  const [expanded, setExpanded] = useState(false);
  const relatedUrl = validateRelatedUrl(plan.relatedUrl);
  const external = relatedUrl?.startsWith("http");

  return (
    <article className="public-plan-card glass card lift">
      <div className="public-plan-card-head">
        <div>
          <p className="eyebrow">{plan.category?.name ?? "未分类"}</p>
          <h2>{plan.title ?? "未命名规划"}</h2>
        </div>
        <span className={`pill priority-${plan.priority}`}>
          {PLAN_PRIORITY_LABELS[plan.priority]}优先级
        </span>
      </div>
      <p className="muted">{plan.summary}</p>
      <div className="plan-meta-row">
        <span className="pill">{PLAN_STATUS_LABELS[plan.status]}</span>
        <span className="pill mono">{plan.progress}%</span>
        <DeadlineLabel deadline={plan.deadline} />
      </div>
      <div className="plan-progress" aria-label={`当前进度 ${plan.progress}%`}>
        <span style={{ width: `${plan.progress}%` }} />
      </div>
      {expanded ? (
        <div className="public-plan-details">
          {plan.description ? (
            <MarkdownContent content={plan.description} />
          ) : (
            <p className="muted">这条规划暂未填写详细说明。</p>
          )}
          {relatedUrl ? (
            <a
              className="btn"
              href={relatedUrl}
              rel={external ? "noreferrer noopener" : undefined}
              target={external ? "_blank" : undefined}
            >
              打开相关链接
            </a>
          ) : null}
        </div>
      ) : null}
      <button className="btn" onClick={() => setExpanded((current) => !current)} type="button">
        {expanded ? "收起详情" : "展开详情"}
      </button>
    </article>
  );
}
