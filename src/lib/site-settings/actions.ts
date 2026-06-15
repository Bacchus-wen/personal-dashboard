import { runProtectedAdminOperation } from "../auth/guard";
import {
  cleanupObsoleteMedia,
  obsoleteSystemMediaPaths,
} from "../media/lifecycle";
import type { SiteSettingsRepository } from "./repository";
import type {
  SiteConfigurationActionResult,
  SiteConfigurationInput,
} from "./types";
import { validateSiteConfiguration } from "./validation";

type SiteSettingsActionServiceDependencies = {
  repository: SiteSettingsRepository;
  adminUserId: string;
  deleteMediaObject?: (path: string) => Promise<void>;
};

export function createSiteSettingsActionService({
  repository,
  adminUserId,
  deleteMediaObject = async () => {},
}: SiteSettingsActionServiceDependencies) {
  return {
    publish(userId: string | null, input: SiteConfigurationInput) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        const validated = validateSiteConfiguration(input);
        if (!validated.ok) {
          return {
            ok: false,
            message: "请修正设置内容后再发布。",
            fieldErrors: validated.errors,
          } satisfies SiteConfigurationActionResult;
        }

        try {
          const previous = await repository.getPublished();
          await repository.publish(validated.data);
          await cleanupObsoleteMedia(
            obsoleteSystemMediaPaths(
              [previous.settings.avatarPath, previous.settings.faviconPath],
              [
                validated.data.settings.avatarPath,
                validated.data.settings.faviconPath,
              ],
            ),
            deleteMediaObject,
          );
          return {
            ok: true,
            message: "网站设置已保存并发布。",
          } satisfies SiteConfigurationActionResult;
        } catch {
          return {
            ok: false,
            message: "发布失败，请稍后重试。",
          } satisfies SiteConfigurationActionResult;
        }
      });
    },
  };
}
