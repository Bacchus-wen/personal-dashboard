import { describe, expect, it } from "vitest";

import { PHOTO_MAX_BYTES } from "./constants";
import { parseProcessedPhotoFile } from "./upload-request";

const webpBytes = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x16, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

describe("parseProcessedPhotoFile", () => {
  it("requires a file", async () => {
    await expect(parseProcessedPhotoFile(null)).resolves.toEqual({
      ok: false,
      message: "请选择处理后的 WebP 照片。",
    });
  });

  it("rejects non-WebP MIME types", async () => {
    const file = new File([webpBytes], "photo.png", { type: "image/png" });

    await expect(parseProcessedPhotoFile(file)).resolves.toEqual({
      ok: false,
      message: "处理后的照片必须是 WebP 格式。",
    });
  });

  it("rejects empty files", async () => {
    const file = new File([], "photo.webp", { type: "image/webp" });

    await expect(parseProcessedPhotoFile(file)).resolves.toEqual({
      ok: false,
      message: "处理后的照片不能为空。",
    });
  });

  it("rejects oversized files before reading bytes", async () => {
    const file = new File([webpBytes], "photo.webp", { type: "image/webp" });
    Object.defineProperty(file, "size", { value: PHOTO_MAX_BYTES + 1 });

    await expect(parseProcessedPhotoFile(file)).resolves.toEqual({
      ok: false,
      message: "处理后的照片不能超过 10 MB。",
    });
  });

  it("rejects false WebP headers", async () => {
    const file = new File(["not-webp-data"], "photo.webp", {
      type: "image/webp",
    });

    await expect(parseProcessedPhotoFile(file)).resolves.toEqual({
      ok: false,
      message: "处理后的照片不是有效的 WebP 文件。",
    });
  });

  it("returns valid WebP bytes and a safe original filename", async () => {
    const file = new File([webpBytes], "../trip?.webp", {
      type: "image/webp",
    });

    const result = await parseProcessedPhotoFile(file);

    expect(result).toMatchObject({
      ok: true,
      file,
      originalFilename: ".._trip_.webp",
    });
    expect(result.ok && result.bytes).toEqual(webpBytes);
  });
});
