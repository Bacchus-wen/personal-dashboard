import type { NavId } from "../../data/site-content";

export type PublicNavigationId = Exclude<NavId, "home">;
export type NavigationVisibility = Record<PublicNavigationId, boolean>;

export const PUBLIC_NAVIGATION_IDS: PublicNavigationId[] = [
  "plans",
  "articles",
  "works",
  "about",
  "collections",
  "projects",
];

export const DEFAULT_NAVIGATION_VISIBILITY: NavigationVisibility = {
  plans: true,
  articles: false,
  works: true,
  about: true,
  collections: true,
  projects: true,
};

export function normalizeNavigationVisibility(
  visibility: Partial<Record<PublicNavigationId, unknown>> | null | undefined,
) {
  return Object.fromEntries(
    PUBLIC_NAVIGATION_IDS.map((id) => [
      id,
      typeof visibility?.[id] === "boolean"
        ? visibility[id]
        : DEFAULT_NAVIGATION_VISIBILITY[id],
    ]),
  ) as NavigationVisibility;
}

export function isCompleteNavigationVisibility(
  visibility: Partial<Record<PublicNavigationId, unknown>>,
) {
  const keys = Object.keys(visibility);
  return (
    keys.length === PUBLIC_NAVIGATION_IDS.length &&
    PUBLIC_NAVIGATION_IDS.every((id) => typeof visibility[id] === "boolean")
  );
}

export function filterVisibleNavigationItems<T extends { id: NavId }>(
  items: T[],
  visibility: NavigationVisibility,
) {
  return items.filter(
    (item) => item.id === "home" || visibility[item.id as PublicNavigationId],
  );
}
