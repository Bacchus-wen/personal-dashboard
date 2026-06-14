import type { AdminCollectionQuery, PublicCollectionQuery } from "./queries";
import type {
  Collection,
  CollectionListResult,
  ValidCollectionInput,
} from "./types";

export const COLLECTION_COLUMNS =
  "id,title,content_type,source_name,summary,external_url,cover_path,tags,visibility,featured,sort_order,deleted_at,created_at,updated_at";

export type CollectionDatabaseRow = Record<string, unknown>;

export type CollectionDatabaseFilter = {
  column: string;
  operator: "eq" | "is" | "not_is" | "contains";
  value: unknown;
};

export type CollectionDatabaseOrder = {
  column: string;
  ascending: boolean;
};

export type CollectionDatabaseRequest = {
  table: "collections";
  columns?: string;
  filters?: CollectionDatabaseFilter[];
  orders?: CollectionDatabaseOrder[];
  values?: Record<string, unknown>;
  search?: string;
  limit?: number;
  returning?: boolean;
};

export type CollectionDatabaseClient = {
  selectMany(
    request: CollectionDatabaseRequest,
  ): Promise<{ rows: CollectionDatabaseRow[] }>;
  selectOne(
    request: CollectionDatabaseRequest,
  ): Promise<{ row: CollectionDatabaseRow | null }>;
  insert(
    request: CollectionDatabaseRequest,
  ): Promise<{ row: CollectionDatabaseRow }>;
  update(
    request: CollectionDatabaseRequest,
  ): Promise<{ row: CollectionDatabaseRow } | void>;
  delete(request: CollectionDatabaseRequest): Promise<void>;
};

export type CollectionRepository = {
  listPublic(query: PublicCollectionQuery): Promise<CollectionListResult>;
  listFeatured(): Promise<Collection[]>;
  listAdmin(query: AdminCollectionQuery): Promise<CollectionListResult>;
  listTrash(): Promise<Collection[]>;
  getById(id: string): Promise<Collection | null>;
  save(id: string | null, input: ValidCollectionInput): Promise<Collection>;
  moveToTrash(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  permanentlyDelete(id: string): Promise<void>;
};

function collectionFromRow(row: CollectionDatabaseRow): Collection {
  return {
    id: String(row.id),
    title: String(row.title),
    contentType: row.content_type as Collection["contentType"],
    sourceName: row.source_name === null ? null : String(row.source_name),
    summary: row.summary === null ? null : String(row.summary),
    externalUrl: row.external_url === null ? null : String(row.external_url),
    coverPath: row.cover_path === null ? null : String(row.cover_path),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    visibility: row.visibility as Collection["visibility"],
    featured: Boolean(row.featured),
    sortOrder: Number(row.sort_order),
    deletedAt: row.deleted_at === null ? null : String(row.deleted_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function tagsFromCollections(collections: Collection[]) {
  return [...new Set(collections.flatMap((collection) => collection.tags))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function payload(input: ValidCollectionInput) {
  return {
    title: input.title,
    content_type: input.contentType,
    source_name: input.sourceName,
    summary: input.summary,
    external_url: input.externalUrl,
    cover_path: input.coverPath,
    tags: input.tags,
    visibility: input.visibility,
    featured: input.featured,
    sort_order: input.sortOrder,
  };
}

export function createCollectionRepository(
  client: CollectionDatabaseClient,
): CollectionRepository {
  const activeFilter: CollectionDatabaseFilter = {
    column: "deleted_at",
    operator: "is",
    value: null,
  };
  const publicFilters: CollectionDatabaseFilter[] = [
    { column: "visibility", operator: "eq", value: "public" },
    activeFilter,
  ];
  const publicOrders: CollectionDatabaseOrder[] = [
    { column: "featured", ascending: false },
    { column: "sort_order", ascending: true },
    { column: "updated_at", ascending: false },
  ];

  return {
    async listPublic(query) {
      const filters = [
        ...publicFilters,
        { column: "content_type", operator: "eq", value: query.type },
      ] satisfies CollectionDatabaseFilter[];
      if (query.tag) {
        filters.push({
          column: "tags",
          operator: "contains",
          value: [query.tag],
        });
      }
      const { rows } = await client.selectMany({
        table: "collections",
        columns: COLLECTION_COLUMNS,
        filters,
        search: query.search ?? undefined,
        orders: publicOrders,
        limit: 100,
      });
      const collections = rows.map(collectionFromRow);
      return { collections, availableTags: tagsFromCollections(collections) };
    },

    async listFeatured() {
      const { rows } = await client.selectMany({
        table: "collections",
        columns: COLLECTION_COLUMNS,
        filters: [
          ...publicFilters,
          { column: "featured", operator: "eq", value: true },
        ],
        orders: publicOrders,
        limit: 100,
      });
      return rows.map(collectionFromRow);
    },

    async listAdmin(query) {
      const filters = [activeFilter];
      if (query.type) {
        filters.push({
          column: "content_type",
          operator: "eq",
          value: query.type,
        });
      }
      if (query.visibility) {
        filters.push({
          column: "visibility",
          operator: "eq",
          value: query.visibility,
        });
      }
      const { rows } = await client.selectMany({
        table: "collections",
        columns: COLLECTION_COLUMNS,
        filters,
        search: query.search ?? undefined,
        orders: [{ column: "updated_at", ascending: false }],
      });
      const collections = rows.map(collectionFromRow);
      return { collections, availableTags: tagsFromCollections(collections) };
    },

    async listTrash() {
      const { rows } = await client.selectMany({
        table: "collections",
        columns: COLLECTION_COLUMNS,
        filters: [{ column: "deleted_at", operator: "not_is", value: null }],
        orders: [{ column: "deleted_at", ascending: false }],
      });
      return rows.map(collectionFromRow);
    },

    async getById(id) {
      const { row } = await client.selectOne({
        table: "collections",
        columns: COLLECTION_COLUMNS,
        filters: [
          { column: "id", operator: "eq", value: id },
          activeFilter,
        ],
      });
      return row ? collectionFromRow(row) : null;
    },

    async save(id, input) {
      if (!id) {
        const { row } = await client.insert({
          table: "collections",
          values: payload(input),
          returning: true,
        });
        return collectionFromRow(row);
      }
      const result = await client.update({
        table: "collections",
        filters: [
          { column: "id", operator: "eq", value: id },
          activeFilter,
        ],
        values: payload(input),
        returning: true,
      });
      if (!result) throw new Error("Saved collection not found");
      return collectionFromRow(result.row);
    },

    async moveToTrash(id) {
      await client.update({
        table: "collections",
        filters: [
          { column: "id", operator: "eq", value: id },
          activeFilter,
        ],
        values: { deleted_at: new Date().toISOString() },
      });
    },

    async restore(id) {
      await client.update({
        table: "collections",
        filters: [
          { column: "id", operator: "eq", value: id },
          { column: "deleted_at", operator: "not_is", value: null },
        ],
        values: { deleted_at: null, visibility: "draft" },
      });
    },

    async permanentlyDelete(id) {
      await client.delete({
        table: "collections",
        filters: [
          { column: "id", operator: "eq", value: id },
          { column: "deleted_at", operator: "not_is", value: null },
        ],
      });
    },
  };
}
