"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  PLAN_PRIORITIES,
  PLAN_PRIORITY_LABELS,
  PLAN_STATUS_LABELS,
} from "@/lib/plans/constants";
import type { PlanCategory } from "@/lib/plans/types";

const PUBLIC_STATUSES = ["not_started", "in_progress", "paused"] as const;

export function PlanFilters({ categories }: { categories: PlanCategory[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <section className="public-plan-filters glass" aria-label="公开规划筛选">
      <label>
        状态
        <select onChange={(event) => update("status", event.target.value)} value={searchParams.get("status") ?? ""}>
          <option value="">全部状态</option>
          {PUBLIC_STATUSES.map((status) => <option key={status} value={status}>{PLAN_STATUS_LABELS[status]}</option>)}
        </select>
      </label>
      <label>
        优先级
        <select onChange={(event) => update("priority", event.target.value)} value={searchParams.get("priority") ?? ""}>
          <option value="">全部优先级</option>
          {PLAN_PRIORITIES.map((priority) => <option key={priority} value={priority}>{PLAN_PRIORITY_LABELS[priority]}</option>)}
        </select>
      </label>
      <label>
        分类
        <select onChange={(event) => update("category", event.target.value)} value={searchParams.get("category") ?? ""}>
          <option value="">全部分类</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
    </section>
  );
}
