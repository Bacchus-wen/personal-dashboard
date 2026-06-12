export function decideAdminAccess(
  userId: string | null,
  adminUserId: string,
) {
  if (!userId) {
    return "/admin/login";
  }

  if (userId !== adminUserId) {
    return "/admin/unauthorized";
  }

  return null;
}
