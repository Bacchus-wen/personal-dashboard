import type {
  PlanPriority,
  PlanStatus,
  PlanVisibility,
} from "./constants";

export type PlanCategory = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Plan = {
  id: string;
  title: string | null;
  summary: string | null;
  description: string | null;
  status: PlanStatus;
  visibility: PlanVisibility;
  priority: PlanPriority;
  progress: number;
  deadline: string | null;
  relatedUrl: string | null;
  categoryId: string | null;
  category: PlanCategory | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanInput = {
  title: string | null;
  summary: string | null;
  description: string | null;
  status: string;
  visibility: string;
  priority: string;
  progress: number | string;
  deadline: string | null;
  relatedUrl: string | null;
  categoryId: string | null;
};

export type ValidPlanInput = {
  title: string | null;
  summary: string | null;
  description: string | null;
  status: PlanStatus;
  visibility: PlanVisibility;
  priority: PlanPriority;
  progress: number;
  deadline: string | null;
  relatedUrl: string | null;
  categoryId: string | null;
};

export type PlanFieldErrors = Partial<
  Record<keyof PlanInput, string[]>
>;

export type PlanValidationResult =
  | {
      ok: true;
      data: ValidPlanInput;
      errors: PlanFieldErrors;
    }
  | {
      ok: false;
      data?: undefined;
      errors: PlanFieldErrors;
    };

export type PlanActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: PlanFieldErrors;
  planId?: string;
};

export type PaginatedPlans = {
  plans: Plan[];
  total: number;
  page: number;
  pageSize: number;
};
