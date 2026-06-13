import type { AdminWorkQuery, PublicWorkQuery } from "./queries";
import type { ValidWorkInput, Work, WorkListResult } from "./types";

export const WORK_COLUMNS =
  "id,name,slug,summary,description,cover_path,tech_stack,status,visibility,started_on,completed_on,website_url,github_url,website_available,featured,sort_order,seo_title,seo_description,seo_image_path,deleted_at,created_at,updated_at,work_screenshots(id,image_path,caption,sort_order,created_at,updated_at)";

export type WorkDatabaseRow = Record<string, unknown>;

export type WorkDatabaseFilter = {
  column: string;
  operator: "eq" | "is" | "not_is" | "contains";
  value: unknown;
};

export type WorkDatabaseOrder = {
  column: string;
  ascending: boolean;
};

export type WorkDatabaseRequest = {
  table: "works";
  columns?: string;
  filters?: WorkDatabaseFilter[];
  orders?: WorkDatabaseOrder[];
  values?: Record<string, unknown>;
  search?: string;
};

export type WorkDatabaseClient = {
  selectMany(
    request: WorkDatabaseRequest,
  ): Promise<{ rows: WorkDatabaseRow[] }>;
  selectOne(
    request: WorkDatabaseRequest,
  ): Promise<{ row: WorkDatabaseRow | null }>;
  update(request: WorkDatabaseRequest): Promise<void>;
  delete(request: WorkDatabaseRequest): Promise<void>;
  saveWork(
    id: string | null,
    input: ValidWorkInput,
  ): Promise<{ row: WorkDatabaseRow }>;
};

export type WorkRepository = {
  listPublicWorks(query: PublicWorkQuery): Promise<WorkListResult>;
  getPublicWorkBySlug(slug: string): Promise<Work | null>;
  listAdminWorks(query: AdminWorkQuery): Promise<WorkListResult>;
  listTrashWorks(): Promise<Work[]>;
  getWorkById(id: string): Promise<Work | null>;
  saveWork(id: string | null, input: ValidWorkInput): Promise<Work>;
  moveWorkToTrash(id: string): Promise<void>;
  restoreWork(id: string): Promise<void>;
  permanentlyDeleteWork(id: string): Promise<void>;
};

export type WorkRepositoryFailure = "READ_FAILED" | "WRITE_FAILED";

export class WorkRepositoryError extends Error {
  constructor(public readonly code: WorkRepositoryFailure) {
    super(code);
    this.name = "WorkRepositoryError";
  }
}

function screenshotFromRow(row: WorkDatabaseRow) {
  return {
    id: String(row.id),
    imagePath: String(row.image_path),
    caption: row.caption === null ? null : String(row.caption),
    sortOrder: Number(row.sort_order),
  };
}

