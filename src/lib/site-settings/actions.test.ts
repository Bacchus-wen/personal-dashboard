import { describe, expect, it, vi } from "vitest";

import { AdminAccessError } from "../auth/guard";
import { DEFAULT_SITE_CONFIGURATION } from "./defaults";
import { createSiteSettingsActionService } from "./actions";
import type { SiteSettingsRepository } from "./repository";

function repository() {
  return {
    getPublished: vi.fn().mockResolvedValue(DEFAULT_SITE_CONFIGURATION),
    publish: vi.fn().mockResolvedValue(undefined),
  } as unknown as SiteSettingsRepository;
}

describe("createSiteSettingsActionService", () => {
  const adminUserId = "admin-user";

  it("rejects anonymous and non-admin users before publishing", async () => {
    const settings = repository();
    const service = createSiteSettingsActionService({
      repository: settings,
      adminUserId,
    });

    await expect(
      service.publish(null, DEFAULT_SITE_CONFIGURATION),
    ).rejects.toEqual(new AdminAccessError("UNAUTHENTICATED"));
    await expect(
      service.publish("other-user", DEFAULT_SITE_CONFIGURATION),
    ).rejects.toEqual(new AdminAccessError("FORBIDDEN"));
    expect(settings.publish).not.toHaveBeenCalled();
  });

  it("returns field errors without publishing invalid drafts", async () => {
    const settings = repository();
    const service = createSiteSettingsActionService({
      repository: settings,
      adminUserId,
    });
    const invalid = structuredClone(DEFAULT_SITE_CONFIGURATION);
    invalid.settings.siteTitle = "";

    const result = await service.publish(adminUserId, invalid);

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.siteTitle).toBeDefined();
    expect(settings.publish).not.toHaveBeenCalled();
  });

  it("publishes one normalized complete configuration", async () => {
    const settings = repository();
    const service = createSiteSettingsActionService({
      repository: settings,
      adminUserId,
    });

    const result = await service.publish(
      adminUserId,
      DEFAULT_SITE_CONFIGURATION,
    );

    expect(result.ok).toBe(true);
    expect(settings.publish).toHaveBeenCalledTimes(1);
  });

  it("cleans a replaced generated avatar after publishing", async () => {
    const settings = repository();
    const previous = structuredClone(DEFAULT_SITE_CONFIGURATION);
    previous.settings.avatarPath =
      "site/avatar/11111111-1111-4111-8111-111111111111.webp";
    vi.mocked(settings.getPublished).mockResolvedValue(previous);
    const deleteMediaObject = vi.fn().mockResolvedValue(undefined);
    const service = createSiteSettingsActionService({
      repository: settings,
      adminUserId,
      deleteMediaObject,
    });

    await service.publish(adminUserId, DEFAULT_SITE_CONFIGURATION);

    expect(deleteMediaObject).toHaveBeenCalledWith(previous.settings.avatarPath);
  });

  it("returns a stable failure without database details", async () => {
    const settings = repository();
    vi.mocked(settings.publish).mockRejectedValue(new Error("secret"));
    const service = createSiteSettingsActionService({
      repository: settings,
      adminUserId,
    });

    await expect(
      service.publish(adminUserId, DEFAULT_SITE_CONFIGURATION),
    ).resolves.toEqual({
      ok: false,
      message: "发布失败，请稍后重试。",
    });
  });
});
