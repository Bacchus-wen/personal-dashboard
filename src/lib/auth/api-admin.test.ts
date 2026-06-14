import { describe, expect, it } from "vitest";

import { decideApiAdmin } from "./api-admin-access";

describe("decideApiAdmin", () => {
  const adminUserId = "admin-user-id";

  it("returns 401 for a missing user", () => {
    expect(decideApiAdmin(null, adminUserId)).toEqual({
      ok: false,
      status: 401,
    });
  });

  it("returns 403 for a non-administrator", () => {
    expect(decideApiAdmin("another-user-id", adminUserId)).toEqual({
      ok: false,
      status: 403,
    });
  });

  it("returns the configured administrator identity", () => {
    expect(decideApiAdmin(adminUserId, adminUserId)).toEqual({
      ok: true,
      userId: adminUserId,
    });
  });
});
