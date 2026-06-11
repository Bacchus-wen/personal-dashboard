import { describe, expect, it } from "vitest";

import {
  ADMIN_PLAN_PAGE_SIZE,
  PUBLIC_PLAN_PAGE_SIZE,
  chooseHomePlan,
  comparePublicPlans,
  parseAdminPlanQuery,
  parsePublicPlanQuery,
} from "./queries";
import type { Plan } from "./types";

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "plan",
    title: "规划",
    summary: "摘要",
    description: null,
    status: "in_progress",
    visibility: "public",
    priority: "medium",
    progress: 50,
    deadline: "2026-06-30",
    relatedUrl: null,
    categoryId: null,
    category: null,
    deletedAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("parsePublicPlanQuery", () => {
  it("normalizes invalid pages and keeps only allowed filters", () => {
    expect(
      parsePublicPlanQuery({
        page: "-2",
        status: "completed",
        priority: "urgent",
        category: ["category-id", "ignored"],
        unexpected: "value",
      }),
    ).toEqual({
      page: 1,
      pageSize: PUBLIC_PLAN_PAGE_SIZE,
      status: null,
      priority: null,
      categoryId: "category-id",
    });
  });

  it("accepts public statuses and priorities", () => {
    expect(
      parsePublicPlanQuery({
        page: "3",
        status: "paused",
        priority: "high",
      }),
    ).toEqual({
      page: 3,
      pageSize: PUBLIC_PLAN_PAGE_SIZE,
      status: "paused",
      priority: "high",
      categoryId: null,
    });
  });
});

describe("parseAdminPlanQuery", () => {
  it("normalizes administrator filters and search text", () => {
    expect(
      parseAdminPlanQuery({
        page: "0",
        q: "  首页改版  ",
        status: "completed",
        visibility: "private",
        priority: "low",
        overdue: "true",
      }),
    ).toEqual({
      page: 1,
      pageSize: ADMIN_PLAN_PAGE_SIZE,
      search: "首页改版",
      status: "completed",
      visibility: "private",
      priority: "low",
      overdue: true,
    });
  });

  it("drops unsupported administrator filters", () => {
    expect(
      parseAdminPlanQuery({
        q: " ",
        status: "unknown",
        visibility: "unknown",
        priority: "unknown",
        overdue: "maybe",
      }),
    ).toEqual({
      page: 1,
      pageSize: ADMIN_PLAN_PAGE_SIZE,
      search: null,
      status: null,
      visibility: null,
      priority: null,
      overdue: null,
    });
  });
});

describe("comparePublicPlans", () => {
  it("sorts high before medium before low", () => {
    const plans = [
      plan({ id: "low", priority: "low" }),
      plan({ id: "high", priority: "high" }),
      plan({ id: "medium", priority: "medium" }),
    ];

    expect(plans.sort(comparePublicPlans).map(({ id }) => id)).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });

  it("places dated plans before undated plans at equal priority", () => {
    const plans = [
      plan({ id: "undated", deadline: null }),
      plan({ id: "later", deadline: "2026-07-01" }),
      plan({ id: "nearer", deadline: "2026-06-20" }),
    ];

    expect(plans.sort(comparePublicPlans).map(({ id }) => id)).toEqual([
      "nearer",
      "later",
      "undated",
    ]);
  });

  it("uses newest update time when priority and deadline match", () => {
    const plans = [
      plan({ id: "older", updatedAt: "2026-06-01T00:00:00.000Z" }),
      plan({ id: "newer", updatedAt: "2026-06-02T00:00:00.000Z" }),
    ];

    expect(plans.sort(comparePublicPlans).map(({ id }) => id)).toEqual([
      "newer",
      "older",
    ]);
  });
});

describe("chooseHomePlan", () => {
  it("chooses the most recently overdue plan before future plans", () => {
    const result = chooseHomePlan(
      [
        plan({ id: "old-overdue", deadline: "2026-06-01" }),
        plan({ id: "recent-overdue", deadline: "2026-06-10" }),
        plan({ id: "future", deadline: "2026-06-12" }),
      ],
      "2026-06-11",
    );

    expect(result?.id).toBe("recent-overdue");
  });

  it("chooses the nearest future deadline when none are overdue", () => {
    const result = chooseHomePlan(
      [
        plan({ id: "later", deadline: "2026-06-20" }),
        plan({ id: "nearer", deadline: "2026-06-12" }),
      ],
      "2026-06-11",
    );

    expect(result?.id).toBe("nearer");
  });

  it("ignores paused, completed, private, deleted, and undated plans", () => {
    const result = chooseHomePlan(
      [
        plan({ id: "paused", status: "paused" }),
        plan({ id: "completed", status: "completed" }),
        plan({ id: "private", visibility: "private" }),
        plan({ id: "deleted", deletedAt: "2026-06-10T00:00:00.000Z" }),
        plan({ id: "undated", deadline: null }),
      ],
      "2026-06-11",
    );

    expect(result).toBeNull();
  });
});
