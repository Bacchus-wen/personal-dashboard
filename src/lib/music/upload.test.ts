import { describe, expect, it } from "vitest";

import {
  MUSIC_MAX_AUDIO_BYTES,
  buildMusicAudioObjectPath,
  parseMusicUploadFile,
  validateMusicOwnerId,
} from "./upload";

describe("music upload validation", () => {
  it("accepts MP3 files", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "song.mp3", {
      type: "audio/mpeg",
    });

    await expect(parseMusicUploadFile(file)).resolves.toMatchObject({
      ok: true,
    });
  });

  it("rejects non-MP3 and oversized files", async () => {
    const wav = new File([new Uint8Array([1])], "song.wav", {
      type: "audio/wav",
    });
    const large = new File([new Uint8Array(1)], "large.mp3", {
      type: "audio/mpeg",
    });
    Object.defineProperty(large, "size", { value: MUSIC_MAX_AUDIO_BYTES + 1 });

    await expect(parseMusicUploadFile(wav)).resolves.toMatchObject({
      ok: false,
    });
    await expect(parseMusicUploadFile(large)).resolves.toMatchObject({
      ok: false,
    });
  });

  it("validates owner ids and builds safe storage paths", () => {
    expect(validateMusicOwnerId("track-id_1")).toBe("track-id_1");
    expect(validateMusicOwnerId("../bad")).toBeNull();
    expect(
      buildMusicAudioObjectPath({
        trackId: "track-id",
        id: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe("music/track-id/audio/11111111-1111-4111-8111-111111111111.mp3");
  });
});
