import { describe, expect, it } from "vitest";

import { validateWorkInput } from "./validation";
import type { WorkInput } from "./types";

function validInput(overrides: Partial<WorkInput> = {}): WorkInput {
  return {
    name: "Theodore Dashboard",
    slug: "theodore-dashboard",
    summary: "一个个人工作台与作品集。",
    description: "## 项目介绍\n\n使用 Next.js 构建。",
    coverPath: "/works/dashboard-cover.jpg",
    techStack: ["Next.js", "TypeScript"],
    status: "maintained",
    visibility: "private",
    startedOn: "2026-06-01",
    completedOn: "",
    websiteUrl: "https://example.com",
    githubUrl: "https://github.com/example/project",
    websiteAvailable: true,
    featured: false,
    sortOrder: 1,
    seoTitle: "",
    seoDescription: "",
    seoImagePath: "",
    screenshots: [
      {
        imagePath: "/works/dashboard-home.jpg",
        caption: "首页",
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}

describe("validateWorkInput", () => {
  it("allows a draft with only a name", () => {
    const result = validateWorkInput(
      validInput({
        visibility: "draft",
        slug: "",
        summary: "",
        description: "",
        websiteUrl: "",
        githubUrl: "",
        coverPath: "",
        screenshots: [],
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      name: "Theodore Dashboard",
      slug: null,
      summary: null,
      websiteUrl: null,
    });
  });

  it("rejects missing public fields", () => {
    const result = validateWorkInput(
      validInput({
        visibility: "public",
        slug: "",
        summary: "",
        description: "",
        websiteUrl: "",
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toMatchObject({
      slug: expect.any(Array),
      summary: expect.any(Array),
      description: expect.any(Array),
      websiteUrl: expect.any(Array),
    });
  });

  it("rejects unsafe slugs, links, and image paths", () => {
    const result = validateWorkInput(
      validInput({
        slug: "Bad Slug",
        websiteUrl: "http://example.com",
        githubUrl: "javascript:alert(1)",
        coverPath: "relative/image.jpg",
        screenshots: [
          { imagePath: "//example.com/image.jpg", caption: "", sortOrder: 0 },
        ],
      }),
    );

    expect(result.errors.slug).toBeDefined();
    expect(result.errors.websiteUrl).toBeDefined();
    expect(result.errors.githubUrl).toBeDefined();
    expect(result.errors.coverPath).toBeDefined();
    expect(result.errors.screenshots).toBeDefined();
  });

  it("normalizes and deduplicates technology tags", () => {
    const result = validateWorkInput(
      validInput({
        techStack: [" Next.js ", "next.js", "", "TypeScript"],
      }),
    );

    expect(result.data?.techStack).toEqual(["Next.js", "TypeScript"]);
  });

  it("rejects duplicate screenshot ordering and reversed dates", () => {
    const result = validateWorkInput(
      validInput({
        startedOn: "2026-07-01",
        completedOn: "2026-06-01",
        screenshots: [
          { imagePath: "/one.jpg", caption: "", sortOrder: 0 },
          { imagePath: "/two.jpg", caption: "", sortOrder: 0 },
        ],
      }),
    );

    expect(result.errors.completedOn).toBeDefined();
    expect(result.errors.screenshots).toBeDefined();
  });

  it("rejects oversized public text and screenshot captions", () => {
    const result = validateWorkInput(
      validInput({
        summary: "a".repeat(241),
        description: "a".repeat(20001),
        screenshots: [
          {
            imagePath: "/one.jpg",
            caption: "a".repeat(161),
            sortOrder: 0,
          },
        ],
      }),
    );

    expect(result.errors.summary).toBeDefined();
    expect(result.errors.description).toBeDefined();
    expect(result.errors.screenshots).toBeDefined();
  });
});
