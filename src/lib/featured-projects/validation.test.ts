import { describe, expect, it } from "vitest";

import type { FeaturedProjectInput } from "./types";
import { validateFeaturedProjectInput } from "./validation";

function validProjectInput(
  overrides: Partial<FeaturedProjectInput> = {},
): FeaturedProjectInput {
  return {
    name: "Focused Toolkit",
    repositoryUrl: "https://github.com/example/focused-toolkit",
    summary: "A small toolkit with clear boundaries.",
    recommendation: "A useful example of controlled complexity.",
    language: "TypeScript",
    tags: ["Tools", "Architecture"],
    starCount: "12400",
    starRecordedOn: "2026-06-14",
    visibility: "public",
    featured: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe("validateFeaturedProjectInput", () => {
  it("allows a draft with only a name", () => {
    const result = validateFeaturedProjectInput(
      validProjectInput({
        repositoryUrl: "",
        summary: "",
        recommendation: "",
        language: "",
        tags: [],
        starCount: "",
        starRecordedOn: "",
        visibility: "draft",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      name: "Focused Toolkit",
      repositoryUrl: null,
      summary: null,
      recommendation: null,
      language: null,
      starCount: null,
      starRecordedOn: null,
    });
  });

  it("requires repository, summary, and recommendation for public projects", () => {
    const result = validateFeaturedProjectInput(
      validProjectInput({
        repositoryUrl: "",
        summary: "",
        recommendation: "",
      }),
    );

    expect(result.errors).toMatchObject({
      repositoryUrl: expect.any(Array),
      summary: expect.any(Array),
      recommendation: expect.any(Array),
    });
  });

  it("requires an https github repository url", () => {
    for (const repositoryUrl of [
      "http://github.com/example/project",
      "https://github.example.com/example/project",
      "https://example.com/github/project",
    ]) {
      expect(
        validateFeaturedProjectInput(validProjectInput({ repositoryUrl })).errors
          .repositoryUrl,
      ).toBeDefined();
    }
  });

  it("requires star count and recorded date together", () => {
    expect(
      validateFeaturedProjectInput(
        validProjectInput({ starCount: "", starRecordedOn: "2026-06-14" }),
      ).errors.starCount,
    ).toBeDefined();
    expect(
      validateFeaturedProjectInput(
        validProjectInput({ starCount: "12400", starRecordedOn: "" }),
      ).errors.starRecordedOn,
    ).toBeDefined();
  });

  it("rejects negative star count and invalid recorded date", () => {
    const result = validateFeaturedProjectInput(
      validProjectInput({ starCount: "-1", starRecordedOn: "2026-02-30" }),
    );

    expect(result.errors.starCount).toBeDefined();
    expect(result.errors.starRecordedOn).toBeDefined();
  });

  it("normalizes language, tags, and optional text", () => {
    const result = validateFeaturedProjectInput(
      validProjectInput({
        repositoryUrl: " https://github.com/example/focused-toolkit ",
        summary: " Summary ",
        recommendation: " Reason ",
        language: " TypeScript ",
        tags: [" Tools ", "tools", "", "Architecture"],
      }),
    );

    expect(result.data).toMatchObject({
      repositoryUrl: "https://github.com/example/focused-toolkit",
      summary: "Summary",
      recommendation: "Reason",
      language: "TypeScript",
      tags: ["Tools", "Architecture"],
    });
  });

  it("rejects oversized text, tags, and negative sort order", () => {
    const result = validateFeaturedProjectInput(
      validProjectInput({
        name: "a".repeat(121),
        summary: "a".repeat(321),
        recommendation: "a".repeat(321),
        language: "a".repeat(61),
        tags: ["a".repeat(31)],
        sortOrder: -1,
      }),
    );

    expect(result.errors).toMatchObject({
      name: expect.any(Array),
      summary: expect.any(Array),
      recommendation: expect.any(Array),
      language: expect.any(Array),
      tags: expect.any(Array),
      sortOrder: expect.any(Array),
    });
  });
});
