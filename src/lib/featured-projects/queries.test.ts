import { describe, expect, it } from "vitest";

import {
  parseAdminFeaturedProjectQuery,
  parsePublicFeaturedProjectQuery,
} from "./queries";

describe("parsePublicFeaturedProjectQuery", () => {
  it("normalizes public search, language, and tag filters", () => {
    expect(
      parsePublicFeaturedProjectQuery({
        q: "  toolkit  ",
        language: "  TypeScript  ",
        tag: "  Architecture  ",
      }),
    ).toEqual({
      search: "toolkit",
      language: "TypeScript",
      tag: "Architecture",
    });
  });

  it("uses the first repeated query-string value", () => {
    expect(
      parsePublicFeaturedProjectQuery({
        q: [" first ", "second"],
        language: ["TypeScript", "Rust"],
        tag: ["Tools", "CLI"],
      }),
    ).toEqual({
      search: "first",
      language: "TypeScript",
      tag: "Tools",
    });
  });
});

describe("parseAdminFeaturedProjectQuery", () => {
  it("normalizes admin search, language, and visibility filters", () => {
    expect(
      parseAdminFeaturedProjectQuery({
        q: "  focused  ",
        language: "  TypeScript  ",
        visibility: "archived",
      }),
    ).toEqual({
      search: "focused",
      language: "TypeScript",
      visibility: "archived",
    });
  });

  it("ignores invalid visibility and empty text", () => {
    expect(
      parseAdminFeaturedProjectQuery({
        q: " ",
        language: " ",
        visibility: "private",
      }),
    ).toEqual({
      search: null,
      language: null,
      visibility: null,
    });
  });
});
