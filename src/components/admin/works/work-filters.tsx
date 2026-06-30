"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ThemeSelect } from "@/components/ui/theme-select";
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
          <ThemeSelect
            ariaLabel="状态"
            value={params.get("status") ?? ""}
            onChange={(value) => update("status", value)}
            options={[{ value: "", label: "全部" }, ...WORK_STATUSES.map((value) => ({ value, label: WORK_STATUS_LABELS[value] }))]}
          />
        </label>
        <label>
          可见性
          <ThemeSelect
            ariaLabel="可见性"
            value={params.get("visibility") ?? ""}
            onChange={(value) => update("visibility", value)}
            options={[{ value: "", label: "全部" }, ...WORK_VISIBILITIES.map((value) => ({ value, label: WORK_VISIBILITY_LABELS[value] }))]}
          />
        </label>
      </div>
    </section>
  );
}
