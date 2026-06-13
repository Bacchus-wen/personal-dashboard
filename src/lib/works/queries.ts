import {
  WORK_STATUSES,
  WORK_VISIBILITIES,
  type WorkStatus,
  type WorkVisibility,
} from "./constants";
import type { Work } from "./types";

type SearchParams = Record<string, string | string[] | undefined>;

export type PublicWorkQuery = {
  status: WorkStatus | null;
  tech: string | null;
};

export type AdminWorkQuery = {
  search: string | null;
  status: WorkStatus | null;
  visibility: WorkVisibility | null;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseText(value: string | string[] | undefined) {
  const normalized = firstValue(value)?.trim() ?? "";
  return normalized || null;
}

function parseMember<T extends readonly string[]>(
  values: T,
  value: string | string[] | undefined,
): T[number] | null {
  const candidate = firstValue(value);
  return candidate && values.includes(candidate) ? (candidate as T[number]) : null;
}

export function parsePublicWorkQuery(params: SearchParams): PublicWorkQuery {
  return {
    status: parseMember(WORK_STATUSES, params.status),
    tech: parseText(params.tech),
  };
}

export function parseAdminWorkQuery(params: SearchParams): AdminWorkQuery {
  return {
    search: parseText(params.q),
    status: parseMember(WORK_STATUSES, params.status),
    visibility: parseMember(WORK_VISIBILITIES, params.visibility),
  };
}

export function isPublicWork(work: Work) {
  return (
    work.visibility === "public" &&
    work.deletedAt === null &&
    work.slug !== null
  );
}
