import {
  CORE_HOME_MODULE_IDS,
  HOME_GRID,
  HOME_MODULE_IDS,
  HOME_MODULES,
} from "./defaults";
import type {
  HomeLayoutItem,
  HomeModuleId,
  SiteConfigurationFieldErrors,
  SiteConfigurationInput,
  SiteConfigurationValidationResult,
  SocialLinkInput,
} from "./types";
import {
  isCompleteNavigationVisibility,
  normalizeNavigationVisibility,
} from "../navigation/visibility";
import { isSystemMediaPath } from "../media/path";
import { normalizeHomeLayoutOrder } from "./layout";
import { isThemeId, normalizeThemeId } from "./theme";

function trimmed(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function isSafeLocalPath(value: string) {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isMailtoUrl(value: string) {
  if (!value.startsWith("mailto:")) return false;
  const address = value.slice("mailto:".length);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
}

export function validateImagePath(value: string) {
  const normalized = trimmed(value);
  return isSafeLocalPath(normalized) ||
    isHttpsUrl(normalized) ||
    isSystemMediaPath(normalized)
    ? normalized
    : null;
}

export function validateSocialHref(value: string) {
  const normalized = trimmed(value);
  return isHttpsUrl(normalized) || isMailtoUrl(normalized) ? normalized : null;
}

function rectanglesOverlap(a: HomeLayoutItem, b: HomeLayoutItem) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function validateLayout(layout: HomeLayoutItem[]) {
  if (layout.length !== HOME_MODULE_IDS.length) return false;
  const ids = new Set<HomeModuleId>();

  for (const item of layout) {
    const definition = HOME_MODULES.find((module) => module.id === item.moduleId);
    if (
      !definition ||
      ids.has(item.moduleId) ||
      !Number.isInteger(item.x) ||
      !Number.isInteger(item.y) ||
      item.width !== definition.width ||
      item.height !== definition.height ||
      item.x < 0 ||
      item.y < 0 ||
      item.x + item.width > HOME_GRID.columns ||
      item.y + item.height > HOME_GRID.rows
    ) {
      return false;
    }
    ids.add(item.moduleId);
  }

  return layout.every((item, index) =>
    layout.slice(index + 1).every((other) => !rectanglesOverlap(item, other)),
  );
}

function normalizeSocialLinks(
  links: SocialLinkInput[],
  errors: SiteConfigurationFieldErrors,
) {
  const positions = new Set<number>();
  const ids = new Set<string>();
  const normalized: SocialLinkInput[] = [];

  for (const link of links) {
    const id = trimmed(link.id);
    const platform = trimmed(link.platform);
    const label = trimmed(link.label);
    const href = validateSocialHref(link.href);
    if (
      !id ||
      !platform ||
      platform.length > 40 ||
      !label ||
      label.length > 60 ||
      !href ||
      !Number.isInteger(link.position) ||
      link.position < 0 ||
      positions.has(link.position) ||
      ids.has(id)
    ) {
      errors.socialLinks = ["请检查社交链接名称、地址和排序。"];
      return [];
    }
    ids.add(id);
    positions.add(link.position);
    normalized.push({ ...link, id, platform, label, href });
  }

  return normalized.sort((a, b) => a.position - b.position);
}

export function validateSiteConfiguration(
  input: SiteConfigurationInput,
): SiteConfigurationValidationResult {
  const errors: SiteConfigurationFieldErrors = {};
  const siteTitle = trimmed(input.settings.siteTitle);
  const displayName = trimmed(input.settings.displayName);
  const statusText = trimmed(input.settings.statusText);
  const siteDescription = trimmed(input.settings.siteDescription);
  const avatarPath = validateImagePath(input.settings.avatarPath);
  const faviconPath = validateImagePath(input.settings.faviconPath);
  const filingNumber = trimmed(input.settings.filingNumber);
  const filingUrlText = trimmed(input.settings.filingUrl);
  const filingUrl = filingUrlText ? validateSocialHref(filingUrlText) : null;
  const themeIdValue = (input.settings as { themeId?: unknown }).themeId;
  const themeId = normalizeThemeId(themeIdValue);

  if (!siteTitle || siteTitle.length > 80) {
    errors.siteTitle = ["网站标题必须为 1 至 80 个字符。"];
  }
  if (!displayName || displayName.length > 60) {
    errors.displayName = ["用户名必须为 1 至 60 个字符。"];
  }
  if (statusText.length > 120) {
    errors.statusText = ["状态短语不能超过 120 个字符。"];
  }
  if (siteDescription.length > 300) {
    errors.siteDescription = ["网站描述不能超过 300 个字符。"];
  }
  if (!avatarPath) {
    errors.avatarPath = ["头像必须使用项目本地路径或 HTTPS 地址。"];
  }
  if (!faviconPath) {
    errors.faviconPath = ["Favicon 必须使用项目本地路径或 HTTPS 地址。"];
  }
  if (filingNumber.length > 80) {
    errors.filingNumber = ["备案号不能超过 80 个字符。"];
  }
  if (filingUrlText && !filingUrl) {
    errors.filingUrl = ["备案链接必须使用 HTTPS 地址。"];
  }
  if (!isThemeId(themeIdValue)) {
    errors.themeId = ["请选择有效的网站主题。"];
  }

  const visibilityKeys = Object.keys(input.settings.moduleVisibility);
  if (
    visibilityKeys.length !== HOME_MODULE_IDS.length ||
    HOME_MODULE_IDS.some(
      (id) => typeof input.settings.moduleVisibility[id] !== "boolean",
    ) ||
    CORE_HOME_MODULE_IDS.some(
      (id) => input.settings.moduleVisibility[id] !== true,
    )
  ) {
    errors.moduleVisibility = ["核心模块必须启用，且模块配置必须完整。"];
  }
  if (!isCompleteNavigationVisibility(input.settings.navigationVisibility)) {
    errors.navigationVisibility = ["导航显示配置必须完整。"];
  }

  const socialLinks = normalizeSocialLinks(input.socialLinks, errors);
  if (!validateLayout(input.layout)) {
    errors.layout = ["首页卡片不能重叠、越界或改变固定尺寸。"];
  }

  if (Object.keys(errors).length || !avatarPath || !faviconPath) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    data: {
      settings: {
        siteTitle,
        displayName,
        statusText,
        siteDescription,
        avatarPath,
        faviconPath,
        filingNumber,
        filingUrl,
        themeId,
        moduleVisibility: { ...input.settings.moduleVisibility },
        navigationVisibility: normalizeNavigationVisibility(
          input.settings.navigationVisibility,
        ),
      },
      socialLinks,
      layout: normalizeHomeLayoutOrder(
        input.layout,
        input.settings.moduleVisibility,
      ),
    },
  };
}
