"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/admin/login");
      router.refresh();
      setIsSigningOut(false);
    }
  }

  return (
    <button className="btn" disabled={isSigningOut} onClick={signOut} type="button">
      {isSigningOut ? "正在退出…" : "退出登录"}
    </button>
  );
}
