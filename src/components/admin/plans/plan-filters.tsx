"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { ThemeSelect } from "@/components/ui/theme-select";
import {
  PLAN_PRIORITIES,
  PLAN_PRIORITY_LABELS,
  PLAN_STATUSES,
  PLAN_STATUS_LABELS,
  PLAN_VISIBILITIES,
  PLAN_VISIBILITY_LABELS,
} from "@/lib/plans/constants";

export function AdminPlanFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const update = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update("q", search.trim());
  };

  return (
    <section className="admin-plan-filters glass" aria-label="规划筛选">
      <form className="admin-plan-search" onSubmit={submitSearch}>
        <input aria-label="搜索规划标题" onChange={(event) => setSearch(event.target.value)} placeholder="搜索规划标题" type="search" value={search} />
        <button className="btn" type="submit">搜索</button>
      </form>
      <div className="admin-plan-filter-grid">
        <label>状态<ThemeSelect ariaLabel="状态" value={searchParams.get("status") ?? ""} onChange={(value) => update("status", value)} options={[{ value: "", label: "全部" }, ...PLAN_STATUSES.map((value) => ({ value, label: PLAN_STATUS_LABELS[value] }))]} /></label>
        <label>可见性<ThemeSelect ariaLabel="可见性" value={searchParams.get("visibility") ?? ""} onChange={(value) => update("visibility", value)} options={[{ value: "", label: "全部" }, ...PLAN_VISIBILITIES.map((value) => ({ value, label: PLAN_VISIBILITY_LABELS[value] }))]} /></label>
        <label>优先级<ThemeSelect ariaLabel="优先级" value={searchParams.get("priority") ?? ""} onChange={(value) => update("priority", value)} options={[{ value: "", label: "全部" }, ...PLAN_PRIORITIES.map((value) => ({ value, label: PLAN_PRIORITY_LABELS[value] }))]} /></label>
        <label>截止情况<ThemeSelect ariaLabel="截止情况" value={searchParams.get("overdue") ?? ""} onChange={(value) => update("overdue", value)} options={[{ value: "", label: "全部" }, { value: "true", label: "已逾期" }]} /></label>
      </div>
    </section>
  );
}
