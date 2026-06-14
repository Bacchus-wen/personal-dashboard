# Flow 5B Media Upload Design

## 背景

Flow 5A 已建立公开 `public-media` Storage 桶、服务端上传边界、Storage 清理任务和公开相册图片处理能力。Flow 5B 在此基础上扩展为通用业务图片上传能力，覆盖头像、favicon、作品图片、收藏封面和项目封面。

本规格只定义设计和实施边界。开始实现前必须再写实施计划。

## 目标

- 为站点设置、作品、收藏和优秀项目提供可复用图片上传能力；
- 复用 `public-media`，不新增私有桶；
- 保留现有路径或 HTTPS URL 手动输入能力；
- 让上传后的路径自动填入现有业务字段并即时预览；
- 继续使用管理员服务端验证边界；
- 通过真实 Supabase 和外部浏览器验收。

## 非目标

- 不建设媒体库；
- 不新增通用 `media_assets` 表；
- 不支持浏览器直传 Storage；
- 不支持签名 URL 或私有图片访问；
- 不为每张上传图新增 alt/caption 数据表；
- 不自动生成多尺寸 favicon；
- 不安装新依赖。

## 拆分方式

Flow 5B 使用一个统一设计规格，拆成两个实现 PR：

1. **5B-1 shared media upload foundation**
   - 通用上传和删除 API；
   - 通用图片处理和上传组件；
   - 管理员内部测试页；
   - 通用 Storage 路径、清理和安全校验；
   - 真实 Supabase 验收。

2. **5B-2 media upload form integrations**
   - 站点设置头像和 favicon；
   - Works 封面、SEO 图和截图；
   - Collections 封面；
   - Featured Projects 封面；
   - 永久删除业务记录时删除关联系统图片。

## Storage 策略

继续使用公开桶：

```text
public-media
```

所有上传图片都公开可访问。原因是头像、favicon、作品图、收藏封面和项目封面最终都用于公开页面展示。浏览器仍不能直接写入 Storage，所有写入必须经过受保护 Route Handler。

允许路径前缀：

```text
site/avatar/<uuid>.webp
site/favicon/<uuid>.<ico|png|svg>
works/<work-id>/cover/<uuid>.webp
works/<work-id>/seo/<uuid>.webp
works/<work-id>/screenshots/<uuid>.webp
collections/<collection-id>/cover/<uuid>.webp
projects/<project-id>/cover/<uuid>.webp
test/<uuid>.<webp|ico|png|svg>
```

公开 URL 不保留原文件名。路径只由服务端生成，浏览器不能传最终 Storage path。

## 文件处理规则

- 除 favicon 外，所有上传统一转 WebP；
- favicon 允许 `.ico`、`.png`、`.svg`，不强制转 WebP；
- 原图大小限制为 10 MB；
- WebP 图片最大边长为 2560 px；
- 头像裁成正方形 WebP；
- 作品封面按 `16:10` 预览和展示；
- 作品截图允许多张，保持原比例；
- Collections 封面使用横向封面并由 CSS 裁切；
- Featured Projects 支持项目封面图，不新增 logo 字段；
- 上传并发为 2。

## 数据模型

不新增通用媒体表。上传结果直接写入现有业务字段：

```text
site_settings.avatar_path
site_settings.favicon_path
works.cover_path
works.seo_image_path
work_screenshots.image_path
collections.cover_path
featured_projects.cover_path
```

Flow 5B 可能需要新增 migration 扩展 `storage_cleanup_tasks.reason` 允许值：

```text
create_rollback
replace_old_file
delete_asset_file
```

如果 PostgreSQL check constraint 需要变更，migration 必须使用安全的 `drop constraint` / `add constraint` 方式，不重建表，不删除既有 cleanup 记录。

## 安全边界

- 所有上传和删除 API 每次重新验证管理员；
- 服务端使用 server-only Supabase client 写 Storage；
- 浏览器只提交文件、用途和受限元数据；
- API 返回值只包含 `ok`、`message`、`path` 和 `publicUrl`；
- 错误消息不得包含 token、headers、session、管理员 ID、密钥、完整堆栈或 Supabase 原始敏感错误；
- `anon` 和 `authenticated` 角色不能直接写 Storage；
- 不修改 Flow 5A 已验证的照片表权限边界。

## 5B-1 API

新增受保护 Route Handler：

```text
POST /api/admin/media/upload
POST /api/admin/media/delete
```

`upload` 接收：

```text
file
purpose
ownerId?
variant?
```

