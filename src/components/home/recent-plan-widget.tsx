"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";

import { DeadlineLabel } from "@/components/plans/deadline-label";
import {
  PLAN_PRIORITY_LABELS,
  PLAN_STATUS_LABELS,
} from "@/lib/plans/constants";
import { chooseHomePlan } from "@/lib/plans/queries";
import type { Plan } from "@/lib/plans/types";
import { validateRelatedUrl } from "@/lib/plans/validation";

const subscribe = () => () => {};

function localDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function descriptionPreview(description: string | null) {
  return description
    ?.replace(/[#*_`>\-[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 130) ?? "";
}

export function RecentPlanWidget({ candidates }: { candidates: Plan[] | null }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const dialog = useRef<HTMLDialogElement>(null);
  const timer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const plan = hydrated && candidates ? chooseHomePlan(candidates, localDate()) : null;

  const enter = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), 300);
  };

  const leave = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setOpen(false);
  };

  if (candidates === null) {
    return (
      <section className="recent-plan-widget glass card">
        <div className="recent-plan-mark">!</div>
        <div><p className="eyebrow">RECENT PLAN</p><h3>规划暂时无法加载</h3><p className="muted">请稍后重试。</p></div>
      </section>
    );
  }

  if (hydrated && !plan) {
    return (
      <section className="recent-plan-widget glass card">
        <div className="recent-plan-mark">✓</div>
        <div><p className="eyebrow">RECENT PLAN</p><h3>近期暂无公开规划</h3><p className="muted">可以稍后再来看看。</p></div>
      </section>
    );
  }

  if (!plan) {
    return (
      <section className="recent-plan-widget glass card">
        <div className="recent-plan-mark">…</div>
        <div><p className="eyebrow">RECENT PLAN</p><h3>正在整理近日规划</h3></div>
      </section>
    );
  }

  const openOnMobile = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      event.preventDefault();
      dialog.current?.showModal();
    }
  };

  return (
    <div className="recent-plan-region" onPointerEnter={enter} onPointerLeave={leave}>
      <Link className="recent-plan-widget glass card lift" href="/plans" onClick={openOnMobile}>
        <div className="recent-plan-mark">{plan.progress}</div>
        <div>
          <p className="eyebrow">RECENT PLAN</p>
          <h3>{plan.title}</h3>
          <div className="plan-progress"><span style={{ width: `${plan.progress}%` }} /></div>
        </div>
      </Link>
      {open ? <PlanPreview className="recent-plan-preview" plan={plan} /> : null}
      <dialog
        className="recent-plan-dialog glass"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialog.current?.close();
          }
        }}
        ref={dialog}
      >
        <button aria-label="关闭规划预览" className="btn recent-plan-dialog-close" onClick={() => dialog.current?.close()} type="button">关闭</button>
        <PlanPreview plan={plan} />
        <Link className="btn primary" href="/plans">查看全部规划</Link>
      </dialog>
    </div>
  );
}

function PlanPreview({ className = "", plan }: { className?: string; plan: Plan }) {
  const relatedUrl = validateRelatedUrl(plan.relatedUrl);
  const external = relatedUrl?.startsWith("http");
  const preview = descriptionPreview(plan.description);

  return (
    <section className={`recent-plan-preview-content ${className}`}>
      <p className="eyebrow">{plan.category?.name ?? "未分类"}</p>
      <h3>{plan.title}</h3>
      <p className="muted">{plan.summary}</p>
      <div className="plan-meta-row">
        <span className="pill">{PLAN_STATUS_LABELS[plan.status]}</span>
        <span className={`pill priority-${plan.priority}`}>{PLAN_PRIORITY_LABELS[plan.priority]}优先级</span>
        <DeadlineLabel deadline={plan.deadline} />
      </div>
      <div className="plan-progress" aria-label={`当前进度 ${plan.progress}%`}><span style={{ width: `${plan.progress}%` }} /></div>
      {preview ? <p className="recent-plan-description">{preview}{plan.description && plan.description.length > 130 ? "…" : ""}</p> : null}
      {relatedUrl ? <a className="btn" href={relatedUrl} rel={external ? "noreferrer noopener" : undefined} target={external ? "_blank" : undefined}>打开相关链接</a> : null}
    </section>
  );
}
