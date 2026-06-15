import { isSystemMediaPath, validateMediaTarget } from "./path";
import type { MediaTarget, MediaTargetInput } from "./types";

type MediaUploadTargetResult =
  | { ok: true; data: MediaTarget; favicon: boolean }
  | { ok: false; message: string };

export function parseMediaUploadTarget(
  input: MediaTargetInput,
): MediaUploadTargetResult {
  const target = validateMediaTarget(input);
  if (!target.ok) return target;

  return {
    ok: true,
    data: target.data,
    favicon: target.data.variant === "favicon",
  };
}

export function parseMediaDeletePath(
  value: unknown,
): { ok: true; path: string } | { ok: false; message: string } {
  if (typeof value !== "string" || !isSystemMediaPath(value)) {
    return { ok: false, message: "只能删除系统生成的媒体文件。" };
  }

  return { ok: true, path: value };
}
