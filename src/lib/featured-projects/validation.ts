import {
  RECOMMENDATION_VISIBILITIES,
  type RecommendationVisibility,
} from "./constants";
import type {
  FeaturedProjectFieldErrors,
  FeaturedProjectInput,
  FeaturedProjectValidationResult,
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

function validateGithubUrl(value: string | null) {
  const normalized = optionalText(value);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    return url.protocol === "https:" && url.hostname.toLowerCase() === "github.com"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return (
    date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3])
  );
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

export function validateFeaturedProjectInput(
  input: FeaturedProjectInput,
): FeaturedProjectValidationResult {
  const errors: FeaturedProjectFieldErrors = {};
  const name = input.name.trim();
  const repositoryUrl = validateGithubUrl(input.repositoryUrl);
  const summary = optionalText(input.summary);
  const recommendation = optionalText(input.recommendation);
  const language = optionalText(input.language);
  const tags = normalizeTags(input.tags);
  const rawStarCount =
    input.starCount === null ? "" : String(input.starCount).trim();
  const starCount = rawStarCount === "" ? null : Number(rawStarCount);
  const starRecordedOn = optionalText(input.starRecordedOn);
  const visibility = isMember(RECOMMENDATION_VISIBILITIES, input.visibility)
    ? input.visibility
    : null;
  const sortOrder =
    typeof input.sortOrder === "number"
      ? input.sortOrder
      : Number(input.sortOrder.trim());

  if (!name || name.length > 120) {
    errors.name = ["名称必须为 1 至 120 个字符。"];
  }
  if ((summary?.length ?? 0) > 320) {
    errors.summary = ["简介最多 320 个字符。"];
  }
  if ((recommendation?.length ?? 0) > 320) {
    errors.recommendation = ["推荐理由最多 320 个字符。"];
  }
  if ((language?.length ?? 0) > 60) {
    errors.language = ["语言最多 60 个字符。"];
  }
  if (optionalText(input.repositoryUrl) && !repositoryUrl) {
    errors.repositoryUrl = ["仓库链接必须是 github.com 的 HTTPS 地址。"];
  }
  if (
    starCount !== null &&
    (!Number.isInteger(starCount) || starCount < 0)
  ) {
    errors.starCount = ["Star 数量必须为非负整数。"];
  }
  if (starRecordedOn && !isCalendarDate(starRecordedOn)) {
    errors.starRecordedOn = ["请输入有效的 Star 记录日期。"];
  }
  if (starCount === null && starRecordedOn) {
    errors.starCount = ["填写记录日期时必须同时填写 Star 数量。"];
  }
  if (starCount !== null && !starRecordedOn) {
    errors.starRecordedOn = ["填写 Star 数量时必须同时填写记录日期。"];
  }
  if (!visibility) {
    errors.visibility = ["请选择有效的可见性。"];
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.sortOrder = ["排序必须为非负整数。"];
  }
  if (tags.length > 20 || tags.some((tag) => tag.length > 30)) {
    errors.tags = ["标签最多 20 个，每个最多 30 个字符。"];
  }
  if (visibility === "public") {
    if (!repositoryUrl) {
      errors.repositoryUrl = ["公开项目必须填写 GitHub 仓库链接。"];
    }
    if (!summary) errors.summary = ["公开项目必须填写简介。"];
    if (!recommendation) {
      errors.recommendation = ["公开项目必须填写推荐理由。"];
    }
  }

  if (Object.keys(errors).length || !visibility) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    data: {
      name,
      repositoryUrl,
      summary,
      recommendation,
      language,
      tags,
      starCount,
      starRecordedOn,
      visibility: visibility as RecommendationVisibility,
      featured: input.featured,
      sortOrder,
    },
  };
}
