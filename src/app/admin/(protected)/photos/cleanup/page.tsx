import Link from "next/link";

import { CleanupTaskCard } from "@/components/admin/photos/cleanup-task-card";
import { getPhotoRepository } from "@/lib/photos/server-repository";

export default async function PhotoCleanupPage() {
  let tasks = null;
  try {
    tasks = await getPhotoRepository().listCleanupTasks();
  } catch {
    tasks = null;
  }

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">STORAGE CLEANUP</p>
          <h1>照片清理任务</h1>
          <p className="muted">仅显示自动清理失败后留下的手动重试任务。</p>
        </div>
        <Link className="btn" href="/admin/photos">返回照片管理</Link>
      </header>
      {!tasks ? (
        <section className="admin-empty glass"><h2>清理任务暂时无法加载</h2></section>
      ) : tasks.length ? (
        <section className="cleanup-task-grid">
          {tasks.map((task) => <CleanupTaskCard key={task.id} task={task} />)}
        </section>
      ) : (
        <section className="admin-empty glass"><h2>没有待处理的清理任务</h2></section>
      )}
    </main>
  );
}
