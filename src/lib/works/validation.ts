import {
  WORK_STATUSES,
  WORK_VISIBILITIES,
  type WorkStatus,
  type WorkVisibility,
} from "./constants";
import type {
  WorkFieldErrors,
  WorkInput,
  WorkScreenshot,
  WorkValidationResult,
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
  if (!match) return false;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return (
    date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3])
  );
}

export function validateHttpsUrl(value: string | null) {
  const normalized = optionalText(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function validateImagePath(value: string | null) {
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

function normalizeScreenshots(
  input: WorkInput["screenshots"],
  errors: WorkFieldErrors,
) {
  const screenshots: WorkScreenshot[] = [];
  const orders = new Set<number>();

  for (const item of input) {
    const imagePath = validateImagePath(item.imagePath);
    const sortOrder =
      typeof item.sortOrder === "number"
        ? item.sortOrder
        : Number.parseInt(item.sortOrder, 10);
    if (
      !imagePath ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      orders.has(sortOrder)
    ) {
      errors.screenshots = ["截图必须使用安全图片路径和不重复的非负顺序。"];
      continue;
    }
    orders.add(sortOrder);
    screenshots.push({
      imagePath,
      caption: optionalText(item.caption),
      sortOrder,
    });
  }

  return screenshots.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function validateWorkInput(input: WorkInput): WorkValidationResult {
  const errors: WorkFieldErrors = {};
  const name = input.name.trim();
  const slug = optionalText(input.slug);
  const summary = optionalText(input.summary);
  const description = optionalText(input.description);
  const coverPath = validateImagePath(input.coverPath);
  const seoImagePath = validateImagePath(input.seoImagePath);
  const websiteUrl = validateHttpsUrl(input.websiteUrl);
  const githubUrl = validateHttpsUrl(input.githubUrl);
  const startedOn = optionalText(input.startedOn);
  const completedOn = optionalText(input.completedOn);
  const seoTitle = optionalText(input.seoTitle);
  const seoDescription = optionalText(input.seoDescription);
  const status = isMember(WORK_STATUSES, input.status) ? input.status : null;
  const visibility = isMember(WORK_VISIBILITIES, input.visibility)
    ? input.visibility
    : null;
  const techStack = normalizeTags(input.techStack);
  const sortOrder =
    typeof input.sortOrder === "number"
      ? input.sortOrder
      : Number.parseInt(input.sortOrder, 10);
  const screenshots = normalizeScreenshots(input.screenshots, errors);

  if (!name || name.length > 100) errors.name = ["名称必须为 1 至 100 个字符。"];
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = ["slug 仅允许小写字母、数字和中间连字符。"];
  }
  if (!status) errors.status = ["请选择有效状态。"];
  if (!visibility) errors.visibility = ["请选择有效可见性。"];
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.sortOrder = ["排序必须为非负整数。"];
  }
  if (optionalText(input.coverPath) && !coverPath) {
    errors.coverPath = ["请输入项目本地路径或 HTTPS 图片地址。"];
  }
  if (optionalText(input.seoImagePath) && !seoImagePath) {
    errors.seoImagePath = ["请输入项目本地路径或 HTTPS 图片地址。"];
  }
  if (optionalText(input.websiteUrl) && !websiteUrl) {
    errors.websiteUrl = ["项目网站必须使用 HTTPS 地址。"];
  }
  if (optionalText(input.githubUrl) && !githubUrl) {
    errors.githubUrl = ["GitHub 链接必须使用 HTTPS 地址。"];
  }
  if (techStack.length > 20 || techStack.some((tag) => tag.length > 30)) {
    errors.techStack = ["技术标签最多 20 个，每个最多 30 个字符。"];
  }
  if (startedOn && !isCalendarDate(startedOn)) {
    errors.startedOn = ["请输入有效开始日期。"];
  }
  if (completedOn && !isCalendarDate(completedOn)) {
    errors.completedOn = ["请输入有效完成日期。"];
  } else if (startedOn && completedOn && completedOn < startedOn) {
    errors.completedOn = ["完成日期不能早于开始日期。"];
  }
  if (visibility === "public") {
    if (!slug) errors.slug = ["公开作品必须填写 slug。"];
    if (!summary) errors.summary = ["公开作品必须填写简短摘要。"];
    if (!description) errors.description = ["公开作品必须填写详细介绍。"];
    if (!websiteUrl) errors.websiteUrl = ["公开作品必须填写 HTTPS 项目网站。"];
  }

  if (Object.keys(errors).length || !status || !visibility) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    data: {
      name,
      slug,
      summary,
      description,
      coverPath,
      techStack,
      status: status as WorkStatus,
      visibility: visibility as WorkVisibility,
      startedOn,
      completedOn,
      websiteUrl,
      githubUrl,
      websiteAvailable: input.websiteAvailable,
      featured: input.featured,
      sortOrder,
      seoTitle,
      seoDescription,
      seoImagePath,
      screenshots,
    },
  };
}
