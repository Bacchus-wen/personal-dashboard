const TRACK_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const MUSIC_MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export type MusicUploadResult = {
  ok: boolean;
  message: string;
  path?: string;
  publicUrl?: string;
};

function extensionFromFilename(name: string) {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

export function validateMusicOwnerId(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return TRACK_ID_PATTERN.test(normalized) ? normalized : null;
}

export async function parseMusicUploadFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File)) {
    return { ok: false as const, message: "请选择要上传的 MP3 文件。" };
  }
  if (value.size === 0) {
    return { ok: false as const, message: "上传的 MP3 文件不能为空。" };
  }
  if (value.size > MUSIC_MAX_AUDIO_BYTES) {
    return { ok: false as const, message: "上传的 MP3 文件不能超过 20 MB。" };
  }
  if (
    value.type !== "audio/mpeg" ||
    extensionFromFilename(value.name) !== "mp3"
  ) {
    return { ok: false as const, message: "音乐文件必须是 MP3 格式。" };
  }

  return {
    ok: true as const,
    data: {
      file: value,
      bytes: new Uint8Array(await value.arrayBuffer()),
    },
  };
}

export function buildMusicAudioObjectPath({
  trackId,
  id,
}: {
  trackId: string;
  id: string;
}) {
  if (!TRACK_ID_PATTERN.test(trackId) || !UUID_PATTERN.test(id)) {
    throw new Error("Unsafe music object path.");
  }

  return `music/${trackId}/audio/${id}.mp3`;
}
