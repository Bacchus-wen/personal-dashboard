"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { RECOMMENDATION_VISIBILITIES, RECOMMENDATION_VISIBILITY_LABELS } from "@/lib/featured-projects/constants";

export function ProjectFilters({ languages }: { languages: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value); else next.delete(name);
    router.replace(`${pathname}?${next.toString()}`);
  };
  return (
    <section aria-label="项目筛选" className="admin-plan-filters glass">
      <form className="admin-plan-search" onSubmit={(event: FormEvent) => { event.preventDefault(); update("q", search.trim()); }}>
        <input aria-label="搜索项目" onChange={(event) => setSearch(event.target.value)} placeholder="搜索名称、简介或推荐理由" type="search" value={search} />
        <button className="btn" type="submit">搜索</button>
      </form>
      <div className="admin-plan-filter-grid">
        <label>语言<select onChange={(event) => update("language", event.target.value)} value={params.get("language") ?? ""}><option value="">全部</option>{languages.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>可见性<select onChange={(event) => update("visibility", event.target.value)} value={params.get("visibility") ?? ""}><option value="">全部</option>{RECOMMENDATION_VISIBILITIES.map((value) => <option key={value} value={value}>{RECOMMENDATION_VISIBILITY_LABELS[value]}</option>)}</select></label>
      </div>
    </section>
  );
}
