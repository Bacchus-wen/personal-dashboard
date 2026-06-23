"use client";

import { useRef } from "react";

import { HOME_GRID, HOME_MODULES } from "@/lib/site-settings/defaults";
import {
  moveLayoutItem,
  setModuleVisibility,
  snapToGrid,
} from "@/lib/site-settings/layout";
import type {
  HomeLayoutItem,
  HomeModuleId,
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

type DragState = {
  moduleId: HomeModuleId;
  offsetX: number;
  offsetY: number;
};

export function HomeLayoutEditor({
  layout,
  visibility,
  errors,
  onLayoutChange,
  onVisibilityChange,
  onRestoreDefaults,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  function startDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    item: HomeLayoutItem,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cellWidth = rect.width / HOME_GRID.columns;
    const cellHeight = rect.height / HOME_GRID.rows;
    dragRef.current = {
      moduleId: item.moduleId,
      offsetX: event.clientX - rect.left - item.x * cellWidth,
      offsetY: event.clientY - rect.top - item.y * cellHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: React.PointerEvent<HTMLButtonElement>) {
    const canvas = canvasRef.current;
    const state = dragRef.current;
    if (!canvas || !state) return;
    const rect = canvas.getBoundingClientRect();
    const x = snapToGrid(
      event.clientX - rect.left - state.offsetX,
      rect.width / HOME_GRID.columns,
    );
    const y = snapToGrid(
      event.clientY - rect.top - state.offsetY,
      rect.height / HOME_GRID.rows,
    );
    onLayoutChange(moveLayoutItem(layout, state.moduleId, x, y));
  }

  return (
    <section className="settings-panel glass">
      <div className="settings-panel-head">
        <div>
          <h2>首页布局</h2>
          <p className="muted">
            拖拽固定尺寸卡片调整桌面位置。移动端仍使用固定顺序。
          </p>
        </div>
        <button
          className="btn"
          type="button"
          onClick={onRestoreDefaults}
        >
          恢复默认
        </button>
      </div>
      {errors.layout || errors.moduleVisibility ? (
        <p className="admin-notice error">
          {errors.layout?.[0] ?? errors.moduleVisibility?.[0]}
        </p>
      ) : null}
      <div className="layout-order-list">
        {HOME_MODULES.map((definition) => (
          <label className="settings-check" key={definition.id}>
            <input
              type="checkbox"
              checked={visibility[definition.id]}
              disabled={definition.core}
              onChange={(event) =>
                onVisibilityChange(
                  setModuleVisibility(
                    visibility,
                    definition.id,
                    event.target.checked,
                  ),
                )
              }
            />
            {definition.label}
            {definition.core ? <small>核心</small> : null}
          </label>
        ))}
      </div>
      <div className="layout-editor-scroll">
        <div className="layout-editor-canvas" ref={canvasRef}>
          {layout.map((item) => {
            const definition = HOME_MODULES.find(
              (entry) => entry.id === item.moduleId,
            )!;
            return (
              <button
                className={`layout-editor-card ${visibility[item.moduleId] ? "" : "is-disabled"}`}
                type="button"
                key={item.moduleId}
                onPointerDown={(event) => startDrag(event, item)}
                onPointerMove={drag}
                onPointerUp={() => {
                  dragRef.current = null;
                }}
                style={{
                  left: `${(item.x / HOME_GRID.columns) * 100}%`,
                  top: `${(item.y / HOME_GRID.rows) * 100}%`,
                  width: `${(item.width / HOME_GRID.columns) * 100}%`,
                  height: `${(item.height / HOME_GRID.rows) * 100}%`,
                }}
              >
                <strong>{definition.label}</strong>
                <span>
                  {item.x},{item.y} · {item.width}×{item.height}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
