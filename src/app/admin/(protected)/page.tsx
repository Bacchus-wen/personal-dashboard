import { SignOutButton } from "@/components/admin/sign-out-button";

export default function AdminPage() {
  return (
    <main className="admin-page">
      <section className="admin-card glass">
        <p className="eyebrow">Administrator workspace</p>
        <h1>后台基础已建立</h1>
        <p className="muted">当前会话已通过服务器管理员身份验证。</p>
        <p>后续的规划、作品和网站设置功能会从这里逐步加入。</p>
        <SignOutButton />
      </section>
    </main>
  );
}
