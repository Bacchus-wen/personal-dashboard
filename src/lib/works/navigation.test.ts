import { describe, expect, it } from "vitest";

import { getWorkSaveDestination } from "./navigation";

describe("getWorkSaveDestination", () => {
  it("returns the works list after a successful save", () => {
    expect(getWorkSaveDestination()).toBe("/admin/works");
  });
});
