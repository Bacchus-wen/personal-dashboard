import { describe, expect, it } from "vitest";

import { decideAdminAccess } from "./access";

describe("decideAdminAccess", () => {
  const adminUserId = "admin-user-id";

  it("redirects anonymous users to the login page", () => {
    expect(decideAdminAccess(null, adminUserId)).toBe("/admin/login");
  });

  it("redirects authenticated non-admin users to the unauthorized page", () => {
    expect(decideAdminAccess("another-user-id", adminUserId)).toBe(
      "/admin/unauthorized",
    );
  });

  it("allows the configured administrator", () => {
    expect(decideAdminAccess(adminUserId, adminUserId)).toBeNull();
  });
});
