import { describe, expect, it, vi } from "vitest";

import {
  cleanupObsoleteMedia,
  obsoleteSystemMediaPaths,
} from "./lifecycle";

const oldCover =
  "works/work-id/cover/11111111-1111-4111-8111-111111111111.webp";
const newCover =
  "works/work-id/cover/22222222-2222-4222-8222-222222222222.webp";

describe("obsoleteSystemMediaPaths", () => {
  it("returns only unique replaced or removed generated paths", () => {
    expect(
      obsoleteSystemMediaPaths(
        [oldCover, oldCover, "/local.webp", "https://example.com/external.webp"],
        [newCover],
      ),
    ).toEqual([oldCover]);
  });

  it("keeps unchanged generated paths", () => {
    expect(obsoleteSystemMediaPaths([oldCover], [oldCover])).toEqual([]);
  });
});

describe("cleanupObsoleteMedia", () => {
  it("attempts every obsolete path and tolerates individual failures", async () => {
    const deleteObject = vi
      .fn()
      .mockRejectedValueOnce(new Error("cleanup queued"))
      .mockResolvedValueOnce(undefined);

    await expect(
      cleanupObsoleteMedia([oldCover, newCover], deleteObject),
    ).resolves.toBeUndefined();
    expect(deleteObject).toHaveBeenCalledTimes(2);
  });
});
