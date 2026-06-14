import {
  RECOMMENDATION_VISIBILITIES,
  type RecommendationVisibility,
} from "./constants";

type SearchParams = Record<string, string | string[] | undefined>;

export type PublicFeaturedProjectQuery = {
  search: string | null;
  language: string | null;
  tag: string | null;
};

export type AdminFeaturedProjectQuery = {
  search: string | null;
  language: string | null;
  visibility: RecommendationVisibility | null;
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

export function parsePublicFeaturedProjectQuery(
  params: SearchParams,
): PublicFeaturedProjectQuery {
  return {
    search: parseText(params.q),
    language: parseText(params.language),
    tag: parseText(params.tag),
  };
}

export function parseAdminFeaturedProjectQuery(
  params: SearchParams,
): AdminFeaturedProjectQuery {
  return {
    search: parseText(params.q),
    language: parseText(params.language),
    visibility: parseMember(RECOMMENDATION_VISIBILITIES, params.visibility),
  };
}
