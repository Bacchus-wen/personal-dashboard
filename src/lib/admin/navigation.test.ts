import { describe, expect, it } from "vitest";

import { isAdminNavigationItemActive } from "./navigation";

describe("isAdminNavigationItemActive", () => {
  it("matches the overview only at the admin root", () => {
    expect(isAdminNavigationItemActive("/admin", "/admin")).toBe(true);
    expect(isAdminNavigationItemActive("/admin/music", "/admin")).toBe(false);
  });

  it("matches nested routes within an admin section", () => {
    expect(
      isAdminNavigationItemActive("/admin/music/new", "/admin/music"),
    ).toBe(true);
    expect(
      isAdminNavigationItemActive(
        "/admin/collections/item/edit",
        "/admin/collections",
      ),
    ).toBe(true);
  });

  it("does not match sibling prefixes", () => {
    expect(
      isAdminNavigationItemActive("/admin/musical", "/admin/music"),
    ).toBe(false);
  });
});
