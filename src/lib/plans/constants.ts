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

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  paused: "已暂停",
  completed: "已完成",
  cancelled: "已取消",
};

export const PLAN_VISIBILITY_LABELS: Record<PlanVisibility, string> = {
  draft: "草稿",
  private: "私密",
  public: "公开",
};

export const PLAN_PRIORITY_LABELS: Record<PlanPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};
