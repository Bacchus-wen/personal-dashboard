import {
  PLAN_PRIORITIES,
  PLAN_STATUSES,
  PLAN_VISIBILITIES,
  type PlanPriority,
  type PlanStatus,
  type PlanVisibility,
} from "./constants";
import type {
  PlanFieldErrors,
  PlanInput,
  PlanValidationResult,
} from "./types";

function optionalText(value: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function isMember<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.includes(value);
}

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function validateRelatedUrl(value: string | null) {
  const normalized = optionalText(value);
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("/")) {
    if (
      normalized.startsWith("//") ||
      normalized.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(normalized)
    ) {
      return null;
    }

    return normalized;
  }

  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeProgress(status: PlanStatus, progress: number | string) {
  if (status === "not_started") {
    return 0;
  }

  if (status === "completed") {
    return 100;
  }

  const parsed =
    typeof progress === "number" ? progress : Number.parseInt(progress, 10);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export function validatePlanInput(input: PlanInput): PlanValidationResult {
  const errors: PlanFieldErrors = {};
  const title = optionalText(input.title);
  const summary = optionalText(input.summary);
  const description = optionalText(input.description);
  const categoryId = optionalText(input.categoryId);
  const deadline = optionalText(input.deadline);
  const status = isMember(PLAN_STATUSES, input.status)
    ? input.status
    : null;
  const visibility = isMember(PLAN_VISIBILITIES, input.visibility)
    ? input.visibility
    : null;
  const priority = isMember(PLAN_PRIORITIES, input.priority)
    ? input.priority
    : null;

  if (!status) {
    errors.status = ["请选择有效状态。"];
  }
  if (!visibility) {
    errors.visibility = ["请选择有效可见性。"];
  }
  if (!priority) {
    errors.priority = ["请选择有效优先级。"];
  }

  const progress = status
    ? normalizeProgress(status, input.progress)
    : Number.NaN;
  if (
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100 ||
    (status === "in_progress" && (progress < 1 || progress > 99))
  ) {
    errors.progress = [
      status === "in_progress"
        ? "进行中的规划进度必须为 1% 至 99%。"
        : "进度必须为 0% 至 100% 的整数。",
    ];
  }

  if (visibility && visibility !== "draft") {
    if (!title) {
      errors.title = ["私密或公开规划必须填写标题。"];
    }
    if (!summary) {
      errors.summary = ["私密或公开规划必须填写简短描述。"];
    }
  }

  if (deadline && !isCalendarDate(deadline)) {
    errors.deadline = ["请输入有效截止日期。"];
  }

  const relatedUrl = validateRelatedUrl(input.relatedUrl);
  if (optionalText(input.relatedUrl) && !relatedUrl) {
    errors.relatedUrl = ["请输入安全的站内路径或 HTTP(S) 地址。"];
  }

  if (Object.keys(errors).length || !status || !visibility || !priority) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    data: {
      title,
      summary,
      description,
      status: status as PlanStatus,
      visibility: visibility as PlanVisibility,
      priority: priority as PlanPriority,
      progress,
      deadline,
      relatedUrl,
      categoryId,
    },
  };
}
