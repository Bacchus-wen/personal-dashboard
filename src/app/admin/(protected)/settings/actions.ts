"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createSiteSettingsActionService } from "@/lib/site-settings/actions";
import { getSiteSettingsRepository } from "@/lib/site-settings/server-repository";
import type {
  SiteConfigurationActionResult,
  SiteConfigurationInput,
} from "@/lib/site-settings/types";
import { getAdminUserId } from "@/lib/supabase/env";

export async function publishSiteConfigurationAction(
  input: SiteConfigurationInput,
): Promise<SiteConfigurationActionResult> {
  const user = await requireAdmin();
  const result = await createSiteSettingsActionService({
    repository: getSiteSettingsRepository(),
    adminUserId: getAdminUserId(),
  }).publish(user.id, input);

  if (result.ok) {
    revalidatePath("/", "layout");
    revalidatePath("/about");
    revalidatePath("/admin/settings");
  }

  return result;
}
