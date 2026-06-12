import Link from "next/link";

import { createPlanAction } from "@/app/admin/(protected)/plans/actions";
import { PlanEditor } from "@/components/admin/plans/plan-editor";
import { getPlanRepository } from "@/lib/plans/server-repository";

export default async function NewPlanPage() {
  const categories = await getPlanRepository().listCategories();

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">NEW PLAN</p>
          <h1>新建近日规划</h1>
          <p className="muted">先保存草稿，再逐步补充和公开。</p>
        </div>
        <Link className="btn" href="/admin/plans">返回规划列表</Link>
      </header>
      <PlanEditor action={createPlanAction} categories={categories} />
    </main>
  );
}
