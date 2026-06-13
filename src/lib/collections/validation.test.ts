import { describe, expect, it } from "vitest";

import type { CollectionInput } from "./types";
import { validateCollectionInput } from "./validation";

function validCollectionInput(
  overrides: Partial<CollectionInput> = {},
): CollectionInput {
  return {
    title: "Reliable AI Notes",
    contentType: "article",
    sourceName: "Example",
    summary: "Why this article is worth revisiting.",
    externalUrl: "https://example.com/article",
    coverPath: "/collections/reliable-ai.jpg",
    tags: ["AI", "Engineering"],
    visibility: "public",
    featured: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe("validateCollectionInput", () => {
  it("allows a draft with only a title", () => {
    const result = validateCollectionInput(
      validCollectionInput({
        visibility: "draft",
        sourceName: "",
        summary: "",
        externalUrl: "",
        coverPath: "",
        tags: [],
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      title: "Reliable AI Notes",
      sourceName: null,
      summary: null,
      externalUrl: null,
      coverPath: null,
    });
  });

  it("requires summary and https external url for public collections", () => {
    const missing = validateCollectionInput(
      validCollectionInput({ summary: "", externalUrl: "" }),
    );
    const unsafe = validateCollectionInput(
      validCollectionInput({ externalUrl: "http://example.com/article" }),
    );

    expect(missing.errors).toMatchObject({
      summary: expect.any(Array),
      externalUrl: expect.any(Array),
    });
    expect(unsafe.errors.externalUrl).toBeDefined();
  });

  it("accepts only article or video content types", () => {
    expect(validateCollectionInput(validCollectionInput()).ok).toBe(true);
    expect(
      validateCollectionInput(validCollectionInput({ contentType: "video" }))
        .ok,
    ).toBe(true);
    expect(
      validateCollectionInput(validCollectionInput({ contentType: "podcast" }))
        .errors.contentType,
    ).toBeDefined();
  });

  it("accepts local or https covers and rejects unsafe paths", () => {
    expect(
      validateCollectionInput(
        validCollectionInput({ coverPath: "https://example.com/cover.jpg" }),
      ).ok,
    ).toBe(true);
    expect(
      validateCollectionInput(validCollectionInput({ coverPath: "/cover.jpg" }))
        .ok,
    ).toBe(true);
    expect(
      validateCollectionInput(
        validCollectionInput({ coverPath: "//example.com/cover.jpg" }),
      ).errors.coverPath,
    ).toBeDefined();
  });

  it("normalizes tags case-insensitively", () => {
    const result = validateCollectionInput(
      validCollectionInput({ tags: [" AI ", "ai", "", "Engineering"] }),
    );

    expect(result.data?.tags).toEqual(["AI", "Engineering"]);
  });

  it("rejects negative sort order and oversized text", () => {
    const result = validateCollectionInput(
      validCollectionInput({
        title: "a".repeat(121),
        sourceName: "a".repeat(121),
        summary: "a".repeat(321),
        tags: ["a".repeat(31)],
        sortOrder: -1,
      }),
    );

    expect(result.errors).toMatchObject({
      title: expect.any(Array),
      sourceName: expect.any(Array),
      summary: expect.any(Array),
      tags: expect.any(Array),
      sortOrder: expect.any(Array),
    });
  });
});
