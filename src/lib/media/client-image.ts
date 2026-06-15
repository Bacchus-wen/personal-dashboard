import {
  MEDIA_FAVICON_MIME_TYPES,
  MEDIA_MAX_BYTES,
  MEDIA_MAX_EDGE,
  MEDIA_WEBP_MIME_TYPE,
  MEDIA_WEBP_QUALITY,
} from "./constants";
import { isAllowedFaviconFile } from "./validation";

const SUPPORTED_SOURCE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const FAVICON_MIME_TYPES = new Set<string>(MEDIA_FAVICON_MIME_TYPES);

export type ProcessMediaFileOptions = {
  favicon: boolean;
  avatar: boolean;
};

export function mediaWebpFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, "").trim() || "media";
  return `${base}.webp`;
}

export function shouldPassThroughFavicon(file: File) {
  return isAllowedFaviconFile(file);
}

function validateSourceImageFile(file: File) {
  if (file.size === 0) {
    return { ok: false, message: "媒体文件不能为空。" };
  }
  if (file.size > MEDIA_MAX_BYTES) {
    return { ok: false, message: "媒体文件不能超过 10 MB。" };
  }
  if (!SUPPORTED_SOURCE_IMAGE_TYPES.has(file.type)) {
    return { ok: false, message: "仅支持 JPEG、PNG 或 WebP 图片。" };
  }

  return { ok: true, message: "" };
}

function validateFaviconFile(file: File) {
  if (file.size === 0) {
    return { ok: false, message: "网站图标文件不能为空。" };
  }
  if (file.size > MEDIA_MAX_BYTES) {
    return { ok: false, message: "网站图标文件不能超过 10 MB。" };
  }
  if (!FAVICON_MIME_TYPES.has(file.type)) {
    return { ok: false, message: "网站图标文件必须是 ICO、PNG 或 SVG 格式。" };
  }
  if (!shouldPassThroughFavicon(file)) {
    return { ok: false, message: "网站图标文件扩展名和类型不匹配。" };
  }

  return { ok: true, message: "" };
}

async function encodeCanvasAsWebp(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error("图片 WebP 编码失败。")),
      MEDIA_WEBP_MIME_TYPE,
      MEDIA_WEBP_QUALITY,
    );
  });
  if (blob.size > MEDIA_MAX_BYTES) {
    throw new Error("处理后的图片仍超过 10 MB。");
  }

  return blob;
}

export async function processMediaFile(
  file: File,
  options: ProcessMediaFileOptions,
): Promise<File> {
  if (options.favicon) {
    const validation = validateFaviconFile(file);
    if (!validation.ok) throw new Error(validation.message);
    return file;
  }

  const validation = validateSourceImageFile(file);
  if (!validation.ok) throw new Error(validation.message);

  const bitmap = await createImageBitmap(file);
  try {
    const sourceSize = options.avatar
      ? Math.min(bitmap.width, bitmap.height)
      : Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MEDIA_MAX_EDGE / sourceSize);
    const width = options.avatar
      ? Math.max(1, Math.round(sourceSize * scale))
      : Math.max(1, Math.round(bitmap.width * scale));
    const height = options.avatar
      ? width
      : Math.max(1, Math.round(bitmap.height * scale));
    const sourceX = options.avatar ? (bitmap.width - sourceSize) / 2 : 0;
    const sourceY = options.avatar ? (bitmap.height - sourceSize) / 2 : 0;
    const sourceWidth = options.avatar ? sourceSize : bitmap.width;
    const sourceHeight = options.avatar ? sourceSize : bitmap.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器无法处理这张图片。");

    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height,
    );

    const blob = await encodeCanvasAsWebp(canvas);
    return new File([blob], mediaWebpFilename(file.name), {
      type: MEDIA_WEBP_MIME_TYPE,
    });
  } finally {
    bitmap.close();
  }
}
