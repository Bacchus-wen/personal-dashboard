# 内容收藏与优秀项目设计

## 目标

流程 4 将当前演示性质的推荐页面升级为可由唯一管理员真实维护的内容收藏库与优秀 GitHub 项目目录。

本流程包含两个独立领域：

- `collections`：收藏的外部文章与视频；
- `featured_projects`：手动维护的优秀 GitHub 项目。

所有公开卡片均直接跳转原网站，不转载正文、不嵌入视频、不创建站内详情页。原创文章系统不属于本流程，现有 `/articles` 路由继续保留。

## 范围

### 本流程包含

- 新增公开内容收藏页 `/collections`；
- 将 `/projects` 改为优秀 GitHub 项目目录；
- 新增两个领域的后台列表、新建、编辑、编辑器内卡片预览和回收站；
- 将 `/resources` 永久重定向到 `/collections`；
- 将 `/blogs` 永久重定向到 `/projects`；
- 将首页随机推荐模块接入真实精选收藏与优秀项目；
- 新增服务器专用数据库表、校验、查询、仓库和 Server Actions；
- 删除旧演示推荐数据的公开展示，不使用演示数据作为错误回退。

### 本流程不包含

- 原创文章发布或 `/articles` 后台管理；
- 外部文章正文转载、站内阅读页或阅读进度；
- 视频嵌入、站内播放器或视频详情页；
- GitHub API、令牌、自动同步、定时任务或缓存；
- 自动抓取网页标题、封面、摘要或元数据；
- 统一标签管理页面；
- 批量操作、拖拽排序或独立后台预览页；
- 真实文件上传或 Supabase Storage 管理；
- 新依赖或 Docker。

## 页面职责与导航

| 路由 | 页面职责 |
| --- | --- |
| `/articles` | 保留给站长原创文章；流程 4 不改造为真实发布系统 |
| `/collections` | 展示收藏的外部文章与视频 |
| `/projects` | 展示手动推荐的优秀 GitHub 项目 |
| `/resources` | 永久重定向至 `/collections` |
| `/blogs` | 永久重定向至 `/projects` |

主导航调整：

- “推荐分享”改为“内容收藏”，指向 `/collections`；
- “优秀博客”改为“优秀项目”，指向 `/projects`；
- “近期文章”继续指向 `/articles`。

所有外部链接使用新标签页打开，并包含安全的 `rel` 属性。

## 数据与安全架构

采用两个独立领域模型，不使用包含大量条件字段的通用推荐表。

两个业务表均：

- 启用 RLS；
- 撤销 `anon` 与普通 `authenticated` 角色的直接表访问权限；
- 仅向 `service_role` 授予需要的权限；
- 由 Next.js 服务端仓库读取；
- 由重新验证管理员身份后的 Server Actions 写入；
- 使用 `deleted_at` 实现回收站；
- 公开查询强制应用 `visibility = public` 与 `deleted_at is null`；
- 不向浏览器暴露 Secret Key、数据库错误或内部堆栈。

### `collections`

职责：保存外部文章与视频收藏的展示元数据。

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `id` | UUID | 主键 |
| `title` | Text | 必填，去除首尾空白后不可为空 |
| `content_type` | Enum | `article` 或 `video` |
| `source_name` | Text / Null | 来源名称 |
| `summary` | Text / Null | 简短摘要；公开时必填 |
| `external_url` | Text / Null | 公开时必填，仅允许 HTTPS |
| `cover_path` | Text / Null | 项目本地 `/` 路径或 HTTPS URL |
| `tags` | Text Array | 自由标签，保存时规范化并去重 |
| `visibility` | Enum | `draft`、`public`、`archived` |
| `featured` | Boolean | 是否进入首页推荐候选 |
| `sort_order` | Integer | 非负整数，数值越小越靠前 |
| `deleted_at` | Timestamptz / Null | 有值时位于回收站 |
| `created_at` | Timestamptz | 创建时间 |
| `updated_at` | Timestamptz | 最后修改时间 |

收藏不保存独立推荐理由。公开卡片与首页推荐使用 `summary` 作为简短推荐理由，保持后台字段精简。

### `featured_projects`

