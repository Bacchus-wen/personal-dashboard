export type NavId =
  | "home"
  | "plans"
  | "works"
  | "collections"
  | "projects"
  | "about";

export const navigation: { id: NavId; href: string; label: string }[] = [
  { id: "home", href: "/", label: "首页" },
  { id: "plans", href: "/plans", label: "近日规划" },
  { id: "works", href: "/works", label: "我的作品" },
  { id: "about", href: "/about", label: "关于网站" },
  { id: "collections", href: "/collections", label: "内容收藏" },
  { id: "projects", href: "/projects", label: "优秀项目" },
];

export const socials = ["GitHub", "小红书", "Bilibili", "X / Twitter"];
