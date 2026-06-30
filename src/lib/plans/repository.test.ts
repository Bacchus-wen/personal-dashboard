import { describe, expect, it } from "vitest";

import {
  PlanRepositoryError,
  createPlanRepository,
  type DatabaseRequest,
  type PlansDatabaseClient,
} from "./repository";
import type { ValidPlanInput } from "./types";

const planRow = {
  id: "plan-id",
  title: "公开规划",
  summary: "摘要",
  description: null,
  status: "in_progress",
  visibility: "public",
  priority: "high",
  progress: 30,
  deadline: "2026-06-30",
  related_url: null,
  category_id: null,
  deleted_at: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-02T00:00:00.000Z",
  plan_categories: null,
};

function createClient(overrides: Partial<PlansDatabaseClient> = {}) {
  const requests: DatabaseRequest[] = [];
  const client: PlansDatabaseClient = {
    async selectMany(request) {
      requests.push(request);
      return { rows: [planRow], count: 1 };
    },
    async selectOne(request) {
      requests.push(request);
      return { row: planRow };
    },
    async insert(request) {
      requests.push(request);
      return { row: planRow };
    },
    async update(request) {
      requests.push(request);
      return { row: planRow };
    },
    async delete(request) {
      requests.push(request);
    },
    ...overrides,
  };

  return { client, requests };
}

function validInput(): ValidPlanInput {
  return {
    title: "公开规划",
    summary: "摘要",
    description: null,
    status: "in_progress",
    visibility: "public",
    priority: "high",
    progress: 30,
    deadline: "2026-06-30",
    relatedUrl: null,
    categoryId: null,
  };
}

describe("createPlanRepository", () => {
  it("always applies public visibility, active status, and not-deleted filters", async () => {
    const { client, requests } = createClient();
    const repository = createPlanRepository(client);

    await repository.listPublicPlans({
      page: 1,
      pageSize: 9,
      status: null,
      priority: null,
      categoryId: null,
    });

    expect(requests[0]).toMatchObject({
      table: "plans",
      filters: [
        { column: "visibility", operator: "eq", value: "public" },
        { column: "deleted_at", operator: "is", value: null },
        {
          column: "status",
          operator: "in",
          value: ["not_started", "in_progress", "paused", "completed", "cancelled"],
        },
      ],
    });
  });

  it("limits home candidates to public active dated plans", async () => {
    const { client, requests } = createClient();
    const repository = createPlanRepository(client);

    await repository.getHomePlanCandidates();

    expect(requests[0]).toMatchObject({
      table: "plans",
      filters: [
        { column: "visibility", operator: "eq", value: "public" },
        { column: "deleted_at", operator: "is", value: null },
        {
          column: "status",
          operator: "in",
          value: ["not_started", "in_progress"],
        },
        { column: "deadline", operator: "not_is", value: null },
      ],
    });
  });

  it("lists only categories used by public valid plans", async () => {
    const { client, requests } = createClient({
      async selectMany(request) {
        requests.push(request);
        return { rows: [], count: 0 };
      },
    });
    const repository = createPlanRepository(client);

    await repository.listPublicCategories();

    expect(requests[0]).toMatchObject({
      table: "plan_categories",
      relation: {
        table: "plans",
        filters: [
          { column: "visibility", operator: "eq", value: "public" },
          { column: "deleted_at", operator: "is", value: null },
          {
            column: "status",
            operator: "in",
            value: ["not_started", "in_progress", "paused", "completed", "cancelled"],
          },
        ],
      },
    });
  });

  it("uses deleted filters to separate active admin and trash listings", async () => {
    const { client, requests } = createClient();
    const repository = createPlanRepository(client);

    await repository.listAdminPlans({
      page: 1,
      pageSize: 12,
      search: null,
      status: null,
      visibility: null,
      priority: null,
      overdue: null,
    });
    await repository.listTrashPlans(1);

    expect(requests[0].filters).toContainEqual({
      column: "deleted_at",
      operator: "is",
      value: null,
    });
    expect(requests[1].filters).toContainEqual({
      column: "deleted_at",
      operator: "not_is",
      value: null,
    });
  });

  it("maps write inputs to database column names", async () => {
    const { client, requests } = createClient();
    const repository = createPlanRepository(client);

    await repository.createPlan(validInput());

    expect(requests[0]).toMatchObject({
      table: "plans",
      values: {
        related_url: null,
        category_id: null,
      },
    });
    expect(requests[0]).not.toHaveProperty("values.relatedUrl");
  });

  it("constrains plan mutations to the expected trash state", async () => {
    const { client, requests } = createClient();
    const repository = createPlanRepository(client);

    await repository.updatePlan("plan-id", validInput());
    await repository.movePlanToTrash("plan-id");
    await repository.restorePlan("plan-id");

    expect(requests[0].filters).toContainEqual({
      column: "deleted_at",
      operator: "is",
      value: null,
    });
    expect(requests[1].filters).toContainEqual({
      column: "deleted_at",
      operator: "is",
      value: null,
    });
    expect(requests[2].filters).toContainEqual({
      column: "deleted_at",
      operator: "not_is",
      value: null,
    });
  });

  it("wraps database failures without exposing their details", async () => {
    const { client } = createClient({
      async selectMany() {
        throw new Error("secret database detail");
      },
    });
    const repository = createPlanRepository(client);

    await expect(
      repository.listPublicPlans({
        page: 1,
        pageSize: 9,
        status: null,
        priority: null,
        categoryId: null,
      }),
    ).rejects.toEqual(new PlanRepositoryError("READ_FAILED"));
  });
});