职责：保存值得推荐的 GitHub 项目及站长的推荐理由。

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `id` | UUID | 主键 |
| `name` | Text | 必填，去除首尾空白后不可为空 |
| `repository_url` | Text / Null | 公开时必填，仅允许 HTTPS GitHub 仓库 URL |
| `summary` | Text / Null | 项目简介；公开时必填 |
| `recommendation` | Text / Null | 推荐理由；公开时必填 |
| `language` | Text / Null | 用于公开语言筛选 |
| `tags` | Text Array | 自由标签，保存时规范化并去重 |
| `star_count` | Integer / Null | 可选，非负整数 |
| `star_recorded_on` | Date / Null | 填写 Star 数时必须同时填写 |
| `visibility` | Enum | `draft`、`public`、`archived` |
| `featured` | Boolean | 是否进入首页推荐候选 |
| `sort_order` | Integer | 非负整数，数值越小越靠前 |
| `deleted_at` | Timestamptz / Null | 有值时位于回收站 |
| `created_at` | Timestamptz | 创建时间 |
| `updated_at` | Timestamptz | 最后修改时间 |

`star_count` 与 `star_recorded_on` 必须同时填写或同时为空。项目卡片显示 Star 数时必须同时显示记录日期，避免把手动快照误解为实时数字。

本流程不保存项目官网、作者、封面或其他易过期 GitHub 元数据。整张项目卡片直接打开仓库 URL。

## 校验规则

通用规则：

- 标题或名称必填；
- `visibility` 仅允许 `draft`、`public`、`archived`；
- 草稿和归档允许暂时缺少公开字段；
- 所有公开外链仅允许 HTTPS；
- 封面仅允许项目本地 `/` 路径或 HTTPS URL；
- 标签去除首尾空白、空值和大小写重复项，并限制单项长度与总数量；
- `sort_order` 必须为非负整数；
- 恢复回收站内容时强制将 `visibility` 改为 `draft`。

内容收藏公开时必须填写标题、摘要和 HTTPS 外链。优秀项目公开时必须填写名称、HTTPS GitHub 仓库 URL、简介和推荐理由。

## 公开内容收藏页

### `/collections`

- 顶部提供“文章 / 视频”类型切换；
- 支持关键词搜索和自由标签筛选；
- 筛选状态记录在 URL 查询参数中；
- 使用已确认的封面型紧凑卡片网格；
- 桌面三列、平板两列、移动端单列，并支持约 320px 宽度；
- 无封面时根据文章或视频类型显示统一占位视觉；
- 卡片显示类型、标题、来源、摘要和少量标签；
- 整张卡片在新标签页打开原网站；
- 不创建站内详情页。

默认排序：

1. `featured` 为真优先；
2. `sort_order` 从小到大；
3. `updated_at` 从新到旧。

公开查询最多返回 100 条。没有匹配内容时显示真实空状态；查询失败时只替换内容区域为受控错误状态，不回退演示数据。

## 公开优秀项目页

### `/projects`

- 支持关键词、语言和自由标签筛选；
- 筛选状态记录在 URL 查询参数中；
- 使用已确认的紧凑项目卡片网格；
- 桌面三列、平板两列、移动端单列；
- 卡片显示名称、简介、推荐理由、语言、标签，以及可选 Star 快照；
- 显示 Star 数时必须同时显示记录日期；
- 整张卡片在新标签页打开 GitHub 仓库；
- 不创建站内详情页。

排序、100 条查询上限、空状态和错误状态与 `/collections` 一致。

## 后台管理

内容收藏路由：

- `/admin/collections`
- `/admin/collections/new`
- `/admin/collections/[id]/edit`
- `/admin/collections/trash`

优秀项目路由：

- `/admin/projects`
- `/admin/projects/new`
- `/admin/projects/[id]/edit`
- `/admin/projects/trash`

共同交互：

- 后台首页增加两个管理入口；
- 列表支持搜索、可见性筛选和领域特定筛选；
- 收藏列表支持内容类型筛选，项目列表支持语言筛选；
- 编辑器内提供实时卡片预览；
- 保存成功后返回对应后台列表；
- 保存期间禁用重复提交；
- 保存失败保留当前输入并显示字段级或页面级错误；
- 删除先移入回收站，恢复后强制变为草稿；
- 永久删除前显示明确的二次确认；
- 不提供独立后台预览页、批量操作或拖拽排序。

## 首页随机推荐

复用现有首页推荐模块及其布局开关。

候选内容：

- 公开、未删除且 `featured = true` 的文章与视频收藏；
- 公开、未删除且 `featured = true` 的优秀项目。

