import {
  PLAN_PRIORITIES,
  PLAN_STATUSES,
  PLAN_VISIBILITIES,
  type PlanPriority,
  type PlanStatus,
  type PlanVisibility,
} from "./constants";
import type { Plan } from "./types";

export const PUBLIC_PLAN_PAGE_SIZE = 9;
export const ADMIN_PLAN_PAGE_SIZE = 12;

// Public plans now surface every status (matches the admin status set), so
// visitors see in-progress, paused, completed, and cancelled plans alike. The
// public security boundary is visibility='public' + deleted_at IS NULL, not the
// status.
const PUBLIC_STATUSES = PLAN_STATUSES;
const PRIORITY_RANK: Record<PlanPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

type SearchParams = Record<string, string | string[] | undefined>;

export type PublicPlanQuery = {
  page: number;
  pageSize: typeof PUBLIC_PLAN_PAGE_SIZE;
  status: (typeof PUBLIC_STATUSES)[number] | null;
  priority: PlanPriority | null;
  categoryId: string | null;
};

export type AdminPlanQuery = {
  page: number;
  pageSize: typeof ADMIN_PLAN_PAGE_SIZE;
  search: string | null;
  status: PlanStatus | null;
  visibility: PlanVisibility | null;
  priority: PlanPriority | null;
  overdue: boolean | null;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | string[] | undefined) {
  const page = Number.parseInt(firstValue(value) ?? "", 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseMember<T extends readonly string[]>(
  values: T,
  value: string | string[] | undefined,
): T[number] | null {
  const candidate = firstValue(value);
  return candidate && values.includes(candidate) ? candidate : null;
}

function parseText(value: string | string[] | undefined) {
  const normalized = firstValue(value)?.trim() ?? "";
  return normalized || null;
}

export function parsePublicPlanQuery(params: SearchParams): PublicPlanQuery {
  return {
    page: parsePage(params.page),
    pageSize: PUBLIC_PLAN_PAGE_SIZE,
    status: parseMember(PUBLIC_STATUSES, params.status),
    priority: parseMember(PLAN_PRIORITIES, params.priority),
    categoryId: parseText(params.category),
  };
}

export function parseAdminPlanQuery(params: SearchParams): AdminPlanQuery {
  const overdue = firstValue(params.overdue);

  return {
    page: parsePage(params.page),
    pageSize: ADMIN_PLAN_PAGE_SIZE,
    search: parseText(params.q),
    status: parseMember(PLAN_STATUSES, params.status),
    visibility: parseMember(PLAN_VISIBILITIES, params.visibility),
    priority: parseMember(PLAN_PRIORITIES, params.priority),
    overdue: overdue === "true" ? true : overdue === "false" ? false : null,
  };
}

export function comparePublicPlans(a: Plan, b: Plan) {
  const priorityDifference =
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (priorityDifference) {
    return priorityDifference;
  }

  if (a.deadline && b.deadline && a.deadline !== b.deadline) {
    return a.deadline.localeCompare(b.deadline);
  }
  if (a.deadline && !b.deadline) {
    return -1;
  }
  if (!a.deadline && b.deadline) {
    return 1;
  }

  return b.updatedAt.localeCompare(a.updatedAt);
}

function isHomeCandidate(plan: Plan) {
  return (
    plan.visibility === "public" &&
    plan.deletedAt === null &&
    plan.deadline !== null &&
    (plan.status === "not_started" || plan.status === "in_progress")
  );
}

export function chooseHomePlan(plans: Plan[], today: string) {
  const candidates = plans.filter(isHomeCandidate);
  const overdue = candidates
    .filter((plan) => plan.deadline! < today)
    .sort((a, b) => b.deadline!.localeCompare(a.deadline!));

  if (overdue[0]) {
    return overdue[0];
  }

  return (
    candidates
      .filter((plan) => plan.deadline! >= today)
      .sort((a, b) => a.deadline!.localeCompare(b.deadline!))[0] ?? null
  );
}
