import { describe, expect, it } from "vitest";

import { getWorkSaveDestination } from "./navigation";

describe("getWorkSaveDestination", () => {
  it("returns the works list when no saved id is available", () => {
    expect(getWorkSaveDestination()).toBe("/admin/works");
  });

  it("returns the edit page after a new work is saved", () => {
    expect(getWorkSaveDestination("work-id")).toBe("/admin/works/work-id/edit");
  });
});
