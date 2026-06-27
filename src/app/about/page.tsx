import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { PageShell } from "@/components/chrome/page-shell";
import { cloneDefaultSiteConfiguration } from "@/lib/site-settings/defaults";
import { getSiteSettingsRepository } from "@/lib/site-settings/server-repository";

export const metadata: Metadata = { title: "关于网站" };

export default async function AboutPage() {
  const configuration = await getSiteSettingsRepository()
    .getPublished()
    .catch(() => cloneDefaultSiteConfiguration());

  const { displayName, statusText, siteDescription, aboutBody } =
    configuration.settings;

  return (
    <PageShell
      eyebrow="THEODORE'S SPACE"
      title={displayName.toUpperCase()}
      description={siteDescription}
    >
      <section className="about-editorial">
        <aside className="about-identity glass">
          <div className="about-avatar-mark">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <p className="eyebrow">PROFILE NOTE</p>
          <h2>{displayName}</h2>
          <p className="status">{statusText}</p>
          <p className="about-signature">Build slowly, notice carefully.</p>
        </aside>

        <article className="about-card glass">
          {aboutBody ? (
            <div className="about-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aboutBody}
              </ReactMarkdown>
            </div>
          ) : (
            <>
              <h2>
                <span className="hash">#</span> Hi! I&apos;m {displayName}
              </h2>
              <ul className="about-list">
                <li>我喜欢设计、代码，以及把复杂的东西整理得更清楚。</li>
                <li>这个网站用于保存近期作品、阅读记录和生活切片。</li>
                <li>目前仍在持续搭建，内容会慢慢长出来。</li>
                <li>欢迎通过首页中的社交链接联系我。</li>
              </ul>
              <blockquote className="quote-box">
                “保持好奇，也给想法留一点生长的时间。”
                <br />
                <br />
                “Build slowly, notice carefully.”
              </blockquote>
              <p>对网站有任何建议，可以在 GitHub 留言，或从首页找到我。</p>
            </>
          )}
        </article>
      </section>
    </PageShell>
  );
}
