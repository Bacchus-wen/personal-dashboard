import { describe, expect, it } from "vitest";

import {
  isWebpBytes,
  normalizePhotoGroup,
  safeOriginalFilename,
  validatePhotoInput,
} from "./validation";

describe("validatePhotoInput", () => {
  it("normalizes valid visibility and sort order", () => {
    expect(validatePhotoInput({ visibility: "public", sortOrder: "3" })).toEqual({
      ok: true,
      data: { visibility: "public", sortOrder: 3 },
      errors: {},
    });
  });

  it("rejects unsupported visibility and negative sort order", () => {
    const result = validatePhotoInput({ visibility: "other", sortOrder: "-1" });

    expect(result.ok).toBe(false);
    expect(result.errors.visibility).toBeDefined();
    expect(result.errors.sortOrder).toBeDefined();
  });
});

describe("normalizePhotoGroup", () => {
  it("normalizes malformed and out-of-range group values", () => {
    expect(normalizePhotoGroup("bad", 25)).toBe(1);
    expect(normalizePhotoGroup("-1", 25)).toBe(1);
    expect(normalizePhotoGroup("9", 25)).toBe(3);
    expect(normalizePhotoGroup(["2", "3"], 25)).toBe(2);
    expect(normalizePhotoGroup("2", 0)).toBe(1);
  });
});

describe("safeOriginalFilename", () => {
  it("removes paths and control characters while keeping a useful name", () => {
    expect(safeOriginalFilename(" C:\\secret\\trip\u0000.jpg ")).toBe(
      "C__secret_trip.jpg",
    );
    expect(safeOriginalFilename("")).toBe("photo.webp");
    expect(safeOriginalFilename("a".repeat(300))).toHaveLength(255);
  });
});

describe("isWebpBytes", () => {
  it("accepts only RIFF WEBP headers", () => {
    expect(
      isWebpBytes(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
        ]),
      ),
    ).toBe(true);
    expect(isWebpBytes(new Uint8Array([0x52, 0x49, 0x46, 0x46]))).toBe(false);
    expect(
      isWebpBytes(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x4a, 0x50, 0x45, 0x47,
        ]),
      ),
    ).toBe(false);
  });
});
