import { describe, expect, it } from "vitest";

import {
  clampBoardPosition,
  createBoardPositions,
  hasDragged,
} from "./board";

describe("photo board geometry", () => {
  it("creates stable bounded positions across board regions", () => {
    const ids = Array.from({ length: 8 }, (_, index) => `photo-${index + 1}`);

    const first = createBoardPositions(ids, 1000, 640, 220, 170, "group-1");
    const second = createBoardPositions(ids, 1000, 640, 220, 170, "group-1");

    expect(first).toEqual(second);
    expect(Object.keys(first)).toEqual(ids);

    const positions = Object.values(first);
    expect(positions.every((position) => position.x >= 0 && position.x <= 780)).toBe(true);
    expect(positions.every((position) => position.y >= 0 && position.y <= 470)).toBe(true);
    expect(positions.some((position) => position.x < 260)).toBe(true);
    expect(positions.some((position) => position.x > 520)).toBe(true);
    expect(positions.some((position) => position.y < 160)).toBe(true);
    expect(positions.some((position) => position.y > 300)).toBe(true);
  });

  it("uses the seed to vary initial placement", () => {
    const ids = ["a", "b", "c"];

    expect(createBoardPositions(ids, 900, 540, 200, 160, "one")).not.toEqual(
      createBoardPositions(ids, 900, 540, 200, 160, "two"),
    );
  });

  it("clamps positions inside the board", () => {
    expect(clampBoardPosition({ x: -40, y: 600 }, 500, 380, 120, 90)).toEqual({
      x: 0,
      y: 290,
    });
  });

  it("distinguishes clicks from drags", () => {
    expect(hasDragged({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(false);
    expect(hasDragged({ x: 0, y: 0 }, { x: 6, y: 0 })).toBe(true);
  });
});
