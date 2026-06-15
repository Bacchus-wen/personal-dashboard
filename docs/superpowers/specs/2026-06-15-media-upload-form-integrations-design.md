# Flow 5B-2 Media Upload Form Integrations Design

## 背景

Flow 5B-1 已提供受保护的通用媒体上传、删除、路径校验、Storage
清理任务和 `MediaUploadField`。Flow 5B-2 将这些能力接入现有业务表单，并补齐
替换旧图、永久删除关联图片和 Featured Projects 封面数据链路。

本流程不改变 Flow 5B-1 的安全边界：浏览器不能直接写 Storage，所有上传和
删除仍须经过重新验证管理员身份的服务端接口。

## 目标

- 在站点设置中接入头像和 favicon 上传；
- 在 Works 中接入封面、SEO 图片和多张截图上传；
- 在 Collections 中接入封面上传；
- 为 Featured Projects 新增封面字段并接入上传与公共展示；
- 保留现有项目本地路径和 HTTPS URL 手动输入能力；
- 业务保存成功后删除被替换或清除的旧系统图片；
- 永久删除业务记录时删除关联系统图片；
- 图片删除失败时写入 `storage_cleanup_tasks`，不阻止业务记录永久删除。

## 非目标

- 不新增通用媒体资产表；
- 不引入临时上传表、定时清理任务或后台 worker；
- 不允许新建 Works、Collections 或 Featured Projects 时在获得真实记录 ID
  前上传；
- 不自动保存整个业务表单；
- 不自动删除 HTTPS URL 或项目本地路径；
- 不在移入回收站时删除图片；
- 不安装新依赖。

## 表单交互

### 通用呈现

现有图片路径输入框继续保留。每个图片字段下方增加紧凑的上传或替换控件与
小预览，不使用占据大量纵向空间的完整测试页拖放区域，也不增加弹窗。

系统生成路径、项目本地路径和 HTTPS URL 均尝试显示预览。预览加载失败时显示
占位和当前路径，不能阻止手动保存该路径。

上传成功只更新当前表单字段和预览，并将表单标记为未保存；业务记录只有在用户
点击现有保存按钮后才会更新。

### 新建记录

Works、Collections 和 Featured Projects 的系统图片路径包含真实业务记录 ID。
因此新建页面不显示可用上传控件，只显示“首次保存后可上传图片”的简短提示。

首次保存成功后，页面进入对应记录的编辑页；上传控件在编辑页获得真实 ID 后
开放。站点设置不依赖业务记录 ID，可以直接上传。

### 同一编辑会话中的未保存图片

如果同一个单值图片字段在保存前再次上传，客户端先尝试删除上一次在本次编辑
会话中上传、但尚未保存的新系统图片，再填入新的路径。

直接关闭或离开页面可能留下少量未引用对象。本流程不增加临时表或后台自动清理
机制；这些对象可通过现有媒体测试和清理工具手动处理。

## 业务接入

### 站点设置

接入：

```text
site_settings.avatar_path
site_settings.favicon_path
```

头像和 favicon 上传成功后分别填入 `avatarPath` 和 `faviconPath`。保存成功后，
公共头像和根布局 Metadata favicon 使用新路径。

### Works

接入：

```text
works.cover_path
works.seo_image_path
work_screenshots.image_path
```

Works 编辑页提供封面和 SEO 图片的紧凑上传控件。截图支持一次选择多张图片，
按选择顺序追加到现有截图列表，并继续使用现有 caption、排序和删除操作。

批量截图中部分文件失败时，保留并追加成功项，明确显示失败项；不撤销整个批次。

### Collections

接入：

```text
collections.cover_path
```

编辑页提供封面上传。上传成功后更新表单预览；保存后公共 Collections 卡片使用
新封面。

### Featured Projects

新增：

```text
featured_projects.cover_path
```

通过安全 migration 增加可空 `cover_path`，允许项目本地路径或 HTTPS URL。
更新 Featured Project 类型、校验、repository、管理表单预览、公共卡片和永久
删除链路。

## 替换、清除与删除

### 保存时替换旧图

业务保存操作在写数据库前读取原记录中的图片路径。数据库保存成功后，对比旧值
和新值：

- 旧值是系统生成路径且已被替换或清除时，尝试删除旧对象；
- 旧值是 HTTPS URL 或项目本地路径时，不删除；
- 新旧路径相同时，不删除；
- 删除失败时写入 `storage_cleanup_tasks`，业务保存仍返回成功；
- 数据库保存失败时，不删除旧对象。

点击“清除图片”只清空表单字段。只有业务保存成功后才按上述规则删除旧系统
图片。

Works 截图保存时对比原截图路径集合和新截图路径集合，删除不再引用的旧系统
截图。新添加但尚未保存的截图在同一编辑会话中被移除时，客户端尝试立即删除。

### 回收站与永久删除

移入回收站不删除任何图片。

永久删除 Works、Collections 或 Featured Projects 时：

1. 先读取待删除的完整业务记录及关联图片路径；
2. 永久删除业务数据库记录；
3. 尝试删除所有关联系统图片；
4. 单个图片删除失败时写入 cleanup task，并继续处理其他图片；
5. 图片清理失败不恢复已经永久删除的业务记录。

站点设置没有永久删除流程。

## 数据与服务边界

- Featured Projects migration 只增加 `cover_path`，不重建表；
- 数据库 repository 负责读取和保存业务数据，不直接操作 Storage；
- domain action service 负责比较旧值和新值，并协调数据库保存或永久删除后的
  Storage 清理；
- 复用 Flow 5B-1 的系统路径判断和服务端媒体删除能力；
- 所有业务写操作仍通过现有 `requireAdmin()` 和服务端 Supabase client；
- 错误信息不得包含密钥、管理员 ID、会话、headers 或原始敏感错误。

## 验收标准

### 本地自动验证

- 站点设置头像和 favicon 上传能填入表单、保存并更新公共页面；
- Works 封面、SEO 图片和批量截图上传能填入并保存；
- Collections 封面上传能填入、预览并保存；
- Featured Projects `cover_path` 完整贯通 migration、类型、repository、表单和
  公共卡片；
- 新建 Works、Collections 和 Featured Projects 只显示首次保存提示；
- 保存成功后被替换或清除的旧系统图片被删除或进入 cleanup task；
- HTTPS URL 和项目本地路径不会被自动删除；
- 移入回收站不删除图片；
- 永久删除业务记录会删除关联图片或写 cleanup task；
- 桌面、平板和约 320px 宽度下不横向溢出。

### 真实服务与浏览器验收

- 在真实 Supabase 执行并验证 Featured Projects migration；
- 管理员可完成站点设置、Works、Collections 和 Featured Projects 上传、保存、
  替换、清除和永久删除流程；
- 公共页面和 favicon 使用保存后的图片；
- Storage 中被替换或永久删除的对象消失，失败时出现 cleanup task；
- 未登录和非管理员仍不能上传或删除；
- 浏览器角色仍不能直接写 `public-media`。

## 实施约束

- 开发前编写详细实施计划；
- 使用独立 Git worktree；
- 不读取或展示 `.env.local` 内容；
- 不安装依赖、CLI 或创建大型缓存；
- 使用低成本聚焦测试推进，最终只运行一次生产构建；
- 命令异常耗时、异常消耗或遇到阻碍时立即停止并报告；
- 完成前运行：

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build -- --webpack
git diff --check
```
