import type { Metadata } from "next";
import { PageShell } from "@/components/chrome/page-shell";
import { FilterableGrid } from "@/components/ui/filterable-grid";
import { blogs } from "@/data/site-content";

export const metadata: Metadata = { title: "优秀博客" };

export default function BlogsPage() {
  return <PageShell eyebrow="GOOD INTERNET" title="优秀博客" description="一些让我愿意持续打开的个人网站。" action="导入密钥"><FilterableGrid items={blogs} placeholder="搜索博主..." filters={[{ label: "博客", value: "blog" }, { label: "链接", value: "links" }]} /></PageShell>;
}
