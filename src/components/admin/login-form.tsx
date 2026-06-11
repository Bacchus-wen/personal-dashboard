"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("邮箱或密码不正确，请检查后重试。");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("暂时无法连接认证服务，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <label>
        管理员邮箱
        <input
          autoComplete="email"
          name="email"
          required
          type="email"
        />
      </label>
      <label>
        密码
        <input
          autoComplete="current-password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      {error ? (
        <p className="admin-notice error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? "正在验证…" : "进入后台"}
      </button>
      <Link className="admin-text-link" href="/admin/recover">
        忘记密码
      </Link>
    </form>
  );
}
