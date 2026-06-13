import {
  COLLECTION_CONTENT_TYPES,
  RECOMMENDATION_VISIBILITIES,
  type CollectionContentType,
  type RecommendationVisibility,
} from "./constants";
import type {
  CollectionFieldErrors,
  CollectionInput,
  CollectionValidationResult,
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

function validateHttpsUrl(value: string | null) {
  const normalized = optionalText(value);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function validateImagePath(value: string | null) {
  const normalized = optionalText(value);
  if (!normalized) return null;

  if (
    normalized.startsWith("/") &&
    !normalized.startsWith("//") &&
    !normalized.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    return normalized;
  }

  return validateHttpsUrl(normalized);
}

function normalizeTags(values: string[]) {
  const seen = new Set<string>();

  return values.reduce<string[]>((tags, value) => {
    const tag = value.trim();
    const key = tag.toLocaleLowerCase();

    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }

    return tags;
  }, []);
}

export function validateCollectionInput(
  input: CollectionInput,
): CollectionValidationResult {
  const errors: CollectionFieldErrors = {};
  const title = input.title.trim();
  const sourceName = optionalText(input.sourceName);
  const summary = optionalText(input.summary);
  const externalUrl = validateHttpsUrl(input.externalUrl);
  const coverPath = validateImagePath(input.coverPath);
  const tags = normalizeTags(input.tags);
  const contentType = isMember(COLLECTION_CONTENT_TYPES, input.contentType)
    ? input.contentType
    : null;
  const visibility = isMember(RECOMMENDATION_VISIBILITIES, input.visibility)
    ? input.visibility
    : null;
  const sortOrder =
    typeof input.sortOrder === "number"
      ? input.sortOrder
      : Number(input.sortOrder.trim());

  if (!title || title.length > 120) {
    errors.title = ["标题必须为 1 至 120 个字符。"];
  }
  if ((sourceName?.length ?? 0) > 120) {
    errors.sourceName = ["来源名称最多 120 个字符。"];
  }
  if ((summary?.length ?? 0) > 320) {
    errors.summary = ["摘要最多 320 个字符。"];
  }
  if (!contentType) {
    errors.contentType = ["请选择有效的内容类型。"];
  }
  if (!visibility) {
    errors.visibility = ["请选择有效的可见性。"];
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.sortOrder = ["排序必须为非负整数。"];
  }
  if (optionalText(input.externalUrl) && !externalUrl) {
    errors.externalUrl = ["外部链接必须使用 HTTPS。"];
  }
  if (optionalText(input.coverPath) && !coverPath) {
    errors.coverPath = ["封面必须使用项目本地路径或 HTTPS 地址。"];
  }
  if (tags.length > 20 || tags.some((tag) => tag.length > 30)) {
    errors.tags = ["标签最多 20 个，每个最多 30 个字符。"];
  }
  if (visibility === "public") {
    if (!summary) errors.summary = ["公开收藏必须填写摘要。"];
    if (!externalUrl) errors.externalUrl = ["公开收藏必须填写 HTTPS 外部链接。"];
  }

  if (Object.keys(errors).length || !contentType || !visibility) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    data: {
      title,
      contentType: contentType as CollectionContentType,
      sourceName,
      summary,
      externalUrl,
      coverPath,
      tags,
      visibility: visibility as RecommendationVisibility,
      featured: input.featured,
      sortOrder,
    },
  };
}
