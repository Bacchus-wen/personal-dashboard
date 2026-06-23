import { describe, expect, it } from "vitest";

import { DEFAULT_HOME_LAYOUT } from "./defaults";
import {
  moveLayoutItem,
  normalizeHomeLayoutOrder,
  restoreDefaultVisibility,
  restoreDefaultLayout,
  setModuleVisibility,
  snapToGrid,
} from "./layout";

describe("homepage layout helpers", () => {
  it("snaps pointer coordinates to integer grid cells", () => {
    expect(snapToGrid(149, 100)).toBe(1);
    expect(snapToGrid(151, 100)).toBe(2);
  });

  it("moves valid cards and rejects collisions", () => {
    const valid = moveLayoutItem(DEFAULT_HOME_LAYOUT, "clock", 9, 6);
    const collision = moveLayoutItem(DEFAULT_HOME_LAYOUT, "clock", 2, 2);

    expect(valid.find((item) => item.moduleId === "clock")).toMatchObject({
      x: 9,
      y: 6,
    });
    expect(collision).toEqual(DEFAULT_HOME_LAYOUT);
  });

  it("clamps cards to the canvas bounds", () => {
    const result = moveLayoutItem(DEFAULT_HOME_LAYOUT, "clock", 99, 99);

    expect(result.find((item) => item.moduleId === "clock")).toMatchObject({
      x: 9,
      y: 6,
    });
  });

  it("keeps core modules visible and preserves optional positions", () => {
    const visibility = {
      navigation: true,
      welcome: true,
      socials: true,
      album: true,
      clock: true,
      calendar: true,
      recentPlans: true,
      recommendation: true,
      music: true,
    } as const;

    expect(setModuleVisibility(visibility, "navigation", false).navigation).toBe(
      true,
    );
    expect(setModuleVisibility(visibility, "clock", false).clock).toBe(false);
  });

  it("returns a fresh default layout", () => {
    const restored = restoreDefaultLayout();

    expect(restored).toEqual(DEFAULT_HOME_LAYOUT);
    expect(restored).not.toBe(DEFAULT_HOME_LAYOUT);
  });

  it("restores every module to the default visible state", () => {
    expect(restoreDefaultVisibility()).toEqual({
      navigation: true,
      welcome: true,
      socials: true,
      album: true,
      clock: true,
      calendar: true,
      recentPlans: true,
      recommendation: true,
      music: true,
    });
  });

  it("normalizes layout order while keeping storage-safe coordinates", () => {
    const reversed = [...DEFAULT_HOME_LAYOUT].reverse();
    const normalized = normalizeHomeLayoutOrder(reversed, {
      navigation: true,
      welcome: true,
      socials: true,
      album: true,
      clock: true,
      calendar: true,
      recentPlans: true,
      recommendation: true,
      music: true,
    });

    expect(normalized.map((item) => item.moduleId)).toEqual(
      reversed.map((item) => item.moduleId),
    );
    expect(normalized.find((item) => item.moduleId === "navigation")).toEqual(
      DEFAULT_HOME_LAYOUT.find((item) => item.moduleId === "navigation"),
    );
  });

  it("moves hidden modules to the end without dropping them", () => {
    const normalized = normalizeHomeLayoutOrder(DEFAULT_HOME_LAYOUT, {
      navigation: true,
      welcome: true,
      socials: true,
      album: false,
      clock: true,
      calendar: true,
      recentPlans: true,
      recommendation: true,
      music: true,
    });

    expect(normalized).toHaveLength(DEFAULT_HOME_LAYOUT.length);
    expect(normalized.at(-1)?.moduleId).toBe("album");
  });
});
