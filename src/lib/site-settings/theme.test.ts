import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME_ID,
  isThemeId,
  normalizeThemeId,
  SITE_THEMES,
} from "./theme";

describe("site theme model", () => {
  it("accepts only published theme ids", () => {
    expect(isThemeId("paper-editorial")).toBe(true);
    expect(isThemeId("night-radio")).toBe(true);
    expect(isThemeId("custom-purple")).toBe(false);
  });

  it("falls back to the default paper editorial theme", () => {
    expect(DEFAULT_THEME_ID).toBe("paper-editorial");
    expect(normalizeThemeId(null)).toBe("paper-editorial");
    expect(normalizeThemeId("night-radio")).toBe("night-radio");
  });

  it("keeps exactly two public theme choices", () => {
    expect(SITE_THEMES.map((theme) => theme.id)).toEqual([
      "paper-editorial",
      "night-radio",
    ]);
  });
});
