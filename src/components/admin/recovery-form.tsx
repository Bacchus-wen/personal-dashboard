"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function RecoveryForm({ mode }: { mode: "request" | "update" }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/admin/recover?mode=update`;
      const { error: recoveryError } =
        await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (recoveryError) {
        setError("暂时无法发送恢复邮件，请稍后重试。");
        return;
      }

      setMessage("如果该邮箱属于管理员，恢复邮件将很快送达。");
    } catch {
      setError("暂时无法连接认证服务，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");

    if (password !== confirmation) {
      setError("两次输入的密码不一致。");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError("密码更新失败，请重新打开恢复邮件中的链接。");
        return;
      }

      await supabase.auth.signOut();
      setMessage("密码已更新，请返回登录页使用新密码登录。");
    } catch {
      setError("暂时无法连接认证服务，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="admin-form"
      onSubmit={mode === "update" ? updatePassword : requestRecovery}
    >
      {mode === "update" ? (
        <>
          <label>
            新密码
            <input
              autoComplete="new-password"
              minLength={12}
              name="password"
              required
              type="password"
            />
          </label>
          <label>
            再次输入新密码
            <input
              autoComplete="new-password"
              minLength={12}
              name="confirmation"
              required
              type="password"
            />
          </label>
        </>
      ) : (
        <label>
          管理员邮箱
          <input autoComplete="email" name="email" required type="email" />
        </label>
      )}
      {error ? (
        <p className="admin-notice error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="admin-notice success" role="status">
          {message}
        </p>
      ) : null}
      <button className="btn primary" disabled={isSubmitting} type="submit">
        {isSubmitting
          ? "正在处理…"
          : mode === "update"
            ? "保存新密码"
            : "发送恢复邮件"}
      </button>
      <Link className="admin-text-link" href="/admin/login">
        返回登录页
      </Link>
    </form>
  );
}