服务端每次首页加载时从合并后的候选集中随机选择一条。首页推荐卡片仅显示类型、标题和简短推荐理由。收藏使用 `summary`，项目使用 `recommendation`。

点击卡片后在新标签页打开原网站或 GitHub 仓库。当推荐模块关闭、没有候选内容或查询失败时，隐藏该模块，不显示演示数据或错误提示。

## 组件与代码边界

路由页面保持以服务端组件为主，状态、表单事件和筛选交互隔离在专用客户端组件中。

建议领域边界：

- `src/lib/collections/`：类型、常量、校验、查询、仓库和动作服务；
- `src/lib/featured-projects/`：类型、常量、校验、查询、仓库和动作服务；
- `src/components/collections/`：公开收藏卡片与筛选器；
- `src/components/featured-projects/`：公开项目卡片与筛选器；
- `src/components/admin/collections/`：后台收藏组件；
- `src/components/admin/featured-projects/`：后台项目组件；
- `src/lib/recommendations/`：将两个领域的公开精选记录映射为统一首页推荐候选，不负责写入。

领域模型保持独立，仅在首页推荐读取边界转换为统一展示类型。

## 错误处理

- 数据库迁移尚未执行：公开区域显示受控错误状态；后台显示明确迁移提示；
- 公开查询失败：仅替换对应内容区域；
- 首页推荐查询失败：静默隐藏推荐模块；
- 后台查询失败：显示错误状态与重试入口；
- 校验失败：保留输入并显示字段错误；
- 保存、删除、恢复或永久删除失败：保持原数据状态并显示通用错误；
- 不存在、已删除或不允许编辑的后台记录：返回 404；
- 错误响应不得暴露密钥、数据库连接信息、内部堆栈或私有记录。

## 迁移与权限

新增一份流程 4 数据库迁移，负责创建枚举、业务表、约束、索引、更新时间触发器和安全权限。

本流程不需要 Docker 或 Supabase CLI。迁移继续通过 Supabase Dashboard 的 SQL Editor 执行，并在真实云项目验证浏览器角色被拒绝、服务端 Secret Key 可执行所需读写。

## 验证策略

### 自动化验证

- 字段规范化、长度限制、HTTPS 外链与安全封面路径；
- 标签去空、去重和数量限制；
- Star 数与记录日期组合规则；
- 公开内容完整性规则；
- 公开查询始终过滤公开、未删除记录；
- 搜索、类型、语言与标签筛选；
- 精选、管理员排序和更新时间排序；
- 公开查询最多返回 100 条；
- 后台写入权限检查；
- 回收站恢复后强制变为草稿；
- 首页推荐只使用公开、未删除、精选记录；
- 首页无候选或查询失败时隐藏模块；
- 导航调整和旧路由永久重定向。

### 手动验收

1. 管理员可以创建仅有标题或名称的草稿。
2. 缺少公开必填字段时无法发布，并显示准确错误。
3. 完整收藏和项目可以公开、筛选并正确跳转。
4. Star 快照只有在数字与记录日期同时填写时才能保存。
5. 草稿、归档、已删除记录不会出现在公开页面或首页推荐中。
6. 编辑器内卡片预览与公开卡片主要信息一致。
7. 回收站恢复后内容自动变为草稿。
8. 首页推荐只显示类型、标题与简短推荐理由。
9. `/resources` 与 `/blogs` 永久重定向到新页面。
10. 没有公开内容时显示真实空状态，不出现旧演示数据。
11. 桌面、平板和约 320px 移动端无页面级横向滚动。
12. `npm test`、`npm run lint`、`npx tsc --noEmit` 与最终单次 `npm run build` 通过。
13. 使用外部浏览器完成主要公开与后台交互验收。
14. 在真实 Supabase 云项目验证迁移与权限边界。

## 安装、磁盘与效率边界

- 不安装新依赖、不使用 Docker；
- 复用现有 Next.js、Supabase、Vitest 和设计系统能力；
- 公开查询限制为 100 条，首版不实现分页或无限滚动；
- 先运行低成本聚焦测试、lint 和类型检查；
- 仅在最终验收阶段运行一次生产构建；
- 遇到命令失败、权限阻碍、环境异常或验证缺口时立即报告原因、影响和处理方式；
- 优先使用 F 盘与项目本地资源，不创建不必要的大型缓存。
