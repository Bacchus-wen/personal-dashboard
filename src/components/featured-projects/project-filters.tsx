"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ThemeSelect } from "@/components/ui/theme-select";

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
  return (
    <section aria-label="优秀项目筛选" className="public-plan-filters glass">
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); update("q", search.trim()); }}>
        <label>关键词<input onChange={(event) => setSearch(event.target.value)} placeholder="搜索名称、简介或推荐理由" type="search" value={search} /></label>
      </form>
      <label>
        语言
        <ThemeSelect
          ariaLabel="语言"
          value={params.get("language") ?? ""}
          onChange={(value) => update("language", value)}
          options={[{ value: "", label: "全部" }, ...languages.map((language) => ({ value: language, label: language }))]}
        />
      </label>
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
