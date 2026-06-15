import { describe, expect, it } from "vitest";

import { MEDIA_MAX_BYTES } from "./constants";
import {
  extensionForMediaFile,
  isAllowedFaviconFile,
  parseMediaUploadFile,
} from "./validation";

const webpBytes = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x16, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x20, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x9d,
  0x01, 0x2a, 0x00, 0x00, 0x00, 0x00,
]);

describe("media upload validation", () => {
  it("accepts structurally valid WebP uploads", async () => {
    const file = new File([webpBytes], "photo.webp", { type: "image/webp" });

    const result = await parseMediaUploadFile(file, { favicon: false });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.extension).toBe("webp");
      expect(result.data.bytes).toEqual(webpBytes);
    }
  });

  it("rejects empty files and wrong MIME for WebP uploads", async () => {
    await expect(parseMediaUploadFile(null, { favicon: false })).resolves.toEqual(
      { ok: false, message: "请选择要上传的媒体文件。" },
    );
    await expect(
      parseMediaUploadFile(
        new File([], "empty.webp", { type: "image/webp" }),
        { favicon: false },
      ),
    ).resolves.toEqual({
      ok: false,
      message: "上传的媒体文件不能为空。",
    });
    await expect(
      parseMediaUploadFile(
        new File([webpBytes], "photo.png", { type: "image/png" }),
        { favicon: false },
      ),
    ).resolves.toEqual({
      ok: false,
      message: "普通媒体文件必须是 WebP 格式。",
    });
  });

  it("rejects WebP uploads with invalid bytes", async () => {
    await expect(
      parseMediaUploadFile(
        new File(["not-webp"], "photo.webp", { type: "image/webp" }),
        { favicon: false },
      ),
    ).resolves.toEqual({
      ok: false,
      message: "上传的 WebP 文件结构无效。",
    });
  });

  it("rejects files over the media size limit", async () => {
    await expect(
      parseMediaUploadFile(
        new File([new Uint8Array(MEDIA_MAX_BYTES + 1)], "large.webp", {
          type: "image/webp",
        }),
        { favicon: false },
      ),
    ).resolves.toEqual({
      ok: false,
      message: "上传的媒体文件不能超过 10 MB。",
    });
  });

  it("accepts only favicon ICO PNG and SVG files", () => {
    expect(
      isAllowedFaviconFile(
        new File(["x"], "icon.ico", { type: "image/x-icon" }),
      ),
    ).toBe(true);
    expect(
      isAllowedFaviconFile(
        new File(["x"], "icon.png", { type: "image/png" }),
      ),
    ).toBe(true);
    expect(
      isAllowedFaviconFile(
        new File(["<svg />"], "icon.svg", { type: "image/svg+xml" }),
      ),
    ).toBe(true);
    expect(
      isAllowedFaviconFile(
        new File(["x"], "icon.webp", { type: "image/webp" }),
      ),
    ).toBe(false);
  });

  it("rejects favicon files when MIME type and extension disagree", async () => {
    const mismatched = new File(["x"], "icon.png", {
      type: "image/x-icon",
    });

    expect(isAllowedFaviconFile(mismatched)).toBe(false);
    await expect(
      parseMediaUploadFile(mismatched, { favicon: true }),
    ).resolves.toEqual({
      ok: false,
      message: "网站图标文件必须是 ICO、PNG 或 SVG 格式。",
    });
  });

  it("derives safe extensions from file type and name", () => {
    expect(
      extensionForMediaFile(
        new File(["x"], "favicon.ico", { type: "image/x-icon" }),
      ),
    ).toBe("ico");
    expect(
      extensionForMediaFile(
        new File(["x"], "favicon.png", { type: "image/png" }),
      ),
    ).toBe("png");
    expect(
      extensionForMediaFile(
        new File(["<svg />"], "favicon.svg", { type: "image/svg+xml" }),
      ),
    ).toBe("svg");
  });
});
