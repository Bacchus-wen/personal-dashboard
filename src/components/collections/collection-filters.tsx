"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

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
  return <section aria-label="内容收藏筛选" className="public-plan-filters glass"><label>内容类型<select onChange={(event) => update("type", event.target.value)} value={params.get("type") === "video" ? "video" : "article"}>{COLLECTION_CONTENT_TYPES.map((type) => <option key={type} value={type}>{COLLECTION_CONTENT_TYPE_LABELS[type]}</option>)}</select></label><form onSubmit={(event: FormEvent) => { event.preventDefault(); update("q", search.trim()); }}><label>关键词<input onChange={(event) => setSearch(event.target.value)} placeholder="搜索标题、来源或摘要" type="search" value={search} /></label></form><label>标签<select onChange={(event) => update("tag", event.target.value)} value={params.get("tag") ?? ""}><option value="">全部</option>{tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select></label></section>;
}
