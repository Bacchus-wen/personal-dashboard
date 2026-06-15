import { describe, expect, it, vi } from "vitest";

import { publicMediaUrlForPath, resolveMediaDisplayUrl } from "./display";

describe("resolveMediaDisplayUrl", () => {
  it("resolves generated media paths through the public URL adapter", () => {
    const publicUrlForPath = vi.fn(
      (path: string) => `https://cdn.example/${path}`,
    );

    expect(
      resolveMediaDisplayUrl(
        "works/work-id/cover/11111111-1111-4111-8111-111111111111.webp",
        publicUrlForPath,
      ),
    ).toBe(
      "https://cdn.example/works/work-id/cover/11111111-1111-4111-8111-111111111111.webp",
    );
  });

  it("preserves HTTPS and project-local paths", () => {
    const publicUrlForPath = vi.fn((path: string) => path);

    expect(
      resolveMediaDisplayUrl("https://example.com/cover.webp", publicUrlForPath),
    ).toBe("https://example.com/cover.webp");
    expect(resolveMediaDisplayUrl("/cover.webp", publicUrlForPath)).toBe(
      "/cover.webp",
    );
    expect(publicUrlForPath).not.toHaveBeenCalled();
  });

  it("preserves empty values", () => {
    const publicUrlForPath = vi.fn((path: string) => path);

    expect(resolveMediaDisplayUrl(null, publicUrlForPath)).toBeNull();
    expect(resolveMediaDisplayUrl("", publicUrlForPath)).toBe("");
    expect(publicUrlForPath).not.toHaveBeenCalled();
  });
});

describe("publicMediaUrlForPath", () => {
  it("builds a public-media URL from the public Supabase URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    expect(publicMediaUrlForPath("site/avatar/file.webp")).toBe(
      "https://project.supabase.co/storage/v1/object/public/public-media/site/avatar/file.webp",
    );
  });
});
