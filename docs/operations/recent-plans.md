# 近日规划数据库操作说明

近日规划业务表只允许 Next.js 服务端访问。浏览器中的匿名用户和已登录用户都不能直接读取或写入这些表。

本项目不要求安装 Docker、Supabase CLI 或其他数据库工具。迁移通过 Supabase Dashboard 的 SQL Editor 执行。

## 应用迁移前

1. 确认当前 Supabase 项目正确。
2. 重要数据上线后，在执行破坏性迁移前先导出备份。
3. 打开项目中的完整迁移文件：
   `supabase/migrations/202606110002_recent_plans.sql`。
4. 确认文件只创建或修改以下对象：
   - `plan_status`
   - `plan_visibility`
   - `plan_priority`
   - `plan_categories`
   - `plans`
   - `set_recent_plans_updated_at`

## 使用 SQL Editor 应用迁移

1. 打开 Supabase Dashboard。
2. 进入 **SQL Editor**。
3. 点击 **New query**。
4. 复制 `supabase/migrations/202606110002_recent_plans.sql` 的全部内容。
5. 粘贴到编辑器。
6. 点击 **Run**。
7. 确认结果显示成功，不要重复运行同一迁移。

迁移完成后，在 Table Editor 中确认：

- `plan_categories` 表存在。
- `plans` 表存在。
- 两张表都已启用 RLS。
- `plans.category_id` 删除分类后会自动变为 `null`。

## 权限验证

最终验收需要验证：

- 使用 publishable key 的匿名客户端不能读取或写入两张表。
- 已登录的普通浏览器角色不能读取或写入两张表。
- 使用 `SUPABASE_SECRET_KEY` 的 Next.js 服务端可以创建、读取、更新和删除测试记录。
- 测试记录在验证后被删除。

只记录成功或失败结果。不要把密钥、用户 ID、项目 URL、会话令牌或私密内容写入文档。

## 日常操作

近日规划后台完成后，站长可执行：

- 创建草稿。
- 将完整规划设置为私密或公开。
- 修改状态、进度、优先级、截止日期、分类和关联链接。
- 将规划移入回收站。
- 从回收站恢复为草稿。
- 二次确认后永久删除。

分类被删除时，相关规划会自动变为“未分类”。

## 故障判断

- 公开页面显示“规划暂时无法加载”：先检查 Supabase 服务状态和 Vercel 环境变量，不要把错误误认为空规划。
- 后台保存失败：保留当前页面内容，确认管理员会话仍有效，再检查服务端日志。
- 浏览器可以直接查询规划表：权限边界失效，应立即检查 RLS、表权限和部署密钥。
- Secret Key 暴露：立即轮换密钥、更新本地和 Vercel 环境变量，并重新部署。

## 回滚迁移

只有在确认不需要保留任何规划与分类数据时，才允许执行以下回滚。此操作会永久删除全部近日规划数据：

```sql
drop trigger if exists set_plans_updated_at on public.plans;
drop trigger if exists set_plan_categories_updated_at on public.plan_categories;
drop table if exists public.plans;
drop table if exists public.plan_categories;
drop function if exists public.set_recent_plans_updated_at();
drop type if exists public.plan_priority;
drop type if exists public.plan_visibility;
drop type if exists public.plan_status;
```

不要因为回滚云端数据库而删除 Git 中的迁移文件。迁移文件用于记录数据库历史和安全边界。

## 2026-06-12 云端权限验证结果

使用项目现有 `.env.local` 和 Supabase SDK 进行了真实云端验证。命令只输出 PASS/FAIL，没有输出项目 URL、密钥、用户 ID、令牌或测试内容。

- publishable key 匿名读取 `plans`：PASS，访问被拒绝。
- publishable key 匿名写入 `plans`：PASS，访问被拒绝。
- Secret Key 创建临时草稿：PASS。
- Secret Key 读取临时草稿：PASS。
- Secret Key 更新临时草稿：PASS。
- Secret Key 删除临时草稿：PASS，测试数据已清理。
- 已登录普通浏览器角色：迁移 SQL 已撤销 `authenticated` 权限；本次没有普通用户会话令牌，因此尚未进行真实会话验证。

## 内容管理流程

1. 登录 `/admin/login`，进入 `/admin/plans`。
2. 点击“新建规划”，可以先以草稿保存不完整内容。
3. 私密或公开规划必须填写标题和简短描述。
4. 将规划设为公开后，它会出现在 `/plans`；符合首页规则的规划也会出现在首页近日规划卡片。
5. 将公开规划改为私密或草稿后，它会立即从公开页面和首页候选中移除。
6. 分类可以在后台规划列表的“管理分类”中新增、重命名或删除；删除分类不会删除相关规划。
7. 移入回收站后，规划不会出现在公开页面；恢复时会自动改为草稿。
8. 永久删除无法恢复，操作前应确认该内容不再需要。

## 后续数据库变更检查

每次新增或修改规划相关表后，都必须重新确认：

- RLS 已启用；
- `anon` 和 `authenticated` 的直接表权限已撤销；
- 只有 `service_role`/Secret Key 可以执行服务端操作；
- 公开查询仍在 Next.js 服务端限制 `visibility`、`status` 和 `deleted_at`；
- 破坏性迁移前已备份需要保留的数据。
