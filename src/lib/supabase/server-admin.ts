import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerAdminEnv } from "./env";

export function createSupabaseAdminClient() {
  const { url, secretKey } = getServerAdminEnv();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
