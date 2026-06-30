"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ThemeSelect } from "@/components/ui/theme-select";
import {
  COLLECTION_CONTENT_TYPES,
  COLLECTION_CONTENT_TYPE_LABELS,
  RECOMMENDATION_VISIBILITIES,
  RECOMMENDATION_VISIBILITY_LABELS,
} from "@/lib/collections/constants";

export function CollectionFilters() {
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
    <section aria-label="收藏筛选" className="admin-plan-filters glass">
      <form
        className="admin-plan-search"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          update("q", search.trim());
        }}
      >
        <input
          aria-label="搜索收藏"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索标题、来源或摘要"
          type="search"
          value={search}
        />
        <button className="btn" type="submit">
          搜索
        </button>
      </form>
      <div className="admin-plan-filter-grid">
        <label>
          内容类型
          <ThemeSelect
            ariaLabel="内容类型"
            value={params.get("type") ?? ""}
            onChange={(value) => update("type", value)}
            options={[
              { value: "", label: "全部" },
              ...COLLECTION_CONTENT_TYPES.map((value) => ({ value, label: COLLECTION_CONTENT_TYPE_LABELS[value] })),
            ]}
          />
        </label>
        <label>
          可见性
          <ThemeSelect
            ariaLabel="可见性"
            value={params.get("visibility") ?? ""}
            onChange={(value) => update("visibility", value)}
            options={[
              { value: "", label: "全部" },
              ...RECOMMENDATION_VISIBILITIES.map((value) => ({ value, label: RECOMMENDATION_VISIBILITY_LABELS[value] })),
            ]}
          />
        </label>
      </div>
    </section>
  );
}
