import { cloneDefaultSiteConfiguration } from "./defaults";
import { normalizeNavigationVisibility } from "../navigation/visibility";
import type {
  HomeModuleId,
  PublishedSiteConfiguration,
  ValidSiteConfiguration,
} from "./types";
import { validateSiteConfiguration } from "./validation";

export type SettingsRow = {
  site_title: string;
  display_name: string;
  status_text: string;
  site_description: string;
  avatar_path: string;
  favicon_path: string;
  filing_number: string;
  filing_url: string | null;
  module_visibility: Record<string, boolean>;
  navigation_visibility: Record<string, boolean> | null;
};

export type SocialLinkRow = {
  id: string;
  platform: string;
  label: string;
  href: string;
  position: number;
  enabled: boolean;
};

export type LayoutRow = {
  module_key: string;
  grid_x: number;
  grid_y: number;
  grid_width: number;
  grid_height: number;
};

export type PublishDatabaseInput = {
  settings: Record<string, unknown>;
  links: Record<string, unknown>[];
  layout: Record<string, unknown>[];
};

export type SiteSettingsDatabaseClient = {
  getSettings(): Promise<SettingsRow | null>;
  getSocialLinks(): Promise<SocialLinkRow[]>;
  getLayout(): Promise<LayoutRow[]>;
  publish(input: PublishDatabaseInput): Promise<void>;
};

export type SiteSettingsRepository = {
  getPublished(): Promise<PublishedSiteConfiguration>;
  publish(input: ValidSiteConfiguration): Promise<void>;
};

export class SiteSettingsRepositoryError extends Error {
  constructor(public readonly code: "READ_FAILED" | "WRITE_FAILED") {
    super(code);
    this.name = "SiteSettingsRepositoryError";
  }
}

function toPublishInput(input: ValidSiteConfiguration): PublishDatabaseInput {
  return {
    settings: {
      site_title: input.settings.siteTitle,
      display_name: input.settings.displayName,
      status_text: input.settings.statusText,
      site_description: input.settings.siteDescription,
      avatar_path: input.settings.avatarPath,
      favicon_path: input.settings.faviconPath,
      filing_number: input.settings.filingNumber,
      filing_url: input.settings.filingUrl,
      module_visibility: input.settings.moduleVisibility,
      navigation_visibility: input.settings.navigationVisibility,
    },
    links: input.socialLinks.map((link) => ({ ...link })),
    layout: input.layout.map((item) => ({
      module_key: item.moduleId,
      grid_x: item.x,
      grid_y: item.y,
      grid_width: item.width,
      grid_height: item.height,
    })),
  };
}

export function createSiteSettingsRepository(
  client: SiteSettingsDatabaseClient,
): SiteSettingsRepository {
  return {
    async getPublished() {
      try {
        const [settings, socialLinks, layout] = await Promise.all([
          client.getSettings(),
          client.getSocialLinks(),
          client.getLayout(),
        ]);
        if (!settings) return cloneDefaultSiteConfiguration();

        const result = validateSiteConfiguration({
          settings: {
            siteTitle: settings.site_title,
            displayName: settings.display_name,
            statusText: settings.status_text,
            siteDescription: settings.site_description,
            avatarPath: settings.avatar_path,
            faviconPath: settings.favicon_path,
            filingNumber: settings.filing_number,
            filingUrl: settings.filing_url,
            moduleVisibility: settings.module_visibility as Record<
              HomeModuleId,
              boolean
            >,
            navigationVisibility: normalizeNavigationVisibility(
              settings.navigation_visibility,
            ),
          },
          socialLinks: socialLinks.map((link) => ({ ...link })),
          layout: layout.map((item) => ({
            moduleId: item.module_key as HomeModuleId,
            x: item.grid_x,
            y: item.grid_y,
            width: item.grid_width,
            height: item.grid_height,
          })),
        });

        return result.ok ? result.data : cloneDefaultSiteConfiguration();
      } catch {
        throw new SiteSettingsRepositoryError("READ_FAILED");
      }
    },

    async publish(input) {
      try {
        await client.publish(toPublishInput(input));
      } catch {
        throw new SiteSettingsRepositoryError("WRITE_FAILED");
      }
    },
  };
}
