import Link from "next/link";

import { SignOutButton } from "@/components/admin/sign-out-button";

export default function AdminPage() {
  return (
    <main className="admin-page">
      <section className="admin-card glass">
        <p className="eyebrow">Administrator workspace</p>
        <h1>后台基础已建立</h1>
        <p className="muted">当前会话已通过服务器管理员身份验证。</p>
        <p>从这里管理近日规划以及后续加入的网站内容。</p>
        <Link className="btn primary" href="/admin/plans">
          管理近日规划
        </Link>
        <Link className="btn" href="/admin/settings">
          网站设置与首页布局
        </Link>
        <Link className="btn" href="/admin/works">
          管理我的作品
        </Link>
        <Link className="btn" href="/admin/collections">
          管理内容收藏
        </Link>
        <Link className="btn" href="/">
          返回主页
        </Link>
        <SignOutButton />
      </section>
    </main>
  );
}
