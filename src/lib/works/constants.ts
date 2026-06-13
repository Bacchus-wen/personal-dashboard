export const WORK_STATUSES = [
  "developing",
  "maintained",
  "completed",
  "stopped",
] as const;

export const WORK_VISIBILITIES = [
  "draft",
  "private",
  "public",
  "archived",
] as const;

export type WorkStatus = (typeof WORK_STATUSES)[number];
export type WorkVisibility = (typeof WORK_VISIBILITIES)[number];

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  developing: "开发中",
  maintained: "维护中",
  completed: "已完成",
  stopped: "已停止",
};

export const WORK_VISIBILITY_LABELS: Record<WorkVisibility, string> = {
  draft: "草稿",
  private: "私密",
  public: "公开",
  archived: "已归档",
};
