import { describe, expect, it } from "vitest";

import { DEFAULT_SITE_CONFIGURATION } from "./defaults";
import {
  SiteSettingsRepositoryError,
  createSiteSettingsRepository,
  type SiteSettingsDatabaseClient,
} from "./repository";

function database(
  overrides: Partial<SiteSettingsDatabaseClient> = {},
): SiteSettingsDatabaseClient {
  return {
    async getSettings() {
      return {
        site_title: "Published title",
        display_name: "Published name",
        status_text: "Status",
        site_description: "Description",
        avatar_path: "/avatar.png",
        favicon_path: "/icon.png",
        filing_number: "",
        filing_url: null,
        module_visibility:
          DEFAULT_SITE_CONFIGURATION.settings.moduleVisibility,
      };
    },
    async getSocialLinks() {
      return [
        {
          id: "mail",
          platform: "email",
          label: "Email",
          href: "mailto:hello@example.com",
          position: 0,
          enabled: true,
        },
      ];
    },
    async getLayout() {
      return DEFAULT_SITE_CONFIGURATION.layout.map((item) => ({
        module_key: item.moduleId,
        grid_x: item.x,
        grid_y: item.y,
        grid_width: item.width,
        grid_height: item.height,
      }));
    },
    async publish() {},
    ...overrides,
  };
}

describe("createSiteSettingsRepository", () => {
  it("maps published database rows into application configuration", async () => {
    const repository = createSiteSettingsRepository(database());

    const result = await repository.getPublished();

    expect(result.settings.siteTitle).toBe("Published title");
    expect(result.socialLinks[0]).toMatchObject({
      id: "mail",
      href: "mailto:hello@example.com",
    });
    expect(result.layout[0]).toHaveProperty("moduleId");
  });

  it("falls back to project defaults when published rows are incomplete", async () => {
    const repository = createSiteSettingsRepository(
      database({
        async getSettings() {
          return null;
        },
      }),
    );

    await expect(repository.getPublished()).resolves.toEqual(
      DEFAULT_SITE_CONFIGURATION,
    );
  });

  it("publishes all normalized sections with one database operation", async () => {
    let payload: unknown;
    const repository = createSiteSettingsRepository(
      database({
        async publish(input) {
          payload = input;
        },
      }),
    );

    await repository.publish(DEFAULT_SITE_CONFIGURATION);

    expect(payload).toEqual(
      expect.objectContaining({
        settings: expect.objectContaining({
          site_title: "Theodore · Personal Space",
        }),
        links: expect.any(Array),
        layout: expect.any(Array),
      }),
    );
  });

  it("wraps database errors without exposing details", async () => {
    const repository = createSiteSettingsRepository(
      database({
        async getSettings() {
          throw new Error("secret detail");
        },
      }),
    );

    await expect(repository.getPublished()).rejects.toEqual(
      new SiteSettingsRepositoryError("READ_FAILED"),
    );
  });
});
