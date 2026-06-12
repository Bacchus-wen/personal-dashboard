"use client";

import { createBrowserClient } from "@supabase/ssr";

function requirePublicEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }

  return value;
}

export function createSupabaseBrowserClient() {
  const url = requirePublicEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const publishableKey = requirePublicEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return createBrowserClient(url, publishableKey);
}
