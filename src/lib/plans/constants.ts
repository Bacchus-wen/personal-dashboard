export const PLAN_STATUSES = [
  "not_started",
  "in_progress",
  "paused",
  "completed",
  "cancelled",
] as const;

export const PLAN_VISIBILITIES = ["draft", "private", "public"] as const;

export const PLAN_PRIORITIES = ["high", "medium", "low"] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];
export type PlanVisibility = (typeof PLAN_VISIBILITIES)[number];
export type PlanPriority = (typeof PLAN_PRIORITIES)[number];
