import { runProtectedAdminOperation } from "../auth/guard";
import type { SiteSettingsRepository } from "./repository";
import type {
  SiteConfigurationActionResult,
  SiteConfigurationInput,
} from "./types";
import { validateSiteConfiguration } from "./validation";

type SiteSettingsActionServiceDependencies = {
  repository: SiteSettingsRepository;
  adminUserId: string;
};

export function createSiteSettingsActionService({
  repository,
  adminUserId,
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
          await repository.publish(validated.data);
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
