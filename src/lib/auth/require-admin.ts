import "server-only";

import { redirect } from "next/navigation";

import { decideAdminAccess } from "./access";
import { getAdminUserId } from "@/lib/supabase/env";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";

export async function requireAdmin() {
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const destination = decideAdminAccess(user?.id ?? null, getAdminUserId());

  if (destination) {
    redirect(destination);
  }

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
