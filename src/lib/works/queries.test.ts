import { describe, expect, it } from "vitest";

import {
  isPublicWork,
  parseAdminWorkQuery,
  parsePublicWorkQuery,
} from "./queries";
import type { Work } from "./types";

function work(overrides: Partial<Work> = {}): Work {
  return {
    id: "work",
    name: "作品",
    slug: "work",
    summary: "摘要",
    description: "详情",
    coverPath: null,
    techStack: ["Next.js"],
    status: "maintained",
    visibility: "public",
    startedOn: null,
    completedOn: null,
    websiteUrl: "https://example.com/",
    githubUrl: null,
    websiteAvailable: true,
    featured: false,
    sortOrder: 0,
    seoTitle: null,
    seoDescription: null,
    seoImagePath: null,
    screenshots: [],
    deletedAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("parsePublicWorkQuery", () => {
  it("keeps known status and normalized technology tag", () => {
    expect(
      parsePublicWorkQuery({ status: "maintained", tech: "  Next.js  " }),
    ).toEqual({ status: "maintained", tech: "Next.js" });
  });

  it("drops unsupported public filters", () => {
    expect(parsePublicWorkQuery({ status: "unknown", tech: " " })).toEqual({
      status: null,
      tech: null,
    });
  });
});

describe("parseAdminWorkQuery", () => {
  it("normalizes administrator filters and search text", () => {
    expect(
      parseAdminWorkQuery({
        q: "  dashboard  ",
        status: "completed",
        visibility: "archived",
      }),
    ).toEqual({
      search: "dashboard",
      status: "completed",
      visibility: "archived",
    });
  });
});

describe("isPublicWork", () => {
  it("accepts only public, nondeleted works with a slug", () => {
    expect(isPublicWork(work())).toBe(true);
    expect(isPublicWork(work({ visibility: "draft" }))).toBe(false);
    expect(isPublicWork(work({ slug: null }))).toBe(false);
    expect(
      isPublicWork(work({ deletedAt: "2026-06-13T00:00:00.000Z" })),
    ).toBe(false);
  });
});
