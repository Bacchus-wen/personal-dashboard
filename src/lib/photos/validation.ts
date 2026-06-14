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
  if (bytes.length < 12) return false;
  return (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}
