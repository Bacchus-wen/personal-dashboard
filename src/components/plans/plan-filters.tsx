"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ThemeSelect } from "@/components/ui/theme-select";
import {
  PLAN_PRIORITIES,
  PLAN_PRIORITY_LABELS,
  PLAN_STATUS_LABELS,
  PLAN_STATUSES,
} from "@/lib/plans/constants";
import type { PlanCategory } from "@/lib/plans/types";

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
        <ThemeSelect
          ariaLabel="状态"
          value={searchParams.get("status") ?? ""}
          onChange={(value) => update("status", value)}
          options={[
            { value: "", label: "全部状态" },
            ...PLAN_STATUSES.map((status) => ({
              value: status,
              label: PLAN_STATUS_LABELS[status],
            })),
          ]}
        />
      </label>
      <label>
        优先级
        <ThemeSelect
          ariaLabel="优先级"
          value={searchParams.get("priority") ?? ""}
          onChange={(value) => update("priority", value)}
          options={[
            { value: "", label: "全部优先级" },
            ...PLAN_PRIORITIES.map((priority) => ({
              value: priority,
              label: PLAN_PRIORITY_LABELS[priority],
            })),
          ]}
        />
      </label>
      <label>
        分类
        <ThemeSelect
          ariaLabel="分类"
          value={searchParams.get("category") ?? ""}
          onChange={(value) => update("category", value)}
          options={[
            { value: "", label: "全部分类" },
            ...categories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
        />
      </label>
    </section>
  );
}
