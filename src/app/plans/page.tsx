import type { Metadata } from "next";

import { PageShell } from "@/components/chrome/page-shell";
import { PlanCard } from "@/components/plans/plan-card";
import { PlanFilters } from "@/components/plans/plan-filters";
import { PlanPagination } from "@/components/plans/plan-pagination";
import { parsePublicPlanQuery } from "@/lib/plans/queries";
import { getPlanRepository } from "@/lib/plans/server-repository";

export const metadata: Metadata = { title: "近日规划" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function loadPlans(query: ReturnType<typeof parsePublicPlanQuery>) {
  try {
    const repository = getPlanRepository();
    const [result, categories] = await Promise.all([
      repository.listPublicPlans(query),
      repository.listPublicCategories(),
    ]);
    return { categories, result };
  } catch {
    return null;
  }
}

export default async function PlansPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parsePublicPlanQuery(await searchParams);
  const data = await loadPlans(query);

  return (
    <PageShell
      description="按优先级与截止日期整理近期目标，记录正在推进的事情。"
      eyebrow="RECENT PLANS"
      title="近日规划"
    >
      {!data ? (
        <section className="admin-empty glass">
          <h2>规划暂时无法加载</h2>
          <p className="muted">请稍后刷新页面。</p>
        </section>
      ) : (
        <>
          <PlanFilters categories={data.categories} />
          {data.result.plans.length ? (
            <section className="public-plan-grid">
              {data.result.plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
            </section>
          ) : (
            <section className="admin-empty glass">
              <h2>暂无符合条件的公开规划</h2>
              <p className="muted">可以调整筛选条件后再次查看。</p>
            </section>
          )}
          <PlanPagination
            page={data.result.page}
            pageSize={data.result.pageSize}
            params={{
              category: query.categoryId,
              priority: query.priority,
              status: query.status,
            }}
            pathname="/plans"
            total={data.result.total}
          />
        </>
      )}
    </PageShell>
  );
}
