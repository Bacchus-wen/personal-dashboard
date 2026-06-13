"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { WORK_STATUSES, WORK_STATUS_LABELS } from "@/lib/works/constants";

export function WorkFilters({ technologies }: { technologies: string[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(`${pathname}?${next.toString()}`);
  };
  return (
    <section className="public-plan-filters work-filter-panel" aria-label="作品筛选">
      <label>
        项目状态
        <select onChange={(event) => update("status", event.target.value)} value={params.get("status") ?? ""}>
          <option value="">全部状态</option>
          {WORK_STATUSES.map((status) => <option key={status} value={status}>{WORK_STATUS_LABELS[status]}</option>)}
        </select>
      </label>
      <label>
        技术标签
        <select onChange={(event) => update("tech", event.target.value)} value={params.get("tech") ?? ""}>
          <option value="">全部技术</option>
          {technologies.map((technology) => <option key={technology} value={technology}>{technology}</option>)}
        </select>
      </label>
    </section>
  );
}
