import type { PhotoVisibility } from "./constants";
import type {
  CleanupTaskInput,
  Photo,
  PublicPhoto,
  StorageCleanupTask,
  ValidPhotoInput,
} from "./types";

export const PHOTO_COLUMNS =
  "id,storage_path,original_filename,visibility,sort_order,deleted_at,created_at,updated_at";
export const CLEANUP_TASK_COLUMNS =
  "id,bucket_id,object_path,reason,last_error,created_at,updated_at";

export type PhotoDatabaseRow = Record<string, unknown>;

export type PhotoDatabaseFilter = {
  column: string;
  operator: "eq" | "is" | "not_is";
  value: unknown;
};

export type PhotoDatabaseOrder = {
  column: string;
  ascending: boolean;
};

export type PhotoDatabaseRequest = {
  table: "photos" | "storage_cleanup_tasks";
  columns?: string;
  filters?: PhotoDatabaseFilter[];
  orders?: PhotoDatabaseOrder[];
  values?: Record<string, unknown>;
  conflictColumn?: string;
  returning?: boolean;
};

export type PhotoDatabaseClient = {
  selectMany(
    request: PhotoDatabaseRequest,
  ): Promise<{ rows: PhotoDatabaseRow[] }>;
  selectOne(
    request: PhotoDatabaseRequest,
  ): Promise<{ row: PhotoDatabaseRow | null }>;
  insert(
    request: PhotoDatabaseRequest,
  ): Promise<{ row: PhotoDatabaseRow }>;
  update(
    request: PhotoDatabaseRequest,
  ): Promise<{ row: PhotoDatabaseRow } | void>;
  delete(request: PhotoDatabaseRequest): Promise<void>;
  upsert(request: PhotoDatabaseRequest): Promise<void>;
};

