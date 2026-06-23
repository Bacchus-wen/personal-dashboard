import { describe, expect, it, vi } from "vitest";

import { AdminAccessError } from "../auth/guard";
import { createMusicTrackActionService } from "./actions";
import type { MusicTrackRepository } from "./repository";
import type { MusicTrack, MusicTrackInput } from "./types";

const audioPath =
  "music/track-id/audio/11111111-1111-4111-8111-111111111111.mp3";
const nextAudioPath =
  "music/track-id/audio/22222222-2222-4222-8222-222222222222.mp3";
const adminUserId = "admin-user-id";

function track(overrides: Partial<MusicTrack> = {}): MusicTrack {
  return {
    id: "track-id",
    title: "Song",
    artist: "Artist",
    audioPath,
    coverPath: null,
    isActive: false,
    sortOrder: 0,
    deletedAt: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function input(overrides: Partial<MusicTrackInput> = {}): MusicTrackInput {
  return {
    title: "Song",
    artist: "Artist",
    audioPath,
    coverPath: null,
    isActive: false,
    sortOrder: 0,
    ...overrides,
  };
}

function repository(): MusicTrackRepository {
  return {
    listActive: vi.fn(),
    listAdmin: vi.fn(),
    listTrash: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(async () => track()),
    activate: vi.fn(),
    moveToTrash: vi.fn(),
    restore: vi.fn(),
    permanentlyDelete: vi.fn(),
  };
}

describe("createMusicTrackActionService", () => {
  it("rejects anonymous and non-admin writes before repository calls", async () => {
    const tracks = repository();
    const service = createMusicTrackActionService({
      repository: tracks,
      adminUserId,
    });

    await expect(service.create(null, input())).rejects.toEqual(
      new AdminAccessError("UNAUTHENTICATED"),
    );
    await expect(service.create("other-user", input())).rejects.toEqual(
      new AdminAccessError("FORBIDDEN"),
    );

    expect(tracks.save).not.toHaveBeenCalled();
  });

  it("saves normalized valid input for the administrator", async () => {
    const tracks = repository();
    const service = createMusicTrackActionService({
      repository: tracks,
      adminUserId,
    });

    await service.create(adminUserId, input({ title: " Song " }));

    expect(tracks.save).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ title: "Song", audioPath }),
    );
  });

  it("cleans up replaced audio paths", async () => {
    const tracks = repository();
    vi.mocked(tracks.getById).mockResolvedValue(track());
    const deleteMediaObject = vi.fn(async () => {});
    const service = createMusicTrackActionService({
      repository: tracks,
      adminUserId,
      deleteMediaObject,
    });

    await service.update(adminUserId, "track-id", input({ audioPath: nextAudioPath }));

    expect(deleteMediaObject).toHaveBeenCalledWith(
      audioPath,
      "replace_old_file",
    );
  });

  it("cleans up audio paths on permanent delete", async () => {
    const tracks = repository();
    vi.mocked(tracks.getById).mockResolvedValue(track());
    const deleteMediaObject = vi.fn(async () => {});
    const service = createMusicTrackActionService({
      repository: tracks,
      adminUserId,
      deleteMediaObject,
    });

    await service.permanentlyDelete(adminUserId, "track-id");

    expect(tracks.permanentlyDelete).toHaveBeenCalledWith("track-id");
    expect(deleteMediaObject).toHaveBeenCalledWith(
      audioPath,
      "delete_asset_file",
    );
  });
});
