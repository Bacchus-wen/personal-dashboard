export type ApiAdminDecision =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 };

export function decideApiAdmin(
  userId: string | null,
  adminUserId: string,
): ApiAdminDecision {
  if (!userId) return { ok: false, status: 401 };
  if (userId !== adminUserId) return { ok: false, status: 403 };
  return { ok: true, userId };
}
