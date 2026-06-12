"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

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
        <label>状态<select onChange={(event) => update("status", event.target.value)} value={searchParams.get("status") ?? ""}><option value="">全部</option>{PLAN_STATUSES.map((value) => <option key={value} value={value}>{PLAN_STATUS_LABELS[value]}</option>)}</select></label>
        <label>可见性<select onChange={(event) => update("visibility", event.target.value)} value={searchParams.get("visibility") ?? ""}><option value="">全部</option>{PLAN_VISIBILITIES.map((value) => <option key={value} value={value}>{PLAN_VISIBILITY_LABELS[value]}</option>)}</select></label>
        <label>优先级<select onChange={(event) => update("priority", event.target.value)} value={searchParams.get("priority") ?? ""}><option value="">全部</option>{PLAN_PRIORITIES.map((value) => <option key={value} value={value}>{PLAN_PRIORITY_LABELS[value]}</option>)}</select></label>
        <label>截止情况<select onChange={(event) => update("overdue", event.target.value)} value={searchParams.get("overdue") ?? ""}><option value="">全部</option><option value="true">已逾期</option></select></label>
      </div>
    </section>
  );
}
