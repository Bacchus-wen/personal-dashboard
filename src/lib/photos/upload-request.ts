import { PHOTO_MAX_BYTES } from "./constants";
import { isWebpBytes, safeOriginalFilename } from "./validation";

export type ProcessedPhotoFileResult =
  | {
      ok: true;
      file: File;
      bytes: Uint8Array;
      originalFilename: string;
    }
  | { ok: false; message: string };

export async function parseProcessedPhotoFile(
  value: FormDataEntryValue | null,
): Promise<ProcessedPhotoFileResult> {
  if (!(value instanceof File)) {
    return { ok: false, message: "请选择处理后的 WebP 照片。" };
  }
  if (value.type !== "image/webp") {
    return { ok: false, message: "处理后的照片必须是 WebP 格式。" };
  }
  if (value.size === 0) {
    return { ok: false, message: "处理后的照片不能为空。" };
  }
  if (value.size > PHOTO_MAX_BYTES) {
    return { ok: false, message: "处理后的照片不能超过 10 MB。" };
  }

  const bytes = new Uint8Array(await value.arrayBuffer());
  if (!isWebpBytes(bytes)) {
    return { ok: false, message: "处理后的照片不是有效的 WebP 文件。" };
  }

  return {
    ok: true,
    file: value,
    bytes,
    originalFilename: safeOriginalFilename(value.name),
  };
}
