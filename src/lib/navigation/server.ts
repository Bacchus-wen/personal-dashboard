import { navigation } from "@/data/site-content";
import { getSiteSettingsRepository } from "@/lib/site-settings/server-repository";
import {
  DEFAULT_NAVIGATION_VISIBILITY,
  filterVisibleNavigationItems,
} from "./visibility";

export async function getVisibleNavigationItems() {
  try {
    const configuration = await getSiteSettingsRepository().getPublished();
    return filterVisibleNavigationItems(
      navigation,
      configuration.settings.navigationVisibility,
    );
  } catch {
    return filterVisibleNavigationItems(navigation, DEFAULT_NAVIGATION_VISIBILITY);
  }
}
