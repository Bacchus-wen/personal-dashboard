import { isSystemMediaPath } from "../media/path";
import type {
  MusicTrackFieldErrors,
  MusicTrackInput,
  MusicTrackValidationResult,
} from "./types";

const MUSIC_AUDIO_PATH_PATTERN =
  /^music\/[A-Za-z0-9_-]+\/audio\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.mp3$/;

export function isSystemMusicAudioPath(path: string) {
  return MUSIC_AUDIO_PATH_PATTERN.test(path);
}

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function validateCoverPath(value: string | null) {
  const normalized = optionalText(value);
  if (!normalized) return null;
  if (isSystemMediaPath(normalized)) return normalized;

  if (
    normalized.startsWith("/") &&
    !normalized.startsWith("//") &&
    !normalized.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    return normalized;
  }

  try {
    const url = new URL(normalized);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function validateMusicTrackInput(
  input: MusicTrackInput,
): MusicTrackValidationResult {
  const errors: MusicTrackFieldErrors = {};
  const title = input.title.trim();
  const artist = optionalText(input.artist);
  const audioPath = optionalText(input.audioPath);
  const coverPath = validateCoverPath(input.coverPath);
  const sortOrder =
    typeof input.sortOrder === "number"
      ? input.sortOrder
      : Number(input.sortOrder.trim());

  if (!title || title.length > 120) {
    errors.title = ["音乐标题必须为 1 到 120 个字符。"];
  }
  if ((artist?.length ?? 0) > 120) {
    errors.artist = ["艺术家名称不能超过 120 个字符。"];
  }
  if (!audioPath || !isSystemMusicAudioPath(audioPath)) {
    errors.audioPath = ["请上传有效的 MP3 音频文件。"];
  }
  if (optionalText(input.coverPath) && !coverPath) {
    errors.coverPath = ["封面必须使用本地路径、系统媒体路径或 HTTPS 地址。"];
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.sortOrder = ["排序必须为非负整数。"];
  }

  if (Object.keys(errors).length || !audioPath) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    data: {
      title,
      artist,
      audioPath,
      coverPath,
      isActive: input.isActive,
      sortOrder,
    },
  };
}
