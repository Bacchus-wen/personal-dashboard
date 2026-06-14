import { describe, expect, it } from "vitest";

import { pickRandomHomePhotos } from "./home-selection";
import type { PublicPhoto } from "./types";

const photos: PublicPhoto[] = Array.from({ length: 6 }, (_, index) => ({
  id: `photo-${index}`,
  publicUrl: `https://cdn.example/photo-${index}.webp`,
  sortOrder: index,
  createdAt: `2026-06-0${index + 1}T00:00:00.000Z`,
}));

describe("pickRandomHomePhotos", () => {
  it("returns at most three unique photos without mutating input", () => {
    const original = [...photos];

    const selected = pickRandomHomePhotos(photos, 3, () => 0.25);

    expect(selected).toHaveLength(3);
    expect(new Set(selected.map((photo) => photo.id)).size).toBe(3);
    expect(photos).toEqual(original);
  });

  it("returns all available photos when fewer than the limit exist", () => {
    expect(pickRandomHomePhotos(photos.slice(0, 2), 3, () => 0)).toHaveLength(2);
  });
});
