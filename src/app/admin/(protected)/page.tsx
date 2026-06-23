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
      <section className="admin-overview glass">
        <div>
          <p className="eyebrow">CONTROL CENTER</p>
          <h2>选择一个管理模块开始</h2>
          <p className="muted">
            使用侧边导航维护近日规划、作品、收藏、项目、相册和音乐；网站外观与首页布局统一在网站设置中调整。
          </p>
        </div>
        <div className="admin-overview-note">
          <strong>管理员会话已验证</strong>
          <span>所有写入仍通过服务器端管理员权限执行。</span>
        </div>
      </section>
    </main>
  );
}
