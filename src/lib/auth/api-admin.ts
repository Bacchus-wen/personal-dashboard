import "server-only";

import {
  decideApiAdmin,
  type ApiAdminDecision,
} from "./api-admin-access";
import { getAdminUserId } from "@/lib/supabase/env";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";

export async function requireApiAdmin(): Promise<ApiAdminDecision> {
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return decideApiAdmin(user?.id ?? null, getAdminUserId());
}
