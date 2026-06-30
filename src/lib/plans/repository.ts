import type { AdminPlanQuery, PublicPlanQuery } from "./queries";
import type {
  PaginatedPlans,
  Plan,
  PlanCategory,
  ValidPlanInput,
} from "./types";

const PLAN_COLUMNS =
  "id,title,summary,description,status,visibility,priority,progress,deadline,related_url,category_id,deleted_at,created_at,updated_at,plan_categories(id,name,created_at,updated_at)";
const CATEGORY_COLUMNS = "id,name,created_at,updated_at";
// Public list shows every status; the public boundary is visibility + deleted_at
// (enforced below), not the plan status. HOME_STATUSES still limits the single
// homepage recommendation to active plans.
const PUBLIC_STATUSES = ["not_started", "in_progress", "paused", "completed", "cancelled"];
const HOME_STATUSES = ["not_started", "in_progress"];

export type DatabaseRow = Record<string, unknown>;

export type DatabaseFilter = {
  column: string;
  operator: "eq" | "is" | "not_is" | "in" | "lt" | "ilike";
  value: unknown;
};

export type DatabaseOrder = {
  column: string;
  ascending: boolean;
};

export type DatabaseRelation = {
  table: string;
  filters: DatabaseFilter[];
};

export type DatabaseRequest = {
  table: "plans" | "plan_categories";
  columns?: string;
  filters?: DatabaseFilter[];
  relation?: DatabaseRelation;
  orders?: DatabaseOrder[];
  range?: { from: number; to: number };
  values?: Record<string, unknown>;
  search?: string;
};

export type PlansDatabaseClient = {
  selectMany(
    request: DatabaseRequest,
  ): Promise<{ rows: DatabaseRow[]; count: number }>;
  selectOne(request: DatabaseRequest): Promise<{ row: DatabaseRow | null }>;
  insert(request: DatabaseRequest): Promise<{ row: DatabaseRow }>;
  update(request: DatabaseRequest): Promise<{ row: DatabaseRow }>;
  delete(request: DatabaseRequest): Promise<void>;
};

export type PlanRepository = {
  listPublicPlans(query: PublicPlanQuery): Promise<PaginatedPlans>;
  listPublicCategories(): Promise<PlanCategory[]>;
  getHomePlanCandidates(): Promise<Plan[]>;
  listAdminPlans(query: AdminPlanQuery): Promise<PaginatedPlans>;
  listTrashPlans(page: number): Promise<PaginatedPlans>;
  getPlanById(id: string): Promise<Plan | null>;
  listCategories(): Promise<PlanCategory[]>;
  countPlansForCategory(id: string): Promise<number>;
  createPlan(input: ValidPlanInput): Promise<Plan>;
  updatePlan(id: string, input: ValidPlanInput): Promise<Plan>;
  movePlanToTrash(id: string): Promise<void>;
  restorePlan(id: string): Promise<void>;
  permanentlyDeletePlan(id: string): Promise<void>;
  createCategory(name: string): Promise<PlanCategory>;
  renameCategory(id: string, name: string): Promise<PlanCategory>;
  deleteCategory(id: string): Promise<void>;
};

export type PlanRepositoryFailure =
  | "READ_FAILED"
  | "WRITE_FAILED"
  | "NOT_FOUND";

export class PlanRepositoryError extends Error {
  constructor(public readonly code: PlanRepositoryFailure) {
    super(code);
    this.name = "PlanRepositoryError";
  }
}

function categoryFromRow(value: unknown): PlanCategory | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") {
    return null;
  }

  const category = row as DatabaseRow;
  return {
    id: String(category.id),
    name: String(category.name),
    createdAt: String(category.created_at),
    updatedAt: String(category.updated_at),
  };
}

