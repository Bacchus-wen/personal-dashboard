import type { Metadata } from "next";
import { PageShell } from "@/components/chrome/page-shell";
import { FilterableGrid } from "@/components/ui/filterable-grid";
import { resources } from "@/data/site-content";

export const metadata: Metadata = { title: "推荐分享" };

export default function ResourcesPage() {
  return <PageShell eyebrow="RESOURCE SHELF" title="推荐分享" description="最近觉得有用、好看或值得反复阅读的内容。"><FilterableGrid items={resources} placeholder="搜索资源..." filters={[{ label: "全部", value: "all" }, { label: "Design", value: "design" }, { label: "Tools", value: "tools" }, { label: "Learning", value: "learning" }, { label: "Frontend", value: "frontend" }]} /></PageShell>;
}
