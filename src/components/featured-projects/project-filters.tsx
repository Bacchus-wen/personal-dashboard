"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

export function FeaturedProjectFilters({ languages, tags }: { languages: string[]; tags: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value); else next.delete(name);
    router.replace(`${pathname}?${next.toString()}`);
  };
  return <section aria-label="优秀项目筛选" className="public-plan-filters glass"><form onSubmit={(event: FormEvent) => { event.preventDefault(); update("q", search.trim()); }}><label>关键词<input onChange={(event) => setSearch(event.target.value)} placeholder="搜索名称、简介或推荐理由" type="search" value={search} /></label></form><label>语言<select onChange={(event) => update("language", event.target.value)} value={params.get("language") ?? ""}><option value="">全部</option>{languages.map((language) => <option key={language} value={language}>{language}</option>)}</select></label><label>标签<select onChange={(event) => update("tag", event.target.value)} value={params.get("tag") ?? ""}><option value="">全部</option>{tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select></label></section>;
}
