import { RecoveryForm } from "@/components/admin/recovery-form";

export default async function RecoverPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const isUpdating = mode === "update";

  return (
    <main className="admin-page">
      <section className="admin-card glass">
        <p className="eyebrow">Account recovery</p>
        <h1>{isUpdating ? "设置新密码" : "找回管理员密码"}</h1>
        <p className="muted">
          {isUpdating
            ? "请使用至少 12 位的新密码，保存后需要重新登录。"
            : "恢复链接只会发送到 Supabase 中已存在的管理员邮箱。"}
        </p>
        <RecoveryForm mode={isUpdating ? "update" : "request"} />
      </section>
    </main>
  );
}
