import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="admin-page">
      <section className="admin-card glass">
        <p className="eyebrow">Access denied</p>
        <h1>这个账号不是管理员</h1>
        <p className="muted">
          网站只允许配置在服务器中的单一管理员账号进入后台。
        </p>
        <Link className="btn" href="/admin/login">
          返回登录页
        </Link>
      </section>
    </main>
  );
}