允许的 `purpose`：

```text
site
works
collections
projects
test
```

服务端校验：

- 用户必须是管理员；
- `purpose` 和 `variant` 必须在白名单；
- WebP 必须通过结构校验；
- favicon 只允许 `ico`、`png`、`svg`；
- 文件大小必须在允许范围；
- 系统生成的路径必须匹配允许前缀；
- 上传失败不得创建伪成功响应。

`delete` 只允许删除 `public-media` 内本系统生成路径。删除失败写入 cleanup task。

## 5B-1 组件

新增可复用上传组件，例如：

```text
MediaUploadField
```

能力：

- 点击选择和拖放；
- 当前图片预览；
- 上传中、成功、失败状态；
- 上传成功后自动填入对应表单字段；
- 不自动保存整个业务表单；
- 保留手动路径和 HTTPS 输入；
- 头像圆形预览；
- favicon 小图标预览；
- 封面横向预览；
- 截图支持多项追加。

## 5B-1 测试页

新增管理员内部测试页：

```text
/admin/media/test
```

页面不进入公开导航。它用于验证：

- WebP 上传；
- favicon 上传；
- 点击选择和拖放；
- 上传结果 path 和 publicUrl；
- 删除对象；
- 删除失败后的 cleanup task；
- 权限边界；
- 真实 Supabase Storage 行为。

## 5B-2 业务接入

### 站点设置

接入：

```text
avatarPath
faviconPath
```

头像上传后自动填入 `avatarPath`。favicon 上传后自动填入 `faviconPath`。保存站点设置后，公开首页头像和 `<link rel="icon">` 使用新路径。

### Works

接入：

```text
coverPath
seoImagePath
screenshots[].imagePath
```

封面上传后自动填入 `coverPath`。SEO 图上传后自动填入 `seoImagePath`。截图上传支持追加多张，继续使用现有 caption 和排序。公开 `/works` 与 `/works/[slug]` 使用上传图展示。

### Collections

接入：

```text
coverPath
```

封面上传后自动填入 `coverPath`。公开 `/collections` 卡片显示上传封面。

### Featured Projects

接入：

```text
coverPath
```

项目封面上传后自动填入 `coverPath`。公开 `/projects` 卡片显示上传封面。

## 替换与删除规则

- 上传新图只返回新路径；
- 业务表单保存成功后，如果字段从旧的系统生成 path 变成新 path，尝试删除旧图；
- 如果旧值是 HTTPS URL 或项目本地路径，不删除；
- 删除失败写入 cleanup task；
- 如果表单保存失败，新上传图暂时成为未引用对象，5B-1 测试页和 cleanup 页面可手动清理；
- 移入回收站不删除图片；
- 永久删除业务记录时删除关联系统图片；
- 删除业务记录失败不得伪装成图片清理成功。

## 验收标准

### 5B-1

- 未登录访问 API 返回 `401`；
- 非管理员访问 API 返回 `403`；
- 非法 purpose 或 variant 被拒绝；
- 非法 MIME、空文件和超限文件被拒绝；
- WebP 结构校验有效；
- favicon 格式白名单有效；
- 成功上传返回公开 URL；
- 删除成功移除对象；
- 删除失败写 cleanup task；
- 真实 Supabase 中浏览器角色仍不能直接写 Storage；
- 管理员测试页可完成 WebP、favicon、删除和 cleanup 验收。

### 5B-2

- 站点设置头像和 favicon 上传、保存、公开页面生效；
- Works 封面、SEO 图和截图上传、保存、公开页面生效；
- Collections 封面上传、保存、公开页面生效；
- Featured Projects 封面上传、保存、公开页面生效；
- 手动 HTTPS URL 和项目本地路径仍可保存；
- 替换系统生成旧图后，旧图被删除或进入 cleanup task；
- 移入回收站不删除图片；
- 永久删除业务记录时删除关联系统图片；
- 未登录和非管理员不能上传；
- 浏览器角色不能直接写 Storage；
- 桌面、平板和约 320px 宽度下上传控件和预览不横向溢出。

## 实施约束

- 不安装新依赖；
- 不使用 Docker；
- 不读取或展示 `.env.local` 内容；
- 不提交密钥、管理员 ID 或会话信息；
- 大范围实现前先写实施计划；
- 每个 PR 完成前运行：

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build -- --webpack
git diff --check
```

外部浏览器验收是完成条件；如果 Codex 内置浏览器不可用，由用户使用外部浏览器反馈。
