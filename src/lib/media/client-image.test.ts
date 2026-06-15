import { describe, expect, it } from "vitest";

import {
  mediaWebpFilename,
  shouldPassThroughFavicon,
} from "./client-image";

describe("media client image helpers", () => {
  it("creates webp filenames without preserving unsafe extensions", () => {
    expect(mediaWebpFilename("My Photo.PNG")).toBe("My Photo.webp");
    expect(mediaWebpFilename(".png")).toBe("media.webp");
  });

  it("passes through supported favicon files", () => {
    expect(
      shouldPassThroughFavicon(
        new File(["x"], "icon.ico", { type: "image/x-icon" }),
      ),
    ).toBe(true);
    expect(
      shouldPassThroughFavicon(
        new File(["x"], "icon.png", { type: "image/png" }),
      ),
    ).toBe(true);
    expect(
      shouldPassThroughFavicon(
        new File(["<svg />"], "icon.svg", { type: "image/svg+xml" }),
      ),
    ).toBe(true);
    expect(
      shouldPassThroughFavicon(
        new File(["x"], "icon.webp", { type: "image/webp" }),
      ),
    ).toBe(false);
  });
});
