import { describe, expect, it } from "vitest";

import {
  parseAdminCollectionQuery,
  parsePublicCollectionQuery,
} from "./queries";

describe("parsePublicCollectionQuery", () => {
  it("normalizes public type, search, and tag filters", () => {
    expect(
      parsePublicCollectionQuery({
        type: "video",
        q: "  systems  ",
        tag: "  Engineering  ",
      }),
    ).toEqual({
      type: "video",
      search: "systems",
      tag: "Engineering",
    });
  });

  it("ignores unknown public content types", () => {
    expect(parsePublicCollectionQuery({ type: "podcast" })).toEqual({
      type: "article",
      search: null,
      tag: null,
    });
  });

  it("uses the first repeated query-string value", () => {
    expect(
      parsePublicCollectionQuery({
        type: ["video", "article"],
        q: [" first ", "second"],
        tag: ["AI", "Tools"],
      }),
    ).toEqual({
      type: "video",
      search: "first",
      tag: "AI",
    });
  });
});

describe("parseAdminCollectionQuery", () => {
  it("normalizes admin search, type, and visibility filters", () => {
    expect(
      parseAdminCollectionQuery({
        q: "  reliable  ",
        type: "article",
        visibility: "archived",
      }),
    ).toEqual({
      search: "reliable",
      type: "article",
      visibility: "archived",
    });
  });

  it("ignores invalid admin filters", () => {
    expect(
      parseAdminCollectionQuery({
        q: " ",
        type: "podcast",
        visibility: "private",
      }),
    ).toEqual({
      search: null,
      type: null,
      visibility: null,
    });
  });
});