function planFromRow(row: DatabaseRow): Plan {
  return {
    id: String(row.id),
    title: row.title === null ? null : String(row.title),
    summary: row.summary === null ? null : String(row.summary),
    description: row.description === null ? null : String(row.description),
    status: row.status as Plan["status"],
    visibility: row.visibility as Plan["visibility"],
    priority: row.priority as Plan["priority"],
    progress: Number(row.progress),
    deadline: row.deadline === null ? null : String(row.deadline),
    relatedUrl: row.related_url === null ? null : String(row.related_url),
    categoryId: row.category_id === null ? null : String(row.category_id),
    category: categoryFromRow(row.plan_categories),
    deletedAt: row.deleted_at === null ? null : String(row.deleted_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function inputToRow(input: ValidPlanInput) {
  return {
    title: input.title,
    summary: input.summary,
    description: input.description,
    status: input.status,
    visibility: input.visibility,
    priority: input.priority,
    progress: input.progress,
    deadline: input.deadline,
    related_url: input.relatedUrl,
    category_id: input.categoryId,
  };
}

function pageRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

async function read<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch {
    throw new PlanRepositoryError("READ_FAILED");
  }
}

async function write<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch {
    throw new PlanRepositoryError("WRITE_FAILED");
  }
}

export function createPlanRepository(
  client: PlansDatabaseClient,
): PlanRepository {
  return {
    async listPublicPlans(query) {
      return read(async () => {
        const filters: DatabaseFilter[] = [
          { column: "visibility", operator: "eq", value: "public" },
          { column: "deleted_at", operator: "is", value: null },
          { column: "status", operator: "in", value: PUBLIC_STATUSES },
        ];
        if (query.status) {
          filters.push({ column: "status", operator: "eq", value: query.status });
        }
        if (query.priority) {
          filters.push({
            column: "priority",
            operator: "eq",
            value: query.priority,
          });
        }
        if (query.categoryId) {
          filters.push({
            column: "category_id",
            operator: "eq",
            value: query.categoryId,
          });
        }

        const result = await client.selectMany({
          table: "plans",
          columns: PLAN_COLUMNS,
          filters,
          orders: [
            { column: "priority", ascending: true },
            { column: "deadline", ascending: true },
            { column: "updated_at", ascending: false },
          ],
          range: pageRange(query.page, query.pageSize),
        });

        return {
          plans: result.rows.map(planFromRow),
          total: result.count,
          page: query.page,
          pageSize: query.pageSize,
        };
      });
    },

    async listPublicCategories() {
      return read(async () => {
        const result = await client.selectMany({
          table: "plan_categories",
          columns: CATEGORY_COLUMNS,
          relation: {
            table: "plans",
            filters: [
              { column: "visibility", operator: "eq", value: "public" },
              { column: "deleted_at", operator: "is", value: null },
              { column: "status", operator: "in", value: PUBLIC_STATUSES },
            ],
          },
          orders: [{ column: "name", ascending: true }],
        });
        return result.rows.map((row) => categoryFromRow(row)!);
      });
    },

    async getHomePlanCandidates() {
      return read(async () => {
        const result = await client.selectMany({
          table: "plans",
          columns: PLAN_COLUMNS,
          filters: [
            { column: "visibility", operator: "eq", value: "public" },
            { column: "deleted_at", operator: "is", value: null },
            { column: "status", operator: "in", value: HOME_STATUSES },
            { column: "deadline", operator: "not_is", value: null },
          ],
          orders: [{ column: "deadline", ascending: true }],
        });
        return result.rows.map(planFromRow);
      });
    },

    async listAdminPlans(query) {
      return read(async () => {
        const filters: DatabaseFilter[] = [
          { column: "deleted_at", operator: "is", value: null },
        ];
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
        if (query.priority) {
          filters.push({
            column: "priority",
            operator: "eq",
            value: query.priority,
          });
        }
        if (query.overdue === true) {
          filters.push({
            column: "deadline",
            operator: "lt",
            value: new Date().toISOString().slice(0, 10),
          });
        }

        const result = await client.selectMany({
          table: "plans",
          columns: PLAN_COLUMNS,
          filters,
          search: query.search ?? undefined,
          orders: [{ column: "updated_at", ascending: false }],
          range: pageRange(query.page, query.pageSize),
        });
        return {
          plans: result.rows.map(planFromRow),
          total: result.count,
          page: query.page,
          pageSize: query.pageSize,
        };
      });
    },

    async listTrashPlans(page) {
      return read(async () => {
        const pageSize = 12;
        const result = await client.selectMany({
          table: "plans",
          columns: PLAN_COLUMNS,
          filters: [{ column: "deleted_at", operator: "not_is", value: null }],
          orders: [{ column: "deleted_at", ascending: false }],
          range: pageRange(page, pageSize),
        });
        return {
          plans: result.rows.map(planFromRow),
          total: result.count,
          page,
          pageSize,
        };
      });
    },

    async getPlanById(id) {
      return read(async () => {
        const result = await client.selectOne({
          table: "plans",
          columns: PLAN_COLUMNS,
          filters: [
            { column: "id", operator: "eq", value: id },
            { column: "deleted_at", operator: "is", value: null },
          ],
        });
        return result.row ? planFromRow(result.row) : null;
      });
    },

    async listCategories() {
      return read(async () => {
        const result = await client.selectMany({
          table: "plan_categories",
          columns: CATEGORY_COLUMNS,
          orders: [{ column: "name", ascending: true }],
        });
        return result.rows.map((row) => categoryFromRow(row)!);
      });
    },

    async countPlansForCategory(id) {
      return read(async () => {
        const result = await client.selectMany({
          table: "plans",
          columns: "id",
          filters: [{ column: "category_id", operator: "eq", value: id }],
        });
        return result.count;
      });
    },

    async createPlan(input) {
      return write(async () =>
        planFromRow(
          (
            await client.insert({
              table: "plans",
              columns: PLAN_COLUMNS,
              values: inputToRow(input),
            })
          ).row,
        ),
      );
    },

    async updatePlan(id, input) {
      return write(async () =>
        planFromRow(
          (
            await client.update({
              table: "plans",
              columns: PLAN_COLUMNS,
              filters: [
                { column: "id", operator: "eq", value: id },
                { column: "deleted_at", operator: "is", value: null },
              ],
              values: inputToRow(input),
            })
          ).row,
        ),
      );
    },

    async movePlanToTrash(id) {
      return write(async () => {
        await client.update({
          table: "plans",
          filters: [
            { column: "id", operator: "eq", value: id },
            { column: "deleted_at", operator: "is", value: null },
          ],
          values: { deleted_at: new Date().toISOString() },
        });
      });
    },

    async restorePlan(id) {
      return write(async () => {
        await client.update({
          table: "plans",
          filters: [
            { column: "id", operator: "eq", value: id },
            { column: "deleted_at", operator: "not_is", value: null },
          ],
          values: { deleted_at: null, visibility: "draft" },
        });
      });
    },

    async permanentlyDeletePlan(id) {
      return write(async () => {
        await client.delete({
          table: "plans",
          filters: [
            { column: "id", operator: "eq", value: id },
            { column: "deleted_at", operator: "not_is", value: null },
          ],
        });
      });
    },

    async createCategory(name) {
      return write(async () =>
        categoryFromRow(
          (
            await client.insert({
              table: "plan_categories",
              columns: CATEGORY_COLUMNS,
              values: { name: name.trim() },
            })
          ).row,
        )!,
      );
    },

    async renameCategory(id, name) {
      return write(async () =>
        categoryFromRow(
          (
            await client.update({
              table: "plan_categories",
              columns: CATEGORY_COLUMNS,
              filters: [{ column: "id", operator: "eq", value: id }],
              values: { name: name.trim() },
            })
          ).row,
        )!,
      );
    },

    async deleteCategory(id) {
      return write(async () => {
        await client.delete({
          table: "plan_categories",
          filters: [{ column: "id", operator: "eq", value: id }],
        });
      });
    },
  };
}
