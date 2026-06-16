import { describe, expect, it } from "vitest";

import { navigation } from "../../data/site-content";
import {
  DEFAULT_NAVIGATION_VISIBILITY,
  filterVisibleNavigationItems,
  isCompleteNavigationVisibility,
  normalizeNavigationVisibility,
} from "./visibility";

describe("navigation visibility", () => {
  it("hides articles by default while keeping the requested public entries", () => {
    expect(DEFAULT_NAVIGATION_VISIBILITY).toEqual({
      plans: true,
      articles: false,
      works: true,
      about: true,
      collections: true,
      projects: true,
    });
  });

  it("normalizes missing persisted values to defaults", () => {
    expect(normalizeNavigationVisibility({ articles: true })).toEqual({
      ...DEFAULT_NAVIGATION_VISIBILITY,
      articles: true,
    });
  });

  it("requires a complete boolean map for saved settings", () => {
    expect(isCompleteNavigationVisibility(DEFAULT_NAVIGATION_VISIBILITY)).toBe(
      true,
    );
    expect(isCompleteNavigationVisibility({ plans: true })).toBe(false);
    expect(
      isCompleteNavigationVisibility({
        ...DEFAULT_NAVIGATION_VISIBILITY,
        articles: "yes",
      }),
    ).toBe(false);
  });

  it("filters public navigation items and always keeps home", () => {
    expect(
      filterVisibleNavigationItems(navigation, DEFAULT_NAVIGATION_VISIBILITY).map(
        (item) => item.id,
      ),
    ).toEqual(["home", "plans", "works", "about", "collections", "projects"]);
  });
});
