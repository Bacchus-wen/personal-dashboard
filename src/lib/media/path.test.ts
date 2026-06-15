import { describe, expect, it } from "vitest";

import {
  buildMediaObjectPath,
  isSystemMediaPath,
  validateMediaTarget,
} from "./path";

describe("media path rules", () => {
  it("accepts the approved purpose and variant pairs", () => {
    expect(validateMediaTarget({ purpose: "site", variant: "avatar" })).toEqual({
      ok: true,
      data: { purpose: "site", variant: "avatar", ownerId: null },
    });
    expect(validateMediaTarget({ purpose: "site", variant: "favicon" }).ok).toBe(
      true,
    );
    expect(
      validateMediaTarget({
        purpose: "works",
        variant: "cover",
        ownerId: "work-id",
      }).ok,
    ).toBe(true);
    expect(
      validateMediaTarget({
        purpose: "works",
        variant: "seo",
        ownerId: "work-id",
      }).ok,
    ).toBe(true);
    expect(
      validateMediaTarget({
        purpose: "works",
        variant: "screenshot",
        ownerId: "work-id",
      }).ok,
    ).toBe(true);
    expect(
      validateMediaTarget({
        purpose: "collections",
        variant: "cover",
        ownerId: "collection-id",
      }).ok,
    ).toBe(true);
    expect(
      validateMediaTarget({
        purpose: "projects",
        variant: "cover",
        ownerId: "project-id",
      }).ok,
    ).toBe(true);
    expect(validateMediaTarget({ purpose: "test", variant: "favicon" }).ok).toBe(
      true,
    );
    expect(validateMediaTarget({ purpose: "test", variant: "test" }).ok).toBe(
      true,
    );
  });

  it("rejects invalid purpose, variant, and missing owner ids", () => {
    expect(validateMediaTarget({ purpose: "other", variant: "cover" }).ok).toBe(
      false,
    );
    expect(validateMediaTarget({ purpose: "site", variant: "cover" }).ok).toBe(
      false,
    );
    expect(validateMediaTarget({ purpose: "works", variant: "cover" }).ok).toBe(
      false,
    );
    expect(validateMediaTarget({ purpose: "works", variant: "seo" }).ok).toBe(
      false,
    );
    expect(
      validateMediaTarget({ purpose: "works", variant: "screenshot" }).ok,
    ).toBe(false);
    expect(
      validateMediaTarget({ purpose: "collections", variant: "cover" }).ok,
    ).toBe(false);
    expect(
      validateMediaTarget({ purpose: "projects", variant: "cover" }).ok,
    ).toBe(false);
  });

  it("generates approved paths without original filenames", () => {
    expect(
      buildMediaObjectPath({
        purpose: "site",
        variant: "avatar",
        ownerId: null,
        id: "00000000-0000-4000-8000-000000000001",
        extension: "webp",
      }),
    ).toBe("site/avatar/00000000-0000-4000-8000-000000000001.webp");
    expect(
      buildMediaObjectPath({
        purpose: "site",
        variant: "favicon",
        ownerId: null,
        id: "00000000-0000-4000-8000-000000000001",
        extension: "ico",
      }),
    ).toBe("site/favicon/00000000-0000-4000-8000-000000000001.ico");
    expect(
      buildMediaObjectPath({
        purpose: "works",
        variant: "screenshot",
        ownerId: "work-id",
        id: "00000000-0000-4000-8000-000000000001",
        extension: "webp",
      }),
    ).toBe(
      "works/work-id/screenshots/00000000-0000-4000-8000-000000000001.webp",
    );
    expect(
      buildMediaObjectPath({
        purpose: "test",
        variant: "test",
        ownerId: null,
        id: "00000000-0000-4000-8000-000000000001",
        extension: "png",
      }),
    ).toBe("test/00000000-0000-4000-8000-000000000001.png");
  });

  it("rejects unsafe generated path inputs", () => {
    expect(() =>
      buildMediaObjectPath({
        purpose: "works",
        variant: "cover",
        ownerId: "../bad",
        id: "00000000-0000-4000-8000-000000000001",
        extension: "webp",
      }),
    ).toThrow("Unsafe media object path.");
    expect(() =>
      buildMediaObjectPath({
        purpose: "works",
        variant: "cover",
        ownerId: "work-id",
        id: "../bad",
        extension: "webp",
      }),
    ).toThrow("Unsafe media object path.");
  });

  it("recognizes only system-owned public-media paths", () => {
    expect(
      isSystemMediaPath(
        "site/avatar/00000000-0000-4000-8000-000000000001.webp",
      ),
    ).toBe(true);
    expect(isSystemMediaPath("https://example.com/image.webp")).toBe(false);
    expect(isSystemMediaPath("/avatar.svg")).toBe(false);
    expect(isSystemMediaPath("../secret.webp")).toBe(false);
    expect(isSystemMediaPath("media/cover/image.webp")).toBe(false);
  });
});
