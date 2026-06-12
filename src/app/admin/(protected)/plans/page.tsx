import Link from "next/link";

import { CategoryManager } from "@/components/admin/plans/category-manager";
import { PlanAdminCard } from "@/components/admin/plans/plan-admin-card";
import { AdminPlanFilters } from "@/components/admin/plans/plan-filters";
import { PlanPagination } from "@/components/plans/plan-pagination";
import { parseAdminPlanQuery } from "@/lib/plans/queries";
import { getPlanRepository } from "@/lib/plans/server-repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function loadAdminPlans(query: ReturnType<typeof parseAdminPlanQuery>) {
  try {
    const repository = getPlanRepository();
    const [result, categories] = await Promise.all([repository.listAdminPlans(query), repository.listCategories()]);
    const counts = Object.fromEntries(await Promise.all(categories.map(async (category) => [category.id, await repository.countPlansForCategory(category.id)])));

    return { categories, counts, result } as const;
  } catch {
    return null;
  }
}

export default async function AdminPlansPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseAdminPlanQuery(await searchParams);
  const data = await loadAdminPlans(query);

  if (!data) {
    return <main className="admin-workspace"><section className="admin-empty glass"><p className="eyebrow">RECENT PLANS</p><h1>规划暂时无法加载</h1><p className="muted">请稍后刷新页面，或检查 Supabase 服务状态。</p><Link className="btn" href="/admin">返回后台</Link></section></main>;
  }

  const { categories, counts, result } = data;

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div><p className="eyebrow">RECENT PLANS</p><h1>近日规划后台</h1><p className="muted">管理草稿、私密规划与公开进度。</p></div>
        <div className="admin-workspace-actions"><Link className="btn" href="/admin">返回后台</Link><Link className="btn" href="/admin/plans/trash">回收站</Link><CategoryManager categories={categories} counts={counts} /><Link className="btn primary" href="/admin/plans/new">新建规划</Link></div>
      </header>
      <AdminPlanFilters />
      {result.plans.length ? <section className="admin-plan-grid">{result.plans.map((plan) => <PlanAdminCard key={plan.id} plan={plan} />)}</section> : <section className="admin-empty glass"><h2>没有符合条件的规划</h2><p className="muted">调整筛选条件，或创建第一条规划。</p></section>}
      <PlanPagination page={result.page} pageSize={result.pageSize} params={{ q: query.search, status: query.status, visibility: query.visibility, priority: query.priority, overdue: query.overdue === true ? "true" : null }} pathname="/admin/plans" total={result.total} />
    </main>
  );
}
