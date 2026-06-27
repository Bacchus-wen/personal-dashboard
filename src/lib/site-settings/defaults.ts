import type {
  HomeLayoutItem,
  HomeModuleId,
  PublishedSiteConfiguration,
} from "./types";
import { DEFAULT_NAVIGATION_VISIBILITY } from "../navigation/visibility";
import { DEFAULT_THEME_ID } from "./theme";

export const HOME_GRID = {
  columns: 12,
  rows: 8,
} as const;

export const HOME_MODULES: {
  id: HomeModuleId;
  label: string;
  core: boolean;
  width: number;
  height: number;
}[] = [
  { id: "navigation", label: "侧边导航", core: true, width: 2, height: 5 },
  { id: "welcome", label: "问候与简历入口", core: true, width: 7, height: 3 },
  { id: "socials", label: "社交链接", core: true, width: 7, height: 1 },
  { id: "album", label: "相册", core: false, width: 7, height: 2 },
  { id: "clock", label: "时钟", core: false, width: 3, height: 2 },
  { id: "calendar", label: "日历", core: false, width: 3, height: 3 },
  { id: "recentPlans", label: "近日规划", core: false, width: 3, height: 2 },
  { id: "recommendation", label: "随机推荐", core: false, width: 4, height: 2 },
  { id: "music", label: "音乐播放器", core: false, width: 3, height: 1 },
];

export const HOME_MODULE_IDS = HOME_MODULES.map((module) => module.id);
export const CORE_HOME_MODULE_IDS = HOME_MODULES.filter(
  (module) => module.core,
).map((module) => module.id);

export const EDITORIAL_HOME_MODULE_ORDER: HomeModuleId[] = [
  "navigation",
  "welcome",
  "recentPlans",
  "recommendation",
  "album",
  "music",
  "socials",
  "clock",
  "calendar",
];

export const MOBILE_HOME_MODULE_ORDER: HomeModuleId[] = [
  "welcome",
  "socials",
  "recentPlans",
  "album",
  "recommendation",
  "calendar",
  "music",
  "clock",
  "navigation",
];

export const DEFAULT_HOME_LAYOUT: HomeLayoutItem[] = [
  { moduleId: "navigation", x: 0, y: 1, width: 2, height: 5 },
  { moduleId: "welcome", x: 2, y: 2, width: 7, height: 3 },
  { moduleId: "recentPlans", x: 6, y: 6, width: 3, height: 2 },
  { moduleId: "recommendation", x: 2, y: 6, width: 4, height: 2 },
  { moduleId: "album", x: 2, y: 0, width: 7, height: 2 },
  { moduleId: "music", x: 9, y: 5, width: 3, height: 1 },
  { moduleId: "socials", x: 2, y: 5, width: 7, height: 1 },
  { moduleId: "clock", x: 9, y: 0, width: 3, height: 2 },
  { moduleId: "calendar", x: 9, y: 2, width: 3, height: 3 },
];

export const DEFAULT_SITE_CONFIGURATION: PublishedSiteConfiguration = {
  settings: {
    siteTitle: "Theodore · Personal Space",
    displayName: "Theodore",
    statusText: "正在记录生活",
    siteDescription: "Theodore 的个人博客、项目、阅读和生活记录。",
    avatarPath: "/avatar.svg",
    faviconPath: "/favicon.ico",
    filingNumber: "",
    filingUrl: null,
    themeId: DEFAULT_THEME_ID,
    moduleVisibility: {
      navigation: true,
      welcome: true,
      socials: true,
      album: true,
      clock: true,
      calendar: true,
      recentPlans: true,
      recommendation: true,
      music: true,
    },
    navigationVisibility: DEFAULT_NAVIGATION_VISIBILITY,
  },
  socialLinks: [
    {
      id: "github",
      platform: "github",
      label: "GitHub",
      href: "https://github.com/",
      position: 0,
      enabled: true,
    },
    {
      id: "xiaohongshu",
      platform: "xiaohongshu",
      label: "Rednote",
      href: "https://www.xiaohongshu.com/",
      position: 1,
      enabled: true,
    },
    {
      id: "bilibili",
      platform: "bilibili",
      label: "Bilibili",
      href: "https://www.bilibili.com/",
      position: 2,
      enabled: true,
    },
    {
      id: "twitter",
      platform: "twitter",
      label: "X / Twitter",
      href: "https://x.com/",
      position: 3,
      enabled: true,
    },
  ],
  layout: DEFAULT_HOME_LAYOUT,
};

export function cloneDefaultSiteConfiguration() {
  return structuredClone(DEFAULT_SITE_CONFIGURATION);
}
