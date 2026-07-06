# Theodore — 个人仪表盘、博客与作品集

这是一个可自托管的个人网站，同时也是私有内容管理系统。公开站点用于展示你的文章、近期计划、作品集、收藏链接、相册和音乐；受保护的后台区域则供单一站点所有者统一管理这些内容。

A self-hosted personal website that doubles as a private content manager. The public site presents your writing, plans, portfolio, curated links, photo album, and music; a protected admin area lets a single owner manage all of it.

项目基于 Next.js App Router 和 Supabase 构建，并内置可切换的视觉主题系统，包括偏暖的编辑部风格主题。

> 这是一个开源个人网站模板。项目默认使用中性的占位内容，例如 “Your Name”。请通过后台和站点设置填写你的姓名、头衔、社交链接、关于页文本以及各类内容。

## 功能

- **仪表盘首页**：问候语、社交链接、时钟 / 日历组件、相册预览、近期计划、轮播推荐和音乐播放器。
- **近期计划**（`/plans`）：公开计划列表，支持分类、状态、优先级、进度和目标日期。
- **作品集**（`/works`）：展示个人项目，包含封面、截图、技术标签、状态和可见性设置。
- **收藏夹**（`/collections`）：整理外部文章和视频链接。
- **精选项目**（`/projects`）：展示值得分享的 GitHub 项目。
- **相册**（`/album`）：基于 Supabase Storage 的可拖拽照片板。
- **音乐**：上传 MP3，并选择首页当前播放曲目。
- **关于页**（`/about`）：在站点设置中使用 Markdown 编写个人介绍。
- **主题系统**：可在后台切换站点视觉主题。
- **后台管理**（`/admin`）：为单一管理员提供统一 CRUD 面板，覆盖以上所有内容，包括图片 / 音频上传、删除 / 恢复、首页布局编辑和主题选择。

## 技术栈

- **Next.js 16**（App Router）+ **React 19** + **TypeScript**
- **Supabase**：Auth（邮箱 / 密码）、PostgreSQL 和 Storage
- 服务端专用数据访问，并在每个请求中重新校验管理员身份
- **Vitest** 单元测试

## 前置要求

- **Node.js 20+** 和 npm
- 一个免费的 **Supabase** 账号（https://supabase.com），不需要本地 Docker

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local        # PowerShell: Copy-Item .env.example .env.local
# 然后填写四个环境变量，见下方 “Supabase 配置”

# 3. 启动开发服务器
npm run dev
```

打开 http://localhost:3000。数据库配置完成后，公开页面即可正常渲染；后台入口位于 `/admin`。

## Supabase 配置

本项目使用 Supabase 云端项目，免费额度即可。不需要 Docker。

### 1. 创建项目

在 https://supabase.com 创建一个新项目。项目就绪后，打开 **Project Settings → API**，把以下值复制到 `.env.local`：

| `.env.local` 变量 | 获取位置 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project API keys → publishable / anon key |
| `SUPABASE_SECRET_KEY` | Project API keys → secret / service_role key |

`SUPABASE_SECRET_KEY` 只能用于服务端，不能暴露给浏览器。

### 2. 执行数据库迁移

打开 Supabase 控制台中的 **SQL Editor**，按文件名顺序执行 `supabase/migrations/` 下的每个 SQL 文件。文件名前缀中的时间戳就是执行顺序。每次粘贴一个文件的内容并运行，然后继续下一个文件：

```txt
202606110001_private_server_access.sql
202606110002_recent_plans.sql
202606130001_site_settings_home_layout.sql
202606130002_fix_site_configuration_publish.sql
202606130003_works_management.sql
202606140001_collections_featured_projects.sql
202606140002_public_album_storage.sql
202606150001_media_upload_cleanup_reasons.sql
202606150002_media_upload_form_integrations.sql
202606160001_navigation_visibility.sql
202606220001_music_library.sql
202606220002_music_storage_mime.sql
202606230001_site_theme.sql
202606270001_about_content.sql
```

这些迁移会创建所需表结构、启用 Row Level Security、撤销浏览器角色对后台表的直接访问权限、创建公开的 `public-media` Storage bucket（供相册、图片上传和音乐使用），并加入主题设置。

### 3. 创建管理员

本网站只支持一个管理员，并且默认关闭公开注册。

1. 在 Supabase 中进入 **Authentication → Users → Add user**，用邮箱和密码创建管理员账号。
2. 复制该用户的 **User UID**，并写入 `.env.local` 的 `ADMIN_USER_ID`。

修改 `.env.local` 后，重启 `npm run dev`，然后访问 `/admin` 登录。

## 常用脚本

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run start    # 启动生产构建
npm run lint     # ESLint 检查
npm test         # Vitest 单元测试
```

## 项目结构

- `src/app/`：App Router 路由、布局和全局 CSS 入口。
- `src/components/`：共享组件，包括 `chrome/`（导航和页面工具）、`home/`、`ui/`，以及按业务域划分的后台组件（包括 `admin/music/` 和后台外壳）。
- `src/lib/`：服务端专用业务域和仓储层，包括 `auth`、`supabase`、`plans`、`works`、`collections`、`featured-projects`、`photos`、`media`、`music`、`site-settings`、`navigation`、`admin`。
- `src/data/site-content.ts`：类型化的静态展示内容和导航数据。
- `src/styles/design-tokens.css`：设计系统的颜色、排版、间距、圆角、阴影和动效来源。
- `supabase/migrations/`：按顺序执行的 SQL 迁移文件。

完整的项目结构、设计系统规则、组件约定和安全边界见 `AGENTS.md`。

## 安全模型

本项目面向单一站点所有者，安全设计为中等强度，目标不是企业级多租户系统：

- 登录和密码找回由 Supabase Auth 负责；公开注册默认关闭。
- 每个受保护页面和后台写操作都会在服务端重新校验管理员身份。
- `SUPABASE_SECRET_KEY` 和 `ADMIN_USER_ID` 必须只保存在服务端环境变量中。
- 后台表启用 RLS，并拒绝 `anon` / `authenticated` 浏览器角色直接访问；公开数据由 Next.js 服务端代码读取并过滤。
- `.env.local` 已被 Git 忽略，绝不能提交真实密钥。

## 部署

可以部署到支持 Next.js 的托管平台。部署时需要在托管平台的项目设置中配置与本地相同的四个环境变量，并指向已经执行过迁移的同一个 Supabase 项目。

如果部署到 Cloudflare Workers，请使用 OpenNext for Cloudflare 适配流程，并在 Cloudflare 控制台中同时配置构建阶段和运行时所需的环境变量 / Secrets。
