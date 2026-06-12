import Link from "next/link";

import { TrashPlanCard } from "@/components/admin/plans/trash-plan-card";
import { PlanPagination } from "@/components/plans/plan-pagination";
import { parseAdminPlanQuery } from "@/lib/plans/queries";
import { getPlanRepository } from "@/lib/plans/server-repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function loadTrash(page: number) {
  try {
    return await getPlanRepository().listTrashPlans(page);
  } catch {
    return null;
  }
}

export default async function PlansTrashPage({ searchParams }: { searchParams: SearchParams }) {
  const page = parseAdminPlanQuery(await searchParams).page;
  const result = await loadTrash(page);

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">PLAN TRASH</p>
          <h1>规划回收站</h1>
          <p className="muted">恢复后的规划会变为草稿；永久删除后无法找回。</p>
        </div>
        <Link className="btn" href="/admin/plans">返回规划列表</Link>
      </header>
      {!result ? (
        <section className="admin-empty glass">
          <h2>回收站暂时无法加载</h2>
          <p className="muted">请稍后刷新页面，或检查 Supabase 服务状态。</p>
        </section>
      ) : result.plans.length ? (
        <>
          <section className="trash-plan-grid">
            {result.plans.map((plan) => <TrashPlanCard key={plan.id} plan={plan} />)}
          </section>
          <PlanPagination
            page={result.page}
            pageSize={result.pageSize}
            params={{}}
            pathname="/admin/plans/trash"
            total={result.total}
          />
        </>
      ) : (
        <section className="admin-empty glass">
          <h2>回收站是空的</h2>
          <p className="muted">移入回收站的规划会显示在这里。</p>
        </section>
      )}
    </main>
  );
}
