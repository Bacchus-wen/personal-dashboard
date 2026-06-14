import { describe, expect, it } from "vitest";

import { photoEditorFormKey } from "./photo-editor-state";

describe("photoEditorFormKey", () => {
  it("is stable for the same persisted settings", () => {
    expect(photoEditorFormKey({ visibility: "draft", sortOrder: 0 })).toBe(
      photoEditorFormKey({ visibility: "draft", sortOrder: 0 }),
    );
  });

  it("changes when persisted visibility changes", () => {
    expect(photoEditorFormKey({ visibility: "draft", sortOrder: 0 })).not.toBe(
      photoEditorFormKey({ visibility: "public", sortOrder: 0 }),
    );
  });

  it("changes when persisted sort order changes", () => {
    expect(photoEditorFormKey({ visibility: "public", sortOrder: 0 })).not.toBe(
      photoEditorFormKey({ visibility: "public", sortOrder: 1 }),
    );
  });
});
