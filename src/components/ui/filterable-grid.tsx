"use client";

import { useMemo, useState } from "react";
import type { DirectoryItem } from "@/data/site-content";

export function FilterableGrid({
  items,
  filters,
  placeholder,
}: {
  items: DirectoryItem[];
  filters: { label: string; value: string }[];
  placeholder: string;
}) {
  const [filter, setFilter] = useState(filters[0].value);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === "all" || item.categories.includes(filter);
    const haystack = `${item.title} ${item.url} ${item.description} ${item.tags?.join(" ")}`.toLowerCase();
    return matchesFilter && haystack.includes(query.trim().toLowerCase());
  }), [filter, items, query]);

  return (
    <>
      <div className="search-bar">
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
      </div>
      <div className="filters" aria-label="内容筛选">
        {filters.map((item) => (
          <button key={item.value} className={`filter ${filter === item.value ? "active" : ""}`} onClick={() => setFilter(item.value)}>
            {item.label}
          </button>
        ))}
      </div>
      <section className="content-grid">
        {visible.map((item) => (
          <article className="directory-card card glass lift" key={item.title}>
            <div className="card-top">
              <div className="logo-block">{item.mark}</div>
              <div><h2>{item.title}</h2><p>{item.url}</p></div>
            </div>
            <div className="stars" aria-label="五星推荐">★★★★★</div>
            {item.tags && <div className="tag-row">{item.tags.map((tag) => <span className="pill" key={tag}>{tag}</span>)}</div>}
            <p className="muted">{item.description}</p>
            {item.tags && <div className="metrics mono">Views — &nbsp; Marks —</div>}
          </article>
        ))}
      </section>
    </>
  );
}
