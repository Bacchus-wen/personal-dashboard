"use client";

import { useRef, useState, useTransition } from "react";

import { createCategoryAction, deleteCategoryAction, renameCategoryAction } from "@/app/admin/(protected)/plans/actions";
import type { PlanCategory } from "@/lib/plans/types";

export function CategoryManager({ categories, counts }: { categories: PlanCategory[]; counts: Record<string, number> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (operation: () => Promise<{ message: string }>) => {
    startTransition(async () => setMessage((await operation()).message));
  };

  return (
    <>
      <button className="btn" onClick={() => dialog.current?.showModal()} type="button">管理分类</button>
      <dialog className="category-dialog glass" ref={dialog}>
        <div className="dialog-head"><div><p className="eyebrow">CATEGORIES</p><h2>管理规划分类</h2></div><button aria-label="关闭分类管理" className="btn" onClick={() => dialog.current?.close()} type="button">关闭</button></div>
        <div className="category-create"><input maxLength={20} onChange={(event) => setNewName(event.target.value)} placeholder="新分类名称" value={newName} /><button className="btn primary" disabled={pending} onClick={() => run(async () => { const result = await createCategoryAction(newName); if (result.ok) setNewName(""); return result; })} type="button">新增</button></div>
        <div className="category-list">
          {categories.length === 0 && <p className="muted">暂时没有分类。</p>}
          {categories.map((category) => <CategoryRow category={category} count={counts[category.id] ?? 0} key={category.id} pending={pending} run={run} />)}
        </div>
        {message && <p className="admin-notice" role="status">{message}</p>}
      </dialog>
    </>
  );
}

function CategoryRow({ category, count, pending, run }: { category: PlanCategory; count: number; pending: boolean; run: (operation: () => Promise<{ message: string }>) => void }) {
  const [name, setName] = useState(category.name);
  return (
    <div className="category-row">
      <input aria-label={`${category.name}分类名称`} maxLength={20} onChange={(event) => setName(event.target.value)} value={name} />
      <span className="muted mono">{count} 条规划</span>
      <button className="btn" disabled={pending} onClick={() => run(() => renameCategoryAction(category.id, name))} type="button">重命名</button>
      <button className="btn danger" disabled={pending} onClick={() => { if (window.confirm(`删除“${category.name}”后，${count} 条相关规划会变为未分类。继续吗？`)) run(() => deleteCategoryAction(category.id)); }} type="button">删除</button>
    </div>
  );
}
