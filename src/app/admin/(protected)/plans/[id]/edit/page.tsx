import Link from "next/link";
import { notFound } from "next/navigation";

import { updatePlanAction } from "@/app/admin/(protected)/plans/actions";
import { PlanEditor } from "@/components/admin/plans/plan-editor";
import { getPlanRepository } from "@/lib/plans/server-repository";

type Params = Promise<{ id: string }>;

export default async function EditPlanPage({ params }: { params: Params }) {
  const { id } = await params;
  const repository = getPlanRepository();
  const [plan, categories] = await Promise.all([
    repository.getPlanById(id),
    repository.listCategories(),
  ]);

  if (!plan) {
    notFound();
  }

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">EDIT PLAN</p>
          <h1>{plan.title ?? "未命名规划"}</h1>
          <p className="muted">保存后，公开页面与首页规划卡片会同步更新。</p>
        </div>
        <Link className="btn" href="/admin/plans">返回规划列表</Link>
      </header>
      <PlanEditor
        action={updatePlanAction.bind(null, plan.id)}
        categories={categories}
        plan={plan}
      />
    </main>
  );
}
