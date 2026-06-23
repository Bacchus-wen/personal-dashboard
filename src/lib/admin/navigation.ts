export type AdminNavigationIcon =
  | "overview"
  | "plans"
  | "settings"
  | "works"
  | "collections"
  | "projects"
  | "photos"
  | "music"
  | "media";

export type AdminNavigationItem = {
  href: string;
  label: string;
  icon: AdminNavigationIcon;
};

export const ADMIN_NAVIGATION_ITEMS: AdminNavigationItem[] = [
  { href: "/admin", label: "后台概览", icon: "overview" },
  { href: "/admin/plans", label: "近日规划", icon: "plans" },
  { href: "/admin/settings", label: "网站设置", icon: "settings" },
  { href: "/admin/works", label: "我的作品", icon: "works" },
  { href: "/admin/collections", label: "内容收藏", icon: "collections" },
  { href: "/admin/projects", label: "优秀项目", icon: "projects" },
  { href: "/admin/photos", label: "公开相册", icon: "photos" },
  { href: "/admin/music", label: "音乐库", icon: "music" },
  { href: "/admin/media/test", label: "媒体测试", icon: "media" },
];

export function isAdminNavigationItemActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
