import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("allows an internal application path", () => {
    expect(safeNextPath("/admin/recover?mode=update")).toBe(
      "/admin/recover?mode=update",
    );
  });

  it.each(["https://example.com", "//example.com", "/\\example.com"])(
    "rejects unsafe redirect target %s",
    (value) => {
      expect(safeNextPath(value)).toBe("/admin");
    },
  );
});
