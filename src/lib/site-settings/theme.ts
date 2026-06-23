export const SITE_THEMES = [
  {
    id: "paper-editorial",
    label: "纸墨编辑部",
    description: "暖纸背景、炭黑正文、砖红强调，适合默认个人博客模板。",
  },
  {
    id: "night-radio",
    label: "夜间电台",
    description: "深蓝夜读、琥珀播放状态，适合更有音乐和夜晚氛围的版本。",
  },
] as const;

export type ThemeId = (typeof SITE_THEMES)[number]["id"];

export const DEFAULT_THEME_ID: ThemeId = "paper-editorial";

const themeIds = new Set<string>(SITE_THEMES.map((theme) => theme.id));

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && themeIds.has(value);
}

export function normalizeThemeId(value: unknown): ThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME_ID;
}
