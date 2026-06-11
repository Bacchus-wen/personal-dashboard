import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="admin-page">
      <section className="admin-card glass">
        <div className="admin-mark" aria-hidden="true">
          TH
        </div>
        <p className="eyebrow">Private workspace</p>
        <h1>管理员登录</h1>
        <p className="muted">
          此入口仅供站长管理内容，不提供公开注册。
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
