"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  WORK_STATUSES,
  WORK_STATUS_LABELS,
  WORK_VISIBILITIES,
  WORK_VISIBILITY_LABELS,
} from "@/lib/works/constants";

export function AdminWorkFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <section className="admin-plan-filters glass" aria-label="作品筛选">
      <form
        className="admin-plan-search"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          update("q", search.trim());
        }}
      >
        <input
          aria-label="搜索作品"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索名称或摘要"
          type="search"
          value={search}
        />
        <button className="btn" type="submit">搜索</button>
      </form>
      <div className="admin-plan-filter-grid">
        <label>
          状态
          <select onChange={(event) => update("status", event.target.value)} value={params.get("status") ?? ""}>
            <option value="">全部</option>
            {WORK_STATUSES.map((value) => <option key={value} value={value}>{WORK_STATUS_LABELS[value]}</option>)}
          </select>
        </label>
        <label>
          可见性
          <select onChange={(event) => update("visibility", event.target.value)} value={params.get("visibility") ?? ""}>
            <option value="">全部</option>
            {WORK_VISIBILITIES.map((value) => <option key={value} value={value}>{WORK_VISIBILITY_LABELS[value]}</option>)}
          </select>
        </label>
      </div>
    </section>
  );
}
