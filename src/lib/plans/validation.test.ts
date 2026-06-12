import { describe, expect, it } from "vitest";

import { validatePlanInput, validateRelatedUrl } from "./validation";
import type { PlanInput } from "./types";

function validInput(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    title: "完成近日规划功能",
    summary: "实现可公开展示的个人规划模块。",
    description: "## 目标\n\n完成后台与公开页面。",
    status: "in_progress",
    visibility: "private",
    priority: "medium",
    progress: 50,
    deadline: "2026-06-30",
    relatedUrl: "/projects",
    categoryId: null,
    ...overrides,
  };
}

describe("validatePlanInput", () => {
  it("forces not-started progress to zero", () => {
    const result = validatePlanInput(
      validInput({ status: "not_started", progress: 72 }),
    );

    expect(result.data?.progress).toBe(0);
  });

  it("forces completed progress to one hundred", () => {
    const result = validatePlanInput(
      validInput({ status: "completed", progress: 72 }),
    );

    expect(result.data?.progress).toBe(100);
  });

  it("rejects in-progress values outside one through ninety-nine", () => {
    const result = validatePlanInput(
      validInput({ status: "in_progress", progress: 100 }),
    );

    expect(result.errors.progress).toBeDefined();
  });

  it("allows incomplete drafts but rejects incomplete private and public plans", () => {
    const draft = validatePlanInput(
      validInput({ visibility: "draft", title: "", summary: "" }),
    );
    const privatePlan = validatePlanInput(
      validInput({ visibility: "private", title: "", summary: "" }),
    );
    const publicPlan = validatePlanInput(
      validInput({ visibility: "public", title: "", summary: "" }),
    );

    expect(draft.ok).toBe(true);
    expect(privatePlan.ok).toBe(false);
    expect(publicPlan.ok).toBe(false);
  });

  it("normalizes blank optional fields to null", () => {
    const result = validatePlanInput(
      validInput({
        description: "  ",
        deadline: "",
        relatedUrl: "",
        categoryId: "",
      }),
    );

    expect(result.data).toMatchObject({
      description: null,
      deadline: null,
      relatedUrl: null,
      categoryId: null,
    });
  });

  it("rejects malformed deadlines", () => {
    const result = validatePlanInput(validInput({ deadline: "2026-02-31" }));

    expect(result.errors.deadline).toBeDefined();
  });
});

describe("validateRelatedUrl", () => {
  it("accepts safe internal and HTTP links", () => {
    expect(validateRelatedUrl("/works/site")).toBe("/works/site");
    expect(validateRelatedUrl("https://example.com")).toBe(
      "https://example.com/",
    );
    expect(validateRelatedUrl("http://example.com/path")).toBe(
      "http://example.com/path",
    );
  });

  it("rejects executable, protocol-relative, and malformed internal links", () => {
    expect(validateRelatedUrl("javascript:alert(1)")).toBeNull();
    expect(validateRelatedUrl("//example.com/path")).toBeNull();
    expect(validateRelatedUrl("/works\\unsafe")).toBeNull();
    expect(validateRelatedUrl("/works\nunsafe")).toBeNull();
  });
});
