import type { NavigationVisibility } from "@/lib/navigation/visibility";
import type { ThemeId } from "./theme";

export type HomeModuleId =
  | "navigation"
  | "welcome"
  | "socials"
  | "album"
  | "clock"
  | "calendar"
  | "recentPlans"
  | "recommendation"
  | "music";

export type ModuleVisibility = Record<HomeModuleId, boolean>;

export type SiteSettingsInput = {
  siteTitle: string;
  displayName: string;
  statusText: string;
  siteDescription: string;
  avatarPath: string;
  faviconPath: string;
  filingNumber: string;
  filingUrl: string | null;
  themeId: ThemeId;
  moduleVisibility: ModuleVisibility;
  navigationVisibility: NavigationVisibility;
};

export type SocialLinkInput = {
  id: string;
  platform: string;
  label: string;
  href: string;
  position: number;
  enabled: boolean;
};

export type HomeLayoutItem = {
  moduleId: HomeModuleId;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SiteConfigurationInput = {
  settings: SiteSettingsInput;
  socialLinks: SocialLinkInput[];
  layout: HomeLayoutItem[];
};

export type ValidSiteConfiguration = SiteConfigurationInput;
export type PublishedSiteConfiguration = SiteConfigurationInput;

export type SiteConfigurationFieldErrors = Partial<
  Record<
    | keyof Omit<SiteSettingsInput, "moduleVisibility" | "navigationVisibility">
    | "moduleVisibility"
    | "navigationVisibility"
    | "socialLinks"
    | "layout",
    string[]
  >
>;

export type SiteConfigurationValidationResult =
  | {
      ok: true;
      data: ValidSiteConfiguration;
      errors: SiteConfigurationFieldErrors;
    }
  | {
      ok: false;
      data?: undefined;
      errors: SiteConfigurationFieldErrors;
    };

export type SiteConfigurationActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: SiteConfigurationFieldErrors;
};
