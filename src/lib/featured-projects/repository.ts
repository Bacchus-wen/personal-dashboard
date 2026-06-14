import type {
  AdminFeaturedProjectQuery,
  PublicFeaturedProjectQuery,
} from "./queries";
import type {
  FeaturedProject,
  FeaturedProjectListResult,
  ValidFeaturedProjectInput,
} from "./types";

export const FEATURED_PROJECT_COLUMNS =
  "id,name,repository_url,summary,recommendation,language,tags,star_count,star_recorded_on,visibility,featured,sort_order,deleted_at,created_at,updated_at";

export type FeaturedProjectDatabaseRow = Record<string, unknown>;
export type FeaturedProjectDatabaseFilter = {
  column: string;
  operator: "eq" | "is" | "not_is" | "contains";
  value: unknown;
};
export type FeaturedProjectDatabaseOrder = {
  column: string;
  ascending: boolean;
};
export type FeaturedProjectDatabaseRequest = {
  table: "featured_projects";
  columns?: string;
  filters?: FeaturedProjectDatabaseFilter[];
  orders?: FeaturedProjectDatabaseOrder[];
  values?: Record<string, unknown>;
  search?: string;
  limit?: number;
  returning?: boolean;
};
export type FeaturedProjectDatabaseClient = {
  selectMany(
    request: FeaturedProjectDatabaseRequest,
  ): Promise<{ rows: FeaturedProjectDatabaseRow[] }>;
  selectOne(
    request: FeaturedProjectDatabaseRequest,
  ): Promise<{ row: FeaturedProjectDatabaseRow | null }>;
  insert(
    request: FeaturedProjectDatabaseRequest,
  ): Promise<{ row: FeaturedProjectDatabaseRow }>;
  update(
    request: FeaturedProjectDatabaseRequest,
  ): Promise<{ row: FeaturedProjectDatabaseRow } | void>;
  delete(request: FeaturedProjectDatabaseRequest): Promise<void>;
};
export type FeaturedProjectRepository = {
  listPublic(
    query: PublicFeaturedProjectQuery,
  ): Promise<FeaturedProjectListResult>;
  listFeatured(): Promise<FeaturedProject[]>;
  listAdmin(
    query: AdminFeaturedProjectQuery,
  ): Promise<FeaturedProjectListResult>;
  listTrash(): Promise<FeaturedProject[]>;
  getById(id: string): Promise<FeaturedProject | null>;
  save(
    id: string | null,
    input: ValidFeaturedProjectInput,
  ): Promise<FeaturedProject>;
  moveToTrash(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  permanentlyDelete(id: string): Promise<void>;
};

function projectFromRow(row: FeaturedProjectDatabaseRow): FeaturedProject {
  return {
    id: String(row.id),
    name: String(row.name),
    repositoryUrl:
      row.repository_url === null ? null : String(row.repository_url),
    summary: row.summary === null ? null : String(row.summary),
    recommendation:
      row.recommendation === null ? null : String(row.recommendation),
    language: row.language === null ? null : String(row.language),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    starCount: row.star_count === null ? null : Number(row.star_count),
    starRecordedOn:
      row.star_recorded_on === null ? null : String(row.star_recorded_on),
    visibility: row.visibility as FeaturedProject["visibility"],
    featured: Boolean(row.featured),
    sortOrder: Number(row.sort_order),
    deletedAt: row.deleted_at === null ? null : String(row.deleted_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function unique(values: (string | null)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function resultFromRows(rows: FeaturedProjectDatabaseRow[]) {
  const projects = rows.map(projectFromRow);
  return {
    projects,
    availableLanguages: unique(projects.map((project) => project.language)),
    availableTags: unique(projects.flatMap((project) => project.tags)),
  };
}

function payload(input: ValidFeaturedProjectInput) {
  return {
    name: input.name,
    repository_url: input.repositoryUrl,
    summary: input.summary,
    recommendation: input.recommendation,
    language: input.language,
    tags: input.tags,
    star_count: input.starCount,
    star_recorded_on: input.starRecordedOn,
    visibility: input.visibility,
    featured: input.featured,
    sort_order: input.sortOrder,
  };
}

export function createFeaturedProjectRepository(
  client: FeaturedProjectDatabaseClient,
): FeaturedProjectRepository {
  const activeFilter: FeaturedProjectDatabaseFilter = {
    column: "deleted_at",
    operator: "is",
    value: null,
  };
  const publicFilters: FeaturedProjectDatabaseFilter[] = [
    { column: "visibility", operator: "eq", value: "public" },
    activeFilter,
  ];
  const publicOrders: FeaturedProjectDatabaseOrder[] = [
    { column: "featured", ascending: false },
    { column: "sort_order", ascending: true },
    { column: "updated_at", ascending: false },
  ];

  return {
    async listPublic(query) {
      const filters = [...publicFilters];
      if (query.language) {
        filters.push({
          column: "language",
          operator: "eq",
          value: query.language,
        });
      }
      if (query.tag) {
        filters.push({
          column: "tags",
          operator: "contains",
          value: [query.tag],
        });
      }
      const { rows } = await client.selectMany({
        table: "featured_projects",
        columns: FEATURED_PROJECT_COLUMNS,
        filters,
        search: query.search ?? undefined,
        orders: publicOrders,
        limit: 100,
      });
      return resultFromRows(rows);
    },

    async listFeatured() {
      const { rows } = await client.selectMany({
        table: "featured_projects",
        columns: FEATURED_PROJECT_COLUMNS,
        filters: [
          ...publicFilters,
          { column: "featured", operator: "eq", value: true },
        ],
        orders: publicOrders,
        limit: 100,
      });
      return rows.map(projectFromRow);
    },

    async listAdmin(query) {
      const filters = [activeFilter];
      if (query.language) {
        filters.push({
          column: "language",
          operator: "eq",
          value: query.language,
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
        table: "featured_projects",
        columns: FEATURED_PROJECT_COLUMNS,
        filters,
        search: query.search ?? undefined,
        orders: [{ column: "updated_at", ascending: false }],
      });
      return resultFromRows(rows);
    },

    async listTrash() {
      const { rows } = await client.selectMany({
        table: "featured_projects",
        columns: FEATURED_PROJECT_COLUMNS,
        filters: [{ column: "deleted_at", operator: "not_is", value: null }],
        orders: [{ column: "deleted_at", ascending: false }],
      });
      return rows.map(projectFromRow);
    },

    async getById(id) {
      const { row } = await client.selectOne({
        table: "featured_projects",
        columns: FEATURED_PROJECT_COLUMNS,
        filters: [
          { column: "id", operator: "eq", value: id },
          activeFilter,
        ],
      });
      return row ? projectFromRow(row) : null;
    },

    async save(id, input) {
      if (!id) {
        const { row } = await client.insert({
          table: "featured_projects",
          values: payload(input),
          returning: true,
        });
        return projectFromRow(row);
      }
      const result = await client.update({
        table: "featured_projects",
        filters: [
          { column: "id", operator: "eq", value: id },
          activeFilter,
        ],
        values: payload(input),
        returning: true,
      });
      if (!result) throw new Error("Saved project not found");
      return projectFromRow(result.row);
    },

    async moveToTrash(id) {
      await client.update({
        table: "featured_projects",
        filters: [
          { column: "id", operator: "eq", value: id },
          activeFilter,
        ],
        values: { deleted_at: new Date().toISOString() },
      });
    },

    async restore(id) {
      await client.update({
        table: "featured_projects",
        filters: [
          { column: "id", operator: "eq", value: id },
          { column: "deleted_at", operator: "not_is", value: null },
        ],
        values: { deleted_at: null, visibility: "draft" },
      });
    },

    async permanentlyDelete(id) {
      await client.delete({
        table: "featured_projects",
        filters: [
          { column: "id", operator: "eq", value: id },
          { column: "deleted_at", operator: "not_is", value: null },
        ],
      });
    },
  };
}
