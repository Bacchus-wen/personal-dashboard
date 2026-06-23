import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createSiteSettingsRepository,
  type LayoutRow,
  type SettingsRow,
  type SiteSettingsDatabaseClient,
  type SocialLinkRow,
} from "./repository";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

function createSupabaseSiteSettingsDatabaseClient(
  client: SupabaseClient,
): SiteSettingsDatabaseClient {
  return {
    async getSettings() {
      const { data, error } = await client
        .from("site_settings")
        .select(
          "site_title,display_name,status_text,site_description,avatar_path,favicon_path,filing_number,filing_url,theme_id,module_visibility,navigation_visibility",
        )
        .eq("singleton", true)
        .maybeSingle();
      if (error) throw error;
      return (data as SettingsRow | null) ?? null;
    },

    async getSocialLinks() {
      const { data, error } = await client
        .from("social_links")
        .select("id,platform,label,href,position,enabled")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SocialLinkRow[];
    },

    async getLayout() {
      const { data, error } = await client
        .from("home_layout")
        .select("module_key,grid_x,grid_y,grid_width,grid_height");
      if (error) throw error;
      return (data ?? []) as LayoutRow[];
    },

    async publish(input) {
      const { error } = await client.rpc("publish_site_configuration", {
        settings: input.settings,
        links: input.links,
        layout: input.layout,
      });
      if (error) throw error;
    },
  };
}

export function getSiteSettingsRepository() {
  return createSiteSettingsRepository(
    createSupabaseSiteSettingsDatabaseClient(createSupabaseAdminClient()),
  );
}
