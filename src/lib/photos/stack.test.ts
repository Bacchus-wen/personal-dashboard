import { describe, expect, it } from "vitest";

import {
  groupPhotos,
  polaroidTransform,
  totalPhotoGroups,
} from "./stack";

describe("photo grouping", () => {
  const photos = Array.from({ length: 25 }, (_, index) => `photo-${index}`);

  it("returns at most twelve photos for the requested one-based group", () => {
    expect(groupPhotos(photos, 1)).toEqual(photos.slice(0, 12));
    expect(groupPhotos(photos, 2)).toEqual(photos.slice(12, 24));
    expect(groupPhotos(photos, 3)).toEqual(photos.slice(24, 25));
  });

  it("calculates at least one valid group", () => {
    expect(totalPhotoGroups(25)).toBe(3);
    expect(totalPhotoGroups(12)).toBe(1);
    expect(totalPhotoGroups(0)).toBe(1);
  });
});

describe("polaroidTransform", () => {
  it("returns stable bounded transforms for a photo id", () => {
    const first = polaroidTransform("stable-id");
    const second = polaroidTransform("stable-id");

    expect(first).toEqual(second);
    expect(first.x).toBeGreaterThanOrEqual(-96);
    expect(first.x).toBeLessThanOrEqual(96);
    expect(first.y).toBeGreaterThanOrEqual(-28);
    expect(first.y).toBeLessThanOrEqual(42);
    expect(first.rotate).toBeGreaterThanOrEqual(-10);
    expect(first.rotate).toBeLessThanOrEqual(10);
  });

  it("produces different transforms for different ids", () => {
    expect(polaroidTransform("photo-a")).not.toEqual(
      polaroidTransform("photo-b"),
    );
  });
});
