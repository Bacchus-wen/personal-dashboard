import { describe, expect, it } from "vitest";

import {
  isSystemMusicAudioPath,
  validateMusicTrackInput,
} from "./validation";
import type { MusicTrackInput } from "./types";

const audioPath =
  "music/track-id/audio/11111111-1111-4111-8111-111111111111.mp3";

function input(overrides: Partial<MusicTrackInput> = {}): MusicTrackInput {
  return {
    title: "Close To You",
    artist: "The Carpenters",
    audioPath,
    coverPath: null,
    isActive: false,
    sortOrder: 0,
    ...overrides,
  };
}

describe("music track validation", () => {
  it("accepts normalized valid music input", () => {
    const result = validateMusicTrackInput(
      input({ title: "  Song  ", artist: "  Artist  ", sortOrder: "2" }),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      title: "Song",
      artist: "Artist",
      audioPath,
      sortOrder: 2,
    });
  });

  it("requires a generated MP3 audio path", () => {
    const result = validateMusicTrackInput(input({ audioPath: "https://x.test/a.mp3" }));

    expect(result.ok).toBe(false);
    expect(result.errors.audioPath).toBeDefined();
  });

  it("recognizes system music audio paths", () => {
    expect(isSystemMusicAudioPath(audioPath)).toBe(true);
    expect(isSystemMusicAudioPath("music/track-id/audio/file.wav")).toBe(false);
  });

  it("validates title, artist, cover, and sort order", () => {
    const result = validateMusicTrackInput(
      input({
        title: "",
        artist: "a".repeat(121),
        coverPath: "javascript:alert(1)",
        sortOrder: "-1",
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.artist).toBeDefined();
    expect(result.errors.coverPath).toBeDefined();
    expect(result.errors.sortOrder).toBeDefined();
  });
});
