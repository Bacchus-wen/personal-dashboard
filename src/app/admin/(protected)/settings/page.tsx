import Link from "next/link";

import { SettingsWorkspace } from "@/components/admin/settings/settings-workspace";
import { getSiteSettingsRepository } from "@/lib/site-settings/server-repository";

async function loadConfiguration() {
  try {
    return await getSiteSettingsRepository().getPublished();
  } catch {
    return null;
  }
}

export default async function AdminSettingsPage() {
  const configuration = await loadConfiguration();

  if (!configuration) {
    return (
      <main className="admin-workspace">
        <section className="admin-empty glass">
          <p className="eyebrow">SITE SETTINGS</p>
          <h1>网站设置暂时无法加载</h1>
          <p className="muted">
            请确认已经执行流程 2 的 Supabase 数据库迁移，然后刷新页面。
          </p>
          <Link className="btn" href="/admin">
            返回后台
          </Link>
        </section>
      </main>
    );
  }

  return <SettingsWorkspace initialConfiguration={configuration} />;
}
