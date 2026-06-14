import {
  PHOTO_BATCH_LIMIT,
  PHOTO_MAX_BYTES,
  PHOTO_MAX_EDGE,
  PHOTO_WEBP_QUALITY,
} from "./constants";

const SUPPORTED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type ClientPhotoValidation = {
  ok: boolean;
  message: string;
};

export function validateClientPhotoFile(file: File): ClientPhotoValidation {
  if (!SUPPORTED_PHOTO_TYPES.has(file.type)) {
    return { ok: false, message: "仅支持 JPEG、PNG 或 WebP 照片。" };
  }
  if (file.size === 0) {
    return { ok: false, message: "照片文件不能为空。" };
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return { ok: false, message: "原始照片不能超过 10 MB。" };
  }
  return { ok: true, message: "" };
}

export function validateClientPhotoSelection(files: File[]) {
  return files.map((file, index) =>
    index >= PHOTO_BATCH_LIMIT
      ? { ok: false, message: "每次最多处理 10 张照片。" }
      : validateClientPhotoFile(file),
  );
}

function webpFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "") || "photo";
  return `${base}.webp`;
}

export async function processPhotoFile(file: File): Promise<File> {
  const validation = validateClientPhotoFile(file);
  if (!validation.ok) throw new Error(validation.message);

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器无法处理这张照片。");
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) =>
          value ? resolve(value) : reject(new Error("照片 WebP 编码失败。")),
        "image/webp",
        PHOTO_WEBP_QUALITY,
      );
    });
    if (blob.size > PHOTO_MAX_BYTES) {
      throw new Error("处理后的照片仍超过 10 MB。");
    }
    return new File([blob], webpFilename(file.name), { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}
