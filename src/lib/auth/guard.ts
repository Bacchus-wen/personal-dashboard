export type AdminAccessFailure = "UNAUTHENTICATED" | "FORBIDDEN";

export class AdminAccessError extends Error {
  constructor(public readonly code: AdminAccessFailure) {
    super(code);
    this.name = "AdminAccessError";
  }
}

export async function runProtectedAdminOperation<T>(
  userId: string | null,
  adminUserId: string,
  operation: () => Promise<T>,
) {
  if (!userId) {
    throw new AdminAccessError("UNAUTHENTICATED");
  }

  if (userId !== adminUserId) {
    throw new AdminAccessError("FORBIDDEN");
  }

  return operation();
}
