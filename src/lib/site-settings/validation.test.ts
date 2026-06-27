import { describe, expect, it } from "vitest";

import {
  DEFAULT_SITE_CONFIGURATION,
  HOME_MODULES,
} from "./defaults";
import { validateSiteConfiguration } from "./validation";
import type { SiteConfigurationInput } from "./types";

function input(
  mutate?: (draft: SiteConfigurationInput) => void,
): SiteConfigurationInput {
  const draft = structuredClone(DEFAULT_SITE_CONFIGURATION);
  mutate?.(draft);
  return draft;
}

describe("validateSiteConfiguration", () => {
  it("accepts and normalizes the project defaults", () => {
    const result = validateSiteConfiguration(input());

    expect(result.ok).toBe(true);
    expect(result.data?.settings.siteTitle).toBe("Personal Dashboard");
  });

  it("accepts generated site media paths", () => {
    const result = validateSiteConfiguration(
      input((draft) => {
        draft.settings.avatarPath =
          "site/avatar/11111111-1111-4111-8111-111111111111.webp";
        draft.settings.faviconPath =
          "site/favicon/22222222-2222-4222-8222-222222222222.png";
      }),
    );

    expect(result.ok).toBe(true);
  });

  it("requires a site title and display name", () => {
    const result = validateSiteConfiguration(
      input((draft) => {
        draft.settings.siteTitle = " ";
        draft.settings.displayName = "";
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors.siteTitle).toBeDefined();
    expect(result.errors.displayName).toBeDefined();
  });

  it("accepts local image paths and HTTPS URLs but rejects unsafe paths", () => {
    const valid = validateSiteConfiguration(
      input((draft) => {
        draft.settings.avatarPath = "/images/avatar.png";
        draft.settings.faviconPath = "https://images.example/icon.png";
      }),
    );
    const invalid = validateSiteConfiguration(
      input((draft) => {
        draft.settings.avatarPath = "javascript:alert(1)";
      }),
    );

    expect(valid.ok).toBe(true);
    expect(invalid.ok).toBe(false);
    expect(invalid.errors.avatarPath).toBeDefined();
  });

  it("allows only HTTPS and mailto social links", () => {
    const valid = validateSiteConfiguration(
      input((draft) => {
        draft.socialLinks[0].href = "mailto:hello@example.com";
      }),
    );
    const invalid = validateSiteConfiguration(
      input((draft) => {
        draft.socialLinks[0].href = "http://example.com";
      }),
    );

    expect(valid.ok).toBe(true);
    expect(invalid.ok).toBe(false);
    expect(invalid.errors.socialLinks).toBeDefined();
  });

  it("rejects duplicate social positions", () => {
    const result = validateSiteConfiguration(
      input((draft) => {
        draft.socialLinks[1].position = draft.socialLinks[0].position;
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors.socialLinks).toBeDefined();
  });

  it("rejects disabled core modules", () => {
    const result = validateSiteConfiguration(
      input((draft) => {
        draft.settings.moduleVisibility.navigation = false;
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors.moduleVisibility).toBeDefined();
  });

  it("rejects incomplete navigation visibility settings", () => {
    const result = validateSiteConfiguration(
      input((draft) => {
        delete (draft.settings.navigationVisibility as Partial<
          typeof draft.settings.navigationVisibility
        >).plans;
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors.navigationVisibility).toBeDefined();
  });

  it("rejects unknown modules and modified fixed dimensions", () => {
    const result = validateSiteConfiguration(
      input((draft) => {
        draft.layout[0].moduleId = "unknown" as "navigation";
        draft.layout[1].width += 1;
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors.layout).toBeDefined();
  });

  it("rejects overlapping and out-of-bounds cards", () => {
    const overlap = validateSiteConfiguration(
      input((draft) => {
        draft.layout[1].x = draft.layout[0].x;
        draft.layout[1].y = draft.layout[0].y;
      }),
    );
    const outside = validateSiteConfiguration(
      input((draft) => {
        draft.layout[0].x = 12;
      }),
    );

    expect(overlap.ok).toBe(false);
    expect(outside.ok).toBe(false);
    expect(overlap.errors.layout).toBeDefined();
    expect(outside.errors.layout).toBeDefined();
  });

  it("requires every registered module exactly once", () => {
    const result = validateSiteConfiguration(
      input((draft) => {
        draft.layout.pop();
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors.layout).toBeDefined();
    expect(DEFAULT_SITE_CONFIGURATION.layout).toHaveLength(HOME_MODULES.length);
  });
});
