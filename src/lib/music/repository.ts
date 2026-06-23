import type { MusicTrack, ValidMusicTrackInput } from "./types";

export const MUSIC_TRACK_COLUMNS =
  "id,title,artist,audio_path,cover_path,is_active,sort_order,deleted_at,created_at,updated_at";

export type MusicTrackDatabaseRow = Record<string, unknown>;
export type MusicTrackDatabaseFilter = {
  column: string;
  operator: "eq" | "is" | "not_is";
  value: unknown;
};
export type MusicTrackDatabaseOrder = {
  column: string;
  ascending: boolean;
};
export type MusicTrackDatabaseRequest = {
  table: "music_tracks";
  columns?: string;
  filters?: MusicTrackDatabaseFilter[];
  orders?: MusicTrackDatabaseOrder[];
  values?: Record<string, unknown>;
  returning?: boolean;
};
export type MusicTrackDatabaseClient = {
  selectMany(
    request: MusicTrackDatabaseRequest,
  ): Promise<{ rows: MusicTrackDatabaseRow[] }>;
  selectOne(
    request: MusicTrackDatabaseRequest,
  ): Promise<{ row: MusicTrackDatabaseRow | null }>;
  insert(
    request: MusicTrackDatabaseRequest,
  ): Promise<{ row: MusicTrackDatabaseRow }>;
  update(
    request: MusicTrackDatabaseRequest,
  ): Promise<{ row: MusicTrackDatabaseRow } | void>;
  delete(request: MusicTrackDatabaseRequest): Promise<void>;
};

export type MusicTrackRepository = {
  listActive(): Promise<MusicTrack | null>;
  listAdmin(): Promise<MusicTrack[]>;
  listTrash(): Promise<MusicTrack[]>;
  getById(id: string): Promise<MusicTrack | null>;
  save(id: string | null, input: ValidMusicTrackInput): Promise<MusicTrack>;
  activate(id: string): Promise<void>;
  moveToTrash(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  permanentlyDelete(id: string): Promise<void>;
};

function trackFromRow(row: MusicTrackDatabaseRow): MusicTrack {
  return {
    id: String(row.id),
    title: String(row.title),
    artist: row.artist === null ? null : String(row.artist),
    audioPath: String(row.audio_path),
    coverPath: row.cover_path === null ? null : String(row.cover_path),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order),
    deletedAt: row.deleted_at === null ? null : String(row.deleted_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function payload(input: ValidMusicTrackInput) {
  return {
    title: input.title,
    artist: input.artist,
    audio_path: input.audioPath,
    cover_path: input.coverPath,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  };
}

export function createMusicTrackRepository(
  client: MusicTrackDatabaseClient,
): MusicTrackRepository {
  const activeFilter: MusicTrackDatabaseFilter = {
    column: "deleted_at",
    operator: "is",
    value: null,
  };

  return {
    async listActive() {
      const { row } = await client.selectOne({
        table: "music_tracks",
        columns: MUSIC_TRACK_COLUMNS,
        filters: [
          activeFilter,
          { column: "is_active", operator: "eq", value: true },
        ],
      });
      return row ? trackFromRow(row) : null;
    },

    async listAdmin() {
      const { rows } = await client.selectMany({
        table: "music_tracks",
        columns: MUSIC_TRACK_COLUMNS,
        filters: [activeFilter],
        orders: [
          { column: "is_active", ascending: false },
          { column: "sort_order", ascending: true },
          { column: "updated_at", ascending: false },
        ],
      });
      return rows.map(trackFromRow);
    },

    async listTrash() {
      const { rows } = await client.selectMany({
        table: "music_tracks",
        columns: MUSIC_TRACK_COLUMNS,
        filters: [{ column: "deleted_at", operator: "not_is", value: null }],
        orders: [{ column: "deleted_at", ascending: false }],
      });
      return rows.map(trackFromRow);
    },

    async getById(id) {
      const { row } = await client.selectOne({
        table: "music_tracks",
        columns: MUSIC_TRACK_COLUMNS,
        filters: [{ column: "id", operator: "eq", value: id }],
      });
      return row ? trackFromRow(row) : null;
    },

    async save(id, input) {
      if (input.isActive) await this.activate("");
      const values = payload(input);
      if (id) {
        const result = await client.update({
          table: "music_tracks",
          values,
          filters: [{ column: "id", operator: "eq", value: id }],
          returning: true,
        });
        if (input.isActive) await this.activate(id);
        return trackFromRow(result!.row);
      }
      const { row } = await client.insert({
        table: "music_tracks",
        values,
      });
      if (input.isActive) await this.activate(String(row.id));
      return trackFromRow(row);
    },

    async activate(id) {
      await client.update({
        table: "music_tracks",
        values: { is_active: false },
        filters: [activeFilter],
      });
      if (!id) return;
      await client.update({
        table: "music_tracks",
        values: { is_active: true },
        filters: [
          { column: "id", operator: "eq", value: id },
          activeFilter,
        ],
      });
    },

    async moveToTrash(id) {
      await client.update({
        table: "music_tracks",
        values: { deleted_at: new Date().toISOString(), is_active: false },
        filters: [{ column: "id", operator: "eq", value: id }],
      });
    },

    async restore(id) {
      await client.update({
        table: "music_tracks",
        values: { deleted_at: null, is_active: false },
        filters: [{ column: "id", operator: "eq", value: id }],
      });
    },

    async permanentlyDelete(id) {
      await client.delete({
        table: "music_tracks",
        filters: [
          { column: "id", operator: "eq", value: id },
          { column: "deleted_at", operator: "not_is", value: null },
        ],
      });
    },
  };
}
