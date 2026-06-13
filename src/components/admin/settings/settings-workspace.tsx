"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { publishSiteConfigurationAction } from "@/app/admin/(protected)/settings/actions";
import {
  restoreDefaultLayout,
  restoreDefaultVisibility,
} from "@/lib/site-settings/layout";
import { HomeLayoutEditor } from "./home-layout-editor";
import { SiteSettingsForm } from "./site-settings-form";
import { SocialLinksEditor } from "./social-links-editor";
import { ThemePlaceholder } from "./theme-placeholder";
import type {
  PublishedSiteConfiguration,
  SiteConfigurationActionResult,
} from "@/lib/site-settings/types";

type TabId = "site" | "socials" | "layout" | "theme";

const tabs: { id: TabId; label: string }[] = [
  { id: "site", label: "网站设置" },
  { id: "socials", label: "社交链接" },
  { id: "layout", label: "首页布局" },
  { id: "theme", label: "主题修改" },
];

const initialResult: SiteConfigurationActionResult = {
  ok: true,
  message: "",
};

export function SettingsWorkspace({
  initialConfiguration,
}: {
  initialConfiguration: PublishedSiteConfiguration;
}) {
  const [baseline, setBaseline] = useState(() =>
    structuredClone(initialConfiguration),
  );
  const [draft, setDraft] = useState(() =>
    structuredClone(initialConfiguration),
  );
  const [activeTab, setActiveTab] = useState<TabId>("site");
  const [result, setResult] = useState(initialResult);
  const [isPending, startTransition] = useTransition();
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(baseline),
    [baseline, draft],
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function confirmLeave(event: React.MouseEvent<HTMLAnchorElement>) {
    if (dirty && !window.confirm("当前修改尚未发布，确认放弃修改吗？")) {
      event.preventDefault();
    }
  }

  function publish() {
    setResult(initialResult);
    startTransition(async () => {
      const nextResult = await publishSiteConfigurationAction(draft);
      setResult(nextResult);
      if (nextResult.ok) setBaseline(structuredClone(draft));
    });
  }

  return (
    <main className="admin-workspace settings-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">SITE SETTINGS</p>
          <h1>网站设置与首页布局</h1>
          <p className="muted">修改仅在点击“保存并发布”后影响公开首页。</p>
        </div>
        <div className="admin-workspace-actions">
          <Link className="btn" href="/admin" onClick={confirmLeave}>
            返回后台
          </Link>
          <Link className="btn" href="/" onClick={confirmLeave}>
            查看首页
          </Link>
          <button
            className="btn primary"
            type="button"
            disabled={isPending || !dirty}
            onClick={publish}
          >
            {isPending ? "发布中…" : "保存并发布"}
          </button>
        </div>
      </header>
      {result.message ? (
        <p className={`admin-notice ${result.ok ? "success brief" : "error"}`}>
          {result.message}
        </p>
      ) : null}
      <nav className="settings-tabs" aria-label="网站设置标签页">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "active" : ""}
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === "site" ? (
        <SiteSettingsForm
          settings={draft.settings}
          errors={result.fieldErrors ?? {}}
          onChange={(settings) => setDraft({ ...draft, settings })}
        />
      ) : null}
      {activeTab === "socials" ? (
        <SocialLinksEditor
          links={draft.socialLinks}
          errors={result.fieldErrors ?? {}}
          onChange={(socialLinks) => setDraft({ ...draft, socialLinks })}
        />
      ) : null}
      {activeTab === "layout" ? (
        <HomeLayoutEditor
          layout={draft.layout}
          visibility={draft.settings.moduleVisibility}
          errors={result.fieldErrors ?? {}}
          onLayoutChange={(layout) => setDraft({ ...draft, layout })}
          onVisibilityChange={(moduleVisibility) =>
            setDraft({
              ...draft,
              settings: { ...draft.settings, moduleVisibility },
            })
          }
          onRestoreDefaults={() =>
            setDraft({
              ...draft,
              layout: restoreDefaultLayout(),
              settings: {
                ...draft.settings,
                moduleVisibility: restoreDefaultVisibility(),
              },
            })
          }
        />
      ) : null}
      {activeTab === "theme" ? <ThemePlaceholder /> : null}
    </main>
  );
}
