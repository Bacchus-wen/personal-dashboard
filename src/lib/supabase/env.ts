import "server-only";

function requireServerEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export function getServerAuthEnv() {
  return {
    url: requireServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: requireServerEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}

export function getServerAdminEnv() {
  return {
    url: requireServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    secretKey: requireServerEnv("SUPABASE_SECRET_KEY"),
  };
}

export function getAdminUserId() {
  return requireServerEnv("ADMIN_USER_ID");
}
