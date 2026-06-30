"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ThemeSelect } from "@/components/ui/theme-select";
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
        <ThemeSelect
          ariaLabel="项目状态"
          value={params.get("status") ?? ""}
          onChange={(value) => update("status", value)}
          options={[
            { value: "", label: "全部状态" },
            ...WORK_STATUSES.map((status) => ({ value: status, label: WORK_STATUS_LABELS[status] })),
          ]}
        />
      </label>
      <label>
        技术标签
        <ThemeSelect
          ariaLabel="技术标签"
          value={params.get("tech") ?? ""}
          onChange={(value) => update("tech", value)}
          options={[
            { value: "", label: "全部技术" },
            ...technologies.map((technology) => ({ value: technology, label: technology })),
          ]}
        />
      </label>
    </section>
  );
}
