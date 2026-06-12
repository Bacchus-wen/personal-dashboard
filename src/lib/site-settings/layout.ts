import {
  CORE_HOME_MODULE_IDS,
  DEFAULT_HOME_LAYOUT,
  HOME_GRID,
} from "./defaults";
import type {
  HomeLayoutItem,
  HomeModuleId,
  ModuleVisibility,
} from "./types";

export function snapToGrid(pixel: number, cellSize: number) {
  return Math.max(0, Math.round(pixel / cellSize));
}

function overlaps(a: HomeLayoutItem, b: HomeLayoutItem) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

export function moveLayoutItem(
  layout: HomeLayoutItem[],
  moduleId: HomeModuleId,
  requestedX: number,
  requestedY: number,
) {
  const current = layout.find((item) => item.moduleId === moduleId);
  if (!current) return layout;

  const candidate = {
    ...current,
    x: Math.max(
      0,
      Math.min(HOME_GRID.columns - current.width, Math.round(requestedX)),
    ),
    y: Math.max(
      0,
      Math.min(HOME_GRID.rows - current.height, Math.round(requestedY)),
    ),
  };
  const collides = layout.some(
    (item) => item.moduleId !== moduleId && overlaps(candidate, item),
  );
  if (collides) return layout;

  return layout.map((item) => (item.moduleId === moduleId ? candidate : item));
}

export function setModuleVisibility(
  visibility: ModuleVisibility,
  moduleId: HomeModuleId,
  enabled: boolean,
) {
  if (CORE_HOME_MODULE_IDS.includes(moduleId) && !enabled) {
    return { ...visibility };
  }
  return { ...visibility, [moduleId]: enabled };
}

export function restoreDefaultLayout() {
  return DEFAULT_HOME_LAYOUT.map((item) => ({ ...item }));
}
