import { describe, expect, it } from "vitest";

import { navigation } from "./site-content";
import {
  BLOGS_REDIRECT_TARGET,
  RESOURCES_REDIRECT_TARGET,
} from "../lib/navigation/redirects";

describe("public recommendation navigation", () => {
  it("exposes collections and projects without obsolete routes", () => {
    expect(navigation.map((item) => item.href)).toEqual(
      expect.arrayContaining(["/collections", "/projects"]),
    );
    expect(navigation.map((item) => item.href)).not.toEqual(
      expect.arrayContaining(["/resources", "/blogs"]),
    );
  });

  it("keeps permanent redirect destinations explicit", () => {
    expect(RESOURCES_REDIRECT_TARGET).toBe("/collections");
    expect(BLOGS_REDIRECT_TARGET).toBe("/projects");
  });
});
