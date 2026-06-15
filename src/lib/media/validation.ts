import {
  MEDIA_FAVICON_MIME_TYPES,
  MEDIA_MAX_BYTES,
  MEDIA_WEBP_MIME_TYPE,
} from "./constants";
import type { MediaExtension } from "./types";
import { isWebpBytes } from "../photos/validation";

type ParsedMediaUploadFileResult =
  | {
      ok: true;
      data: { file: File; bytes: Uint8Array; extension: MediaExtension };
    }
  | { ok: false; message: string };

const FAVICON_EXTENSIONS_BY_MIME = new Map<string, MediaExtension>([
  ["image/x-icon", "ico"],
  ["image/vnd.microsoft.icon", "ico"],
  ["image/png", "png"],
  ["image/svg+xml", "svg"],
]);
const FAVICON_MIME_TYPES = new Set<string>(MEDIA_FAVICON_MIME_TYPES);

function extensionFromFilename(name: string) {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

export function isAllowedFaviconFile(file: File): boolean {
  if (!FAVICON_MIME_TYPES.has(file.type)) return false;

  const expectedExtension = FAVICON_EXTENSIONS_BY_MIME.get(file.type);
  return extensionFromFilename(file.name) === expectedExtension;
}

export function extensionForMediaFile(file: File): MediaExtension {
  if (file.type === MEDIA_WEBP_MIME_TYPE) return "webp";

  const extension = FAVICON_EXTENSIONS_BY_MIME.get(file.type);
  if (extension && extensionFromFilename(file.name) === extension) {
    return extension;
  }

  throw new Error("Unsupported media file extension.");
}

export async function parseMediaUploadFile(
  value: FormDataEntryValue | null,
  options: { favicon: boolean },
): Promise<ParsedMediaUploadFileResult> {
  if (!(value instanceof File)) {
    return { ok: false, message: "请选择要上传的媒体文件。" };
  }
  if (value.size === 0) {
    return { ok: false, message: "上传的媒体文件不能为空。" };
  }
  if (value.size > MEDIA_MAX_BYTES) {
    return { ok: false, message: "上传的媒体文件不能超过 10 MB。" };
  }

  if (options.favicon) {
    if (!isAllowedFaviconFile(value)) {
      return {
        ok: false,
        message: "网站图标文件必须是 ICO、PNG 或 SVG 格式。",
      };
    }

    return {
      ok: true,
      data: {
        file: value,
        bytes: new Uint8Array(await value.arrayBuffer()),
        extension: extensionForMediaFile(value),
      },
    };
  }

  if (value.type !== MEDIA_WEBP_MIME_TYPE) {
    return { ok: false, message: "普通媒体文件必须是 WebP 格式。" };
  }

  const bytes = new Uint8Array(await value.arrayBuffer());
  if (!isWebpBytes(bytes)) {
    return { ok: false, message: "上传的 WebP 文件结构无效。" };
  }

  return {
    ok: true,
    data: { file: value, bytes, extension: "webp" },
  };
}
