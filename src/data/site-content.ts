export type NavId = "home" | "articles" | "projects" | "about" | "resources" | "blogs";

export const navigation: { id: NavId; href: string; label: string }[] = [
  { id: "home", href: "/", label: "首页" },
  { id: "articles", href: "/articles", label: "近期文章" },
  { id: "projects", href: "/projects", label: "我的项目" },
  { id: "about", href: "/about", label: "关于网站" },
  { id: "resources", href: "/resources", label: "推荐分享" },
  { id: "blogs", href: "/blogs", label: "优秀博客" },
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

export const projects = [
  { mark: "PAGE", title: "Quiet Page", year: "2026", tags: ["Web", "Journal"], description: "一个为短篇记录设计的安静写作界面。" },
  { mark: "MIX", title: "Mint Mix", year: "2026", tags: ["Music", "UI"], description: "把日常歌单整理成轻量的可视化播放页。" },
  { mark: "SHOT", title: "Slow Shots", year: "2025", tags: ["Photo"], description: "用于整理旅行照片与短句的个人相册实验。" },
  { mark: "KIT", title: "Glass Kit", year: "2025", tags: ["CSS", "Tokens"], description: "一组克制的玻璃拟态视觉令牌与组件草稿。" },
];

export type DirectoryItem = {
  mark: string;
  title: string;
  url: string;
  description: string;
  categories: string[];
  tags?: string[];
};

export const resources: DirectoryItem[] = [
  { mark: "GRID", title: "Layout Notes", url: "notes.example/design", categories: ["design"], tags: ["Design"], description: "关于网格、留白和页面节奏的短篇收藏。" },
  { mark: "CSS", title: "Modern CSS", url: "notes.example/css", categories: ["tools", "frontend"], tags: ["Tools", "Frontend"], description: "持续更新的现代 CSS 特性与实践笔记。" },
  { mark: "READ", title: "Reading Map", url: "notes.example/read", categories: ["learning"], tags: ["Learning"], description: "把零散阅读整理成可以回看的主题路径。" },
  { mark: "FLOW", title: "Small Workflow", url: "notes.example/flow", categories: ["tools"], tags: ["Tools"], description: "减少重复动作的个人工作流清单。" },
  { mark: "TYPE", title: "Type Pairing", url: "notes.example/type", categories: ["design", "frontend"], tags: ["Design", "Frontend"], description: "中英文混排时的字体、字号与间距观察。" },
  { mark: "LOG", title: "Weekly Review", url: "notes.example/review", categories: ["learning"], tags: ["Learning"], description: "一个不过度追求效率的周复盘模板。" },
];

export const blogs: DirectoryItem[] = [
  { mark: "NO", title: "North Window", url: "north.example", categories: ["blog"], description: "设计、书籍与城市观察，更新缓慢但细致。" },
  { mark: "MO", title: "Mono Garden", url: "mono.example", categories: ["blog"], description: "把代码实验和生活记录放在同一个花园里。" },
  { mark: "ST", title: "Still Days", url: "still.example", categories: ["blog"], description: "影像、散步与日常物件的安静记录。" },
  { mark: "UI", title: "Interface Index", url: "interface.example", categories: ["links"], description: "独立产品与网页界面的分类收藏。" },
  { mark: "TX", title: "Text Archive", url: "text.example", categories: ["links"], description: "长文、访谈与优质小刊物入口。" },
  { mark: "BL", title: "Blue Letter", url: "blue.example", categories: ["blog"], description: "关于创造、工具与可持续工作节奏。" },
];
