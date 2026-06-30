"use client";

import { ThemeSelect } from "@/components/ui/theme-select";
import type {
  SiteConfigurationFieldErrors,
  SocialLinkInput,
} from "@/lib/site-settings/types";

type Props = {
  links: SocialLinkInput[];
  errors: SiteConfigurationFieldErrors;
  onChange: (links: SocialLinkInput[]) => void;
};

const platforms = [
  "github",
  "xiaohongshu",
  "bilibili",
  "twitter",
  "email",
  "youtube",
  "link",
];

function withPositions(links: SocialLinkInput[]) {
  return links.map((link, position) => ({ ...link, position }));
}

export function SocialLinksEditor({ links, errors, onChange }: Props) {
  function update(id: string, values: Partial<SocialLinkInput>) {
    onChange(
      links.map((link) => (link.id === id ? { ...link, ...values } : link)),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(withPositions(next));
  }

  function remove(link: SocialLinkInput) {
    if (!window.confirm(`确认删除“${link.label || "未命名链接"}”吗？`)) return;
    onChange(withPositions(links.filter((item) => item.id !== link.id)));
  }

  function add() {
    onChange([
      ...links,
      {
        id: crypto.randomUUID(),
        platform: "link",
        label: "新链接",
        href: "https://",
        position: links.length,
        enabled: true,
      },
    ]);
  }

  return (
    <section className="settings-panel glass">
      <div className="settings-panel-head">
        <div>
          <h2>社交链接</h2>
          <p className="muted">启用的链接会按照当前顺序显示在首页。</p>
        </div>
        <button className="btn primary" type="button" onClick={add}>
          新增链接
        </button>
      </div>
      {errors.socialLinks ? (
        <p className="admin-notice error">{errors.socialLinks[0]}</p>
      ) : null}
      <div className="social-link-editor-list">
        {links.map((link, index) => (
          <article className="social-link-editor-row" key={link.id}>
            <label>
              <span>平台</span>
              <ThemeSelect
                ariaLabel="平台"
                value={link.platform}
                onChange={(value) => update(link.id, { platform: value })}
                options={platforms.map((platform) => ({ value: platform, label: platform }))}
              />
            </label>
            <label>
              <span>显示名称</span>
              <input
                value={link.label}
                onChange={(event) =>
                  update(link.id, { label: event.target.value })
                }
              />
            </label>
            <label className="social-link-href">
              <span>链接</span>
              <input
                value={link.href}
                onChange={(event) =>
                  update(link.id, { href: event.target.value })
                }
              />
            </label>
            <label className="settings-check">
              <input
                type="checkbox"
                checked={link.enabled}
                onChange={(event) =>
                  update(link.id, { enabled: event.target.checked })
                }
              />
              启用
            </label>
            <div className="social-link-row-actions">
              <button
                className="btn"
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={`上移 ${link.label}`}
              >
                ↑
              </button>
              <button
                className="btn"
                type="button"
                disabled={index === links.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`下移 ${link.label}`}
              >
                ↓
              </button>
              <button
                className="btn danger"
                type="button"
                onClick={() => remove(link)}
              >
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