export type PhotoRepository = {
  listPublic(): Promise<PublicPhoto[]>;
  listAdmin(visibility: PhotoVisibility | null): Promise<Photo[]>;
  listTrash(): Promise<Photo[]>;
  getById(id: string, includeDeleted?: boolean): Promise<Photo | null>;
  createDraft(
    id: string,
    storagePath: string,
    originalFilename: string,
  ): Promise<Photo>;
  updateMetadata(id: string, input: ValidPhotoInput): Promise<Photo>;
  replaceStoragePath(
    id: string,
    storagePath: string,
    originalFilename: string,
  ): Promise<Photo>;
  moveToTrash(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deleteRecord(id: string): Promise<void>;
  listCleanupTasks(): Promise<StorageCleanupTask[]>;
  getCleanupTask(id: string): Promise<StorageCleanupTask | null>;
  saveCleanupTask(input: CleanupTaskInput): Promise<void>;
  deleteCleanupTask(id: string): Promise<void>;
};

function photoFromRow(row: PhotoDatabaseRow): Photo {
  return {
    id: String(row.id),
    storagePath: String(row.storage_path),
    originalFilename: String(row.original_filename),
    visibility: row.visibility as PhotoVisibility,
    sortOrder: Number(row.sort_order),
    deletedAt: row.deleted_at === null ? null : String(row.deleted_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function cleanupTaskFromRow(row: PhotoDatabaseRow): StorageCleanupTask {
  return {
    id: String(row.id),
    bucketId: String(row.bucket_id),
    objectPath: String(row.object_path),
    reason: row.reason as StorageCleanupTask["reason"],
    lastError: row.last_error === null ? null : String(row.last_error),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function createPhotoRepository(
  client: PhotoDatabaseClient,
  publicUrlForPath: (path: string) => string,
): PhotoRepository {
  const activeFilter: PhotoDatabaseFilter = {
    column: "deleted_at",
    operator: "is",
    value: null,
  };

  return {
    async listPublic() {
      const { rows } = await client.selectMany({
        table: "photos",
        columns: PHOTO_COLUMNS,
        filters: [
          { column: "visibility", operator: "eq", value: "public" },
          activeFilter,
        ],
        orders: [
          { column: "sort_order", ascending: true },
          { column: "created_at", ascending: false },
        ],
      });
      return rows.map((row) => {
        const photo = photoFromRow(row);
        return {
          id: photo.id,
          publicUrl: publicUrlForPath(photo.storagePath),
          sortOrder: photo.sortOrder,
          createdAt: photo.createdAt,
        };
      });
    },

    async listAdmin(visibility) {
      const filters = [activeFilter];
      if (visibility) {
        filters.push({ column: "visibility", operator: "eq", value: visibility });
      }
      const { rows } = await client.selectMany({
        table: "photos",
        columns: PHOTO_COLUMNS,
        filters,
        orders: [{ column: "updated_at", ascending: false }],
      });
      return rows.map(photoFromRow);
    },

    async listTrash() {
      const { rows } = await client.selectMany({
        table: "photos",
        columns: PHOTO_COLUMNS,
        filters: [{ column: "deleted_at", operator: "not_is", value: null }],
        orders: [{ column: "deleted_at", ascending: false }],
      });
      return rows.map(photoFromRow);
    },

    async getById(id, includeDeleted = false) {
      const filters: PhotoDatabaseFilter[] = [
        { column: "id", operator: "eq", value: id },
      ];
      if (!includeDeleted) filters.push(activeFilter);
      const { row } = await client.selectOne({
        table: "photos",
        columns: PHOTO_COLUMNS,
        filters,
      });
      return row ? photoFromRow(row) : null;
    },

    async createDraft(id, storagePath, originalFilename) {
      const { row } = await client.insert({
        table: "photos",
        columns: PHOTO_COLUMNS,
        values: {
          id,
          storage_path: storagePath,
          original_filename: originalFilename,
          visibility: "draft",
        },
        returning: true,
      });
      return photoFromRow(row);
    },

    async updateMetadata(id, input) {
      const result = await client.update({
        table: "photos",
        columns: PHOTO_COLUMNS,
        filters: [
          { column: "id", operator: "eq", value: id },
          activeFilter,
        ],
        values: {
          visibility: input.visibility,
          sort_order: input.sortOrder,
        },
        returning: true,
      });
      if (!result) throw new Error("Updated photo not found");
      return photoFromRow(result.row);
    },

    async replaceStoragePath(id, storagePath, originalFilename) {
      const result = await client.update({
        table: "photos",
        columns: PHOTO_COLUMNS,
        filters: [
          { column: "id", operator: "eq", value: id },
          activeFilter,
        ],
        values: {
          storage_path: storagePath,
          original_filename: originalFilename,
        },
        returning: true,
      });
      if (!result) throw new Error("Replaced photo not found");
      return photoFromRow(result.row);
    },

    async moveToTrash(id) {
      await client.update({
        table: "photos",
        filters: [
          { column: "id", operator: "eq", value: id },
          activeFilter,
        ],
        values: { deleted_at: new Date().toISOString() },
      });
    },

    async restore(id) {
      await client.update({
        table: "photos",
        filters: [
          { column: "id", operator: "eq", value: id },
          { column: "deleted_at", operator: "not_is", value: null },
        ],
        values: { deleted_at: null, visibility: "draft" },
      });
    },

    async deleteRecord(id) {
      await client.delete({
        table: "photos",
        filters: [
          { column: "id", operator: "eq", value: id },
          { column: "deleted_at", operator: "not_is", value: null },
        ],
      });
    },

    async listCleanupTasks() {
      const { rows } = await client.selectMany({
        table: "storage_cleanup_tasks",
        columns: CLEANUP_TASK_COLUMNS,
        orders: [{ column: "created_at", ascending: false }],
      });
      return rows.map(cleanupTaskFromRow);
    },

    async getCleanupTask(id) {
      const { row } = await client.selectOne({
        table: "storage_cleanup_tasks",
        columns: CLEANUP_TASK_COLUMNS,
        filters: [{ column: "id", operator: "eq", value: id }],
      });
      return row ? cleanupTaskFromRow(row) : null;
    },

    async saveCleanupTask(input) {
      await client.upsert({
        table: "storage_cleanup_tasks",
        values: {
          bucket_id: input.bucketId,
          object_path: input.objectPath,
          reason: input.reason,
          last_error: input.lastError,
        },
        conflictColumn: "object_path",
      });
    },

    async deleteCleanupTask(id) {
      await client.delete({
        table: "storage_cleanup_tasks",
        filters: [{ column: "id", operator: "eq", value: id }],
      });
    },
  };
}
