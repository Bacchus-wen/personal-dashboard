import type { Metadata } from "next";
import { PageShell } from "@/components/chrome/page-shell";
import { articleYears } from "@/data/site-content";

export const metadata: Metadata = { title: "近期文章" };

export default function ArticlesPage() {
  return <PageShell eyebrow="WRITING LOG" title="近期文章" description="缓慢记录正在理解的事。"><div className="filters"><button className="filter">日</button><button className="filter">周</button><button className="filter">月</button><button className="filter active">年</button><button className="filter">分类</button></div><section className="timeline-stack">{articleYears.map((group) => <article className="year-card glass lift" key={group.year}><div className="year-title"><h2>{group.year}年</h2><span className="muted">· {group.articles.length} 篇文章</span></div><div className="article-list">{group.articles.map(([date, title, tag]) => <a className="article-row" href="#" key={title}><span className="date">{date}</span><span className="title">{title}</span><span className="tag">{tag}</span></a>)}</div></article>)}</section></PageShell>;
}
