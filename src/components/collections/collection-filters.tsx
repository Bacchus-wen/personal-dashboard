"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ThemeSelect } from "@/components/ui/theme-select";
import { COLLECTION_CONTENT_TYPES, COLLECTION_CONTENT_TYPE_LABELS } from "@/lib/collections/constants";

export function CollectionFilters({ tags }: { tags: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value); else next.delete(name);
    if (!COLLECTION_CONTENT_TYPES.includes(next.get("type") as "article" | "video")) next.set("type", "article");
    router.replace(`${pathname}?${next.toString()}`);
  };
  return (
    <section aria-label="内容收藏筛选" className="public-plan-filters glass">
      <label>
        内容类型
        <ThemeSelect
          ariaLabel="内容类型"
          value={params.get("type") === "video" ? "video" : "article"}
          onChange={(value) => update("type", value)}
          options={COLLECTION_CONTENT_TYPES.map((type) => ({ value: type, label: COLLECTION_CONTENT_TYPE_LABELS[type] }))}
        />
      </label>
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); update("q", search.trim()); }}>
        <label>关键词<input onChange={(event) => setSearch(event.target.value)} placeholder="搜索标题、来源或摘要" type="search" value={search} /></label>
      </form>
      <label>
        标签
        <ThemeSelect
          ariaLabel="标签"
          value={params.get("tag") ?? ""}
          onChange={(value) => update("tag", value)}
          options={[{ value: "", label: "全部" }, ...tags.map((tag) => ({ value: tag, label: tag }))]}
        />
      </label>
    </section>
  );
}
