import {
  CORE_HOME_MODULE_IDS,
  DEFAULT_HOME_LAYOUT,
  DEFAULT_SITE_CONFIGURATION,
  EDITORIAL_HOME_MODULE_ORDER,
  HOME_GRID,
  HOME_MODULES,
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

export function restoreDefaultVisibility() {
  return { ...DEFAULT_SITE_CONFIGURATION.settings.moduleVisibility };
}

export function normalizeHomeLayoutOrder(
  layout: HomeLayoutItem[],
  visibility: ModuleVisibility,
) {
  const defaultById = new Map(
    DEFAULT_HOME_LAYOUT.map((item) => [item.moduleId, item]),
  );
  const seen = new Set<HomeModuleId>();
  const requestedOrder: HomeModuleId[] = [];

  for (const item of layout) {
    if (
      EDITORIAL_HOME_MODULE_ORDER.includes(item.moduleId) &&
      !seen.has(item.moduleId)
    ) {
      seen.add(item.moduleId);
      requestedOrder.push(item.moduleId);
    }
  }

  for (const moduleId of EDITORIAL_HOME_MODULE_ORDER) {
    if (!seen.has(moduleId)) requestedOrder.push(moduleId);
  }

  return requestedOrder
    .sort((a, b) => Number(!visibility[a]) - Number(!visibility[b]))
    .map((moduleId) => {
      const definition = HOME_MODULES.find((module) => module.id === moduleId)!;
      const fallback = defaultById.get(moduleId)!;
      return {
        moduleId,
        x: fallback.x,
        y: fallback.y,
        width: definition.width,
        height: definition.height,
      };
    });
}
