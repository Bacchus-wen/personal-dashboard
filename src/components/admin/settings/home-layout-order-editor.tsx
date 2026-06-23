"use client";

import { HOME_MODULES } from "@/lib/site-settings/defaults";
import {
  normalizeHomeLayoutOrder,
  setModuleVisibility,
} from "@/lib/site-settings/layout";
import type {
  HomeLayoutItem,
  ModuleVisibility,
  SiteConfigurationFieldErrors,
} from "@/lib/site-settings/types";

type Props = {
  layout: HomeLayoutItem[];
  visibility: ModuleVisibility;
  errors: SiteConfigurationFieldErrors;
  onLayoutChange: (layout: HomeLayoutItem[]) => void;
  onVisibilityChange: (visibility: ModuleVisibility) => void;
  onRestoreDefaults: () => void;
};

export function HomeLayoutOrderEditor({
  layout,
  visibility,
  errors,
  onLayoutChange,
  onVisibilityChange,
  onRestoreDefaults,
}: Props) {
  function updateVisibility(
    moduleId: HomeLayoutItem["moduleId"],
    enabled: boolean,
  ) {
    const nextVisibility = setModuleVisibility(visibility, moduleId, enabled);
    onVisibilityChange(nextVisibility);
    onLayoutChange(normalizeHomeLayoutOrder(layout, nextVisibility));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= layout.length) return;
    const nextLayout = [...layout];
    [nextLayout[index], nextLayout[targetIndex]] = [
      nextLayout[targetIndex],
      nextLayout[index],
    ];
    onLayoutChange(normalizeHomeLayoutOrder(nextLayout, visibility));
  }

  return (
    <section className="settings-panel glass">
      <div className="settings-panel-head">
        <div>
          <h2>首页布局</h2>
          <p className="muted">
            选择首页模块是否显示，并调整公开首页的阅读顺序。
          </p>
        </div>
        <button className="btn" type="button" onClick={onRestoreDefaults}>
          恢复默认
        </button>
      </div>
      {errors.layout || errors.moduleVisibility ? (
        <p className="admin-notice error">
          {errors.layout?.[0] ?? errors.moduleVisibility?.[0]}
        </p>
      ) : null}
      <div className="layout-order-list">
        {layout.map((item, index) => {
          const definition = HOME_MODULES.find(
            (entry) => entry.id === item.moduleId,
          )!;
          return (
            <article
              className={`layout-order-row ${
                visibility[item.moduleId] ? "" : "is-disabled"
              }`}
              key={item.moduleId}
            >
              <label className="settings-check">
                <input
                  type="checkbox"
                  checked={visibility[item.moduleId]}
                  disabled={definition.core}
                  onChange={(event) =>
                    updateVisibility(item.moduleId, event.target.checked)
                  }
                />
                <span>
                  <strong>{definition.label}</strong>
                  {definition.core ? <small>核心模块</small> : null}
                </span>
              </label>
              <div className="layout-order-actions">
                <button
                  className="btn"
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                >
                  上移
                </button>
                <button
                  className="btn"
                  type="button"
                  disabled={index === layout.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  下移
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
