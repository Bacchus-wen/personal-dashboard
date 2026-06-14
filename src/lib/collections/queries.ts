import {
  COLLECTION_CONTENT_TYPES,
  RECOMMENDATION_VISIBILITIES,
  type CollectionContentType,
  type RecommendationVisibility,
} from "./constants";

type SearchParams = Record<string, string | string[] | undefined>;

export type PublicCollectionQuery = {
  type: CollectionContentType;
  search: string | null;
  tag: string | null;
};

export type AdminCollectionQuery = {
  search: string | null;
  type: CollectionContentType | null;
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

export function parsePublicCollectionQuery(
  params: SearchParams,
): PublicCollectionQuery {
  return {
    type: parseMember(COLLECTION_CONTENT_TYPES, params.type) ?? "article",
    search: parseText(params.q),
    tag: parseText(params.tag),
  };
}

export function parseAdminCollectionQuery(
  params: SearchParams,
): AdminCollectionQuery {
  return {
    search: parseText(params.q),
    type: parseMember(COLLECTION_CONTENT_TYPES, params.type),
    visibility: parseMember(RECOMMENDATION_VISIBILITIES, params.visibility),
  };
}
