import {
  PHOTO_GROUP_SIZE,
  PHOTO_VISIBILITIES,
  type PhotoVisibility,
} from "./constants";
import type {
  PhotoFieldErrors,
  PhotoInput,
  PhotoValidationResult,
} from "./types";

function isPhotoVisibility(value: string): value is PhotoVisibility {
  return PHOTO_VISIBILITIES.includes(value as PhotoVisibility);
}

export function validatePhotoInput(input: PhotoInput): PhotoValidationResult {
  const errors: PhotoFieldErrors = {};
  const sortOrder = Number(input.sortOrder);

  if (!isPhotoVisibility(input.visibility)) {
    errors.visibility = ["请选择有效的照片状态。"];
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.sortOrder = ["排序必须是非负整数。"];
  }

  if (Object.keys(errors).length || !isPhotoVisibility(input.visibility)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { visibility: input.visibility, sortOrder },
    errors: {},
  };
}

export function normalizePhotoGroup(
  value: string | string[] | undefined,
  total: number,
) {
  const raw = Array.isArray(value) ? value[0] : value;
  const requested = Number(raw);
  const groups = Math.max(1, Math.ceil(Math.max(0, total) / PHOTO_GROUP_SIZE));

  if (!Number.isInteger(requested) || requested < 1) return 1;
  return Math.min(requested, groups);
}

export function safeOriginalFilename(value: string) {
  const cleaned = value
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 255);

  return cleaned || "photo.webp";
}

export function isWebpBytes(bytes: Uint8Array) {
  if (bytes.length < 25) return false;
  const text = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));
  const uint32 = (start: number) =>
    bytes[start] |
    (bytes[start + 1] << 8) |
    (bytes[start + 2] << 16) |
    (bytes[start + 3] << 24);

  if (text(0, 4) !== "RIFF" || text(8, 4) !== "WEBP") return false;
  if (uint32(4) >>> 0 !== bytes.length - 8) return false;

  const chunkType = text(12, 4);
  const chunkSize = uint32(16) >>> 0;
  const paddedChunkEnd = 20 + chunkSize + (chunkSize % 2);
  if (paddedChunkEnd > bytes.length) return false;

  if (chunkType === "VP8X") return chunkSize >= 10;
  if (chunkType === "VP8L") return chunkSize >= 5 && bytes[20] === 0x2f;
  return (
    chunkType === "VP8 " &&
    chunkSize >= 10 &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  );
}