function workFromRow(row: WorkDatabaseRow): Work {
  const screenshotRows = Array.isArray(row.work_screenshots)
    ? (row.work_screenshots as WorkDatabaseRow[])
    : [];
  return {
    id: String(row.id),
    name: String(row.name),
    slug: row.slug === null ? null : String(row.slug),
    summary: row.summary === null ? null : String(row.summary),
    description: row.description === null ? null : String(row.description),
    coverPath: row.cover_path === null ? null : String(row.cover_path),
    techStack: Array.isArray(row.tech_stack)
      ? row.tech_stack.map(String)
      : [],
    status: row.status as Work["status"],
    visibility: row.visibility as Work["visibility"],
    startedOn: row.started_on === null ? null : String(row.started_on),
    completedOn: row.completed_on === null ? null : String(row.completed_on),
    websiteUrl: row.website_url === null ? null : String(row.website_url),
    githubUrl: row.github_url === null ? null : String(row.github_url),
    websiteAvailable: Boolean(row.website_available),
    featured: Boolean(row.featured),
    sortOrder: Number(row.sort_order),
    seoTitle: row.seo_title === null ? null : String(row.seo_title),
    seoDescription:
      row.seo_description === null ? null : String(row.seo_description),
    seoImagePath:
      row.seo_image_path === null ? null : String(row.seo_image_path),
    screenshots: screenshotRows
      .map(screenshotFromRow)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    deletedAt: row.deleted_at === null ? null : String(row.deleted_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function techFromWorks(works: Work[]) {
  return [...new Set(works.flatMap((work) => work.techStack))].sort((a, b) =>
    a.localeCompare(b),
  );
}

async function read<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch {
    throw new WorkRepositoryError("READ_FAILED");
  }
}

async function write<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch {
    throw new WorkRepositoryError("WRITE_FAILED");
  }
}

export function createWorkRepository(client: WorkDatabaseClient): WorkRepository {
  const activeFilter: WorkDatabaseFilter = {
    column: "deleted_at",
    operator: "is",
    value: null,
  };
  const publicFilters: WorkDatabaseFilter[] = [
    { column: "visibility", operator: "eq", value: "public" },
    activeFilter,
    { column: "slug", operator: "not_is", value: null },
  ];

  return {
    async listPublicWorks(query) {
      return read(async () => {
        const filters = [...publicFilters];
        if (query.status) {
          filters.push({ column: "status", operator: "eq", value: query.status });
        }
        if (query.tech) {
          filters.push({
            column: "tech_stack",
            operator: "contains",
            value: [query.tech],
          });
        }
        const { rows } = await client.selectMany({
          table: "works",
          columns: WORK_COLUMNS,
          filters,
          orders: [
            { column: "sort_order", ascending: true },
            { column: "updated_at", ascending: false },
          ],
        });
        const works = rows.map(workFromRow);
        return { works, availableTech: techFromWorks(works) };
      });
    },

    async getPublicWorkBySlug(slug) {
      return read(async () => {
        const { row } = await client.selectOne({
          table: "works",
          columns: WORK_COLUMNS,
          filters: [
            ...publicFilters,
            { column: "slug", operator: "eq", value: slug },
          ],
        });
        return row ? workFromRow(row) : null;
      });
    },

    async listAdminWorks(query) {
      return read(async () => {
        const filters = [activeFilter];
        if (query.status) {
          filters.push({ column: "status", operator: "eq", value: query.status });
        }
        if (query.visibility) {
          filters.push({
            column: "visibility",
            operator: "eq",
            value: query.visibility,
          });
        }
        const { rows } = await client.selectMany({
          table: "works",
          columns: WORK_COLUMNS,
          filters,
          search: query.search ?? undefined,
          orders: [{ column: "updated_at", ascending: false }],
        });
        const works = rows.map(workFromRow);
        return { works, availableTech: techFromWorks(works) };
      });
    },

    async listTrashWorks() {
      return read(async () => {
        const { rows } = await client.selectMany({
          table: "works",
          columns: WORK_COLUMNS,
          filters: [
            { column: "deleted_at", operator: "not_is", value: null },
          ],
          orders: [{ column: "deleted_at", ascending: false }],
        });
        return rows.map(workFromRow);
      });
    },

    async getWorkById(id) {
      return read(async () => {
        const { row } = await client.selectOne({
          table: "works",
          columns: WORK_COLUMNS,
          filters: [
            { column: "id", operator: "eq", value: id },
            activeFilter,
          ],
        });
        return row ? workFromRow(row) : null;
      });
    },

    async saveWork(id, input) {
      return write(async () => workFromRow((await client.saveWork(id, input)).row));
    },

    async moveWorkToTrash(id) {
      return write(() =>
        client.update({
          table: "works",
          filters: [
            { column: "id", operator: "eq", value: id },
            activeFilter,
          ],
          values: { deleted_at: new Date().toISOString() },
        }),
      );
    },

    async restoreWork(id) {
      return write(() =>
        client.update({
          table: "works",
          filters: [
            { column: "id", operator: "eq", value: id },
            { column: "deleted_at", operator: "not_is", value: null },
          ],
          values: { deleted_at: null, visibility: "draft" },
        }),
      );
    },

    async permanentlyDeleteWork(id) {
      return write(() =>
        client.delete({
          table: "works",
          filters: [
            { column: "id", operator: "eq", value: id },
            { column: "deleted_at", operator: "not_is", value: null },
          ],
        }),
      );
    },
  };
}
