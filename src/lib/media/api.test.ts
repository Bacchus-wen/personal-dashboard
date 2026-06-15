import { describe, expect, it } from "vitest";

import {
  parseMediaDeletePath,
  parseMediaUploadTarget,
} from "./api";

describe("media API boundaries", () => {
  it("allows only configured upload targets", () => {
    expect(
      parseMediaUploadTarget({
        purpose: "site",
        variant: "avatar",
      }),
    ).toEqual({
      ok: true,
      data: { purpose: "site", variant: "avatar", ownerId: null },
      favicon: false,
    });

    expect(
      parseMediaUploadTarget({
        purpose: "site",
        variant: "screenshot",
      }),
    ).toMatchObject({ ok: false });
  });

  it("marks favicon uploads for favicon file validation", () => {
    expect(
      parseMediaUploadTarget({
        purpose: "test",
        variant: "favicon",
      }),
    ).toMatchObject({ ok: true, favicon: true });
  });

  it("allows delete only for generated system paths", () => {
    expect(
      parseMediaDeletePath("test/00000000-0000-4000-8000-000000000001.webp"),
    ).toEqual({
      ok: true,
      path: "test/00000000-0000-4000-8000-000000000001.webp",
    });
    expect(parseMediaDeletePath("https://example.com/external.webp")).toEqual({
      ok: false,
      message: "只能删除系统生成的媒体文件。",
    });
  });
});
