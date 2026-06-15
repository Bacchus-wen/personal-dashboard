import { describe, expect, it, vi } from "vitest";

import type { Work } from "./types";
import {
  getWorkMediaUploadState,
  resolveWorkDisplayMedia,
} from "./media";

function createWork(overrides: Partial<Work> = {}): Work {
  return {
    id: "work-123",
    name: "Theodore",
    slug: "theodore",
    summary: "summary",
    description: "description",
    coverPath: "works/work-123/cover/00000000-0000-4000-8000-000000000001.webp",
    techStack: [],
    status: "completed",
    visibility: "public",
    startedOn: null,
    completedOn: null,
    websiteUrl: null,
    githubUrl: null,
    websiteAvailable: true,
    featured: false,
    sortOrder: 0,
    seoTitle: null,
    seoDescription: null,
    seoImagePath:
      "works/work-123/seo/00000000-0000-4000-8000-000000000002.webp",
    screenshots: [
      {
        id: "shot-1",
        imagePath:
          "works/work-123/screenshots/00000000-0000-4000-8000-000000000003.webp",
        caption: "Gallery",
        sortOrder: 0,
      },
      {
        id: "shot-2",
        imagePath: "https://cdn.example.com/manual-shot.webp",
        caption: null,
        sortOrder: 1,
      },
    ],
    deletedAt: null,
    createdAt: "2026-06-15T00:00:00.000Z",
    updatedAt: "2026-06-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("work media helpers", () => {
  it("disables uploads until a work has been saved", () => {
    expect(getWorkMediaUploadState(null)).toEqual({
      ownerId: null,
      disabledHint: "Save the work once before uploading cover, SEO, or screenshots.",
    });

    expect(getWorkMediaUploadState(createWork())).toEqual({
      ownerId: "work-123",
      disabledHint: null,
    });
  });

  it("resolves only generated system media paths for public display", () => {
    const publicUrlForPath = vi.fn(
      (path: string) => `https://public.example.com/${path}`,
    );

    const resolved = resolveWorkDisplayMedia(createWork(), publicUrlForPath);

    expect(resolved.coverPath).toBe(
      "https://public.example.com/works/work-123/cover/00000000-0000-4000-8000-000000000001.webp",
    );
    expect(resolved.seoImagePath).toBe(
      "https://public.example.com/works/work-123/seo/00000000-0000-4000-8000-000000000002.webp",
    );
    expect(resolved.screenshots[0]?.imagePath).toBe(
      "https://public.example.com/works/work-123/screenshots/00000000-0000-4000-8000-000000000003.webp",
    );
    expect(resolved.screenshots[1]?.imagePath).toBe(
      "https://cdn.example.com/manual-shot.webp",
    );
    expect(publicUrlForPath).toHaveBeenCalledTimes(3);
  });
});
