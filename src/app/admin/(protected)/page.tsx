import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">ADMINISTRATOR WORKSPACE</p>
          <h1>网站管理</h1>
          <p className="muted">内容、展示和媒体现在集中在同一个工作区。</p>
        </div>
      </header>
      <section className="admin-overview-grid">
        <div className="admin-panel admin-overview-primary">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">CONTENT</p>
              <h2>内容管理</h2>
            </div>
            <span className="pill mono">6 MODULES</span>
          </div>
          <div className="admin-module-grid">
            <Link href="/admin/plans"><strong>近日规划</strong><span>维护公开计划与进度</span></Link>
            <Link href="/admin/works"><strong>我的作品</strong><span>管理作品内容和封面</span></Link>
            <Link href="/admin/collections"><strong>内容收藏</strong><span>整理收藏条目与分类</span></Link>
            <Link href="/admin/projects"><strong>优秀项目</strong><span>编辑精选项目展示</span></Link>
            <Link href="/admin/photos"><strong>公开相册</strong><span>管理相册图片与排序</span></Link>
            <Link href="/admin/music"><strong>音乐库</strong><span>上传并切换首页音乐</span></Link>
          </div>
        </div>

        <div className="admin-overview-stack">
          <div className="admin-panel">
            <p className="eyebrow">SETTINGS</p>
            <h2>网站设置</h2>
            <p className="muted">统一调整主题、首页模块、导航和站点资料。</p>
            <Link className="admin-text-link" href="/admin/settings">打开网站设置</Link>
          </div>
          <div className="admin-panel admin-dev-tools">
            <p className="eyebrow">DEVELOPMENT TOOLS</p>
            <h2>开发工具</h2>
            <p className="muted">仅用于验证媒体上传链路，不属于日常内容维护。</p>
            <Link className="admin-text-link" href="/admin/media/test">打开媒体测试</Link>
          </div>
          <div className="admin-overview-note">
            <strong>管理员会话已验证</strong>
            <span>所有写入仍通过服务器端管理员权限执行。</span>
          </div>
        </div>
      </section>
    </main>
  );
}
