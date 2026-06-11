import { describe, expect, it, vi } from "vitest";

import {
  AdminAccessError,
  runProtectedAdminOperation,
} from "./guard";

describe("runProtectedAdminOperation", () => {
  const adminUserId = "admin-user-id";

  it("rejects anonymous users before executing the operation", async () => {
    const operation = vi.fn();

    await expect(
      runProtectedAdminOperation(null, adminUserId, operation),
    ).rejects.toEqual(new AdminAccessError("UNAUTHENTICATED"));
    expect(operation).not.toHaveBeenCalled();
  });

  it("rejects non-admin users before executing the operation", async () => {
    const operation = vi.fn();

    await expect(
      runProtectedAdminOperation("another-user-id", adminUserId, operation),
    ).rejects.toEqual(new AdminAccessError("FORBIDDEN"));
    expect(operation).not.toHaveBeenCalled();
  });

  it("executes the operation for the configured administrator", async () => {
    const operation = vi.fn().mockResolvedValue("allowed");

    await expect(
      runProtectedAdminOperation(adminUserId, adminUserId, operation),
    ).resolves.toBe("allowed");
    expect(operation).toHaveBeenCalledOnce();
  });
});
