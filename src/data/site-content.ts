export type NavId =
  | "home"
  | "plans"
  | "articles"
  | "works"
  | "collections"
  | "projects"
  | "about";

export const navigation: { id: NavId; href: string; label: string }[] = [
  { id: "home", href: "/", label: "首页" },
  { id: "plans", href: "/plans", label: "近日规划" },
  { id: "articles", href: "/articles", label: "近期文章" },
  { id: "works", href: "/works", label: "我的作品" },
  { id: "about", href: "/about", label: "关于网站" },
  { id: "collections", href: "/collections", label: "内容收藏" },
  { id: "projects", href: "/projects", label: "优秀项目" },
];

export const socials = ["GitHub", "小红书", "Bilibili", "X / Twitter"];

export const articleYears = [
  {
    year: "2026",
    articles: [
      ["06-03", "搭建一个更安静的个人主页", "#Design"],
      ["05-18", "一周阅读与灵感备忘", "#Notes"],
      ["04-29", "关于微交互的克制", "#UI"],
      ["03-12", "把照片整理成可浏览的记忆", "#Life"],
      ["01-07", "新年的项目清单", "#Build"],
    ],
  },
  {
    year: "2025",
    articles: [
      ["12-20", "冬日书影音记录", "#Log"],
      ["08-16", "一次轻量旅行的物品清单", "#Life"],
      ["02-08", "从零开始记录作品", "#Build"],
    ],
  },
];
