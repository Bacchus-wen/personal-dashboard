import { describe, expect, it, vi } from "vitest";

import { AdminAccessError } from "../auth/guard";
import {
  createWorkActionService,
  getWorkMutationRevalidationPaths,
} from "./actions";
import type { WorkRepository } from "./repository";
import type { WorkInput } from "./types";

function input(overrides: Partial<WorkInput> = {}): WorkInput {
  return {
    name: "Dashboard",
    slug: "dashboard",
    summary: "摘要",
    description: "详情",
    coverPath: null,
    techStack: ["Next.js"],
    status: "maintained",
    visibility: "private",
    startedOn: null,
    completedOn: null,
    websiteUrl: "https://example.com",
    githubUrl: null,
    websiteAvailable: true,
    featured: false,
    sortOrder: 0,
    seoTitle: null,
    seoDescription: null,
    seoImagePath: null,
    screenshots: [],
    ...overrides,
  };
}

function repository() {
  return {
    getWorkById: vi.fn().mockResolvedValue(null),
    saveWork: vi.fn().mockResolvedValue({ id: "work-id" }),
    moveWorkToTrash: vi.fn().mockResolvedValue(undefined),
    restoreWork: vi.fn().mockResolvedValue(undefined),
    permanentlyDeleteWork: vi.fn().mockResolvedValue(undefined),
  } as unknown as WorkRepository;
}

describe("createWorkActionService", () => {
  const adminUserId = "admin-user-id";

  it("rejects anonymous users before repository calls", async () => {
    const works = repository();
    const service = createWorkActionService({ repository: works, adminUserId });

    await expect(service.createWork(null, input())).rejects.toEqual(
      new AdminAccessError("UNAUTHENTICATED"),
    );
    expect(works.saveWork).not.toHaveBeenCalled();
  });

  it("returns field errors without writing invalid public input", async () => {
    const works = repository();
    const service = createWorkActionService({ repository: works, adminUserId });

    const result = await service.createWork(
      adminUserId,
      input({ visibility: "public", slug: "", summary: "", description: "" }),
    );

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.slug).toBeDefined();
    expect(works.saveWork).not.toHaveBeenCalled();
  });

  it("writes normalized valid input for the administrator", async () => {
    const works = repository();
    const service = createWorkActionService({ repository: works, adminUserId });

    const result = await service.createWork(
      adminUserId,
      input({ techStack: [" Next.js ", "next.js"] }),
    );

    expect(result).toMatchObject({ ok: true, workId: "work-id" });
    expect(works.saveWork).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ techStack: ["Next.js"] }),
    );
  });

  it("uses the repository restore operation", async () => {
    const works = repository();
    const service = createWorkActionService({ repository: works, adminUserId });

    await expect(service.restoreWork(adminUserId, "work-id")).resolves.toEqual(
      expect.objectContaining({ ok: true }),
    );
    expect(works.restoreWork).toHaveBeenCalledWith("work-id");
  });

  it("cleans replaced generated work media after update", async () => {
    const works = repository();
    vi.mocked(works.getWorkById).mockResolvedValue({
      id: "work-id",
      coverPath:
        "works/work-id/cover/11111111-1111-4111-8111-111111111111.webp",
      seoImagePath: null,
      screenshots: [],
    } as unknown as Awaited<ReturnType<WorkRepository["getWorkById"]>>);
    const deleteMediaObject = vi.fn().mockResolvedValue(undefined);
    const service = createWorkActionService({
      repository: works,
      adminUserId,
      deleteMediaObject,
    });

    await service.updateWork(adminUserId, "work-id", input({ coverPath: null }));

    expect(deleteMediaObject).toHaveBeenCalledWith(
      "works/work-id/cover/11111111-1111-4111-8111-111111111111.webp",
      "replace_old_file",
    );
  });

  it("cleans generated work media after permanent delete", async () => {
    const works = repository();
    vi.mocked(works.getWorkById).mockResolvedValue({
      id: "work-id",
      coverPath: null,
      seoImagePath:
        "works/work-id/seo/22222222-2222-4222-8222-222222222222.webp",
      screenshots: [
        {
          imagePath:
            "works/work-id/screenshots/33333333-3333-4333-8333-333333333333.webp",
        },
      ],
    } as unknown as Awaited<ReturnType<WorkRepository["getWorkById"]>>);
    const deleteMediaObject = vi.fn().mockResolvedValue(undefined);
    const service = createWorkActionService({
      repository: works,
      adminUserId,
      deleteMediaObject,
    });

    await service.permanentlyDeleteWork(adminUserId, "work-id");

    expect(deleteMediaObject).toHaveBeenCalledWith(
      "works/work-id/seo/22222222-2222-4222-8222-222222222222.webp",
      "delete_asset_file",
    );
    expect(deleteMediaObject).toHaveBeenCalledWith(
      "works/work-id/screenshots/33333333-3333-4333-8333-333333333333.webp",
      "delete_asset_file",
    );
  });
});

describe("getWorkMutationRevalidationPaths", () => {
  it("returns public and administrator works paths", () => {
    expect(getWorkMutationRevalidationPaths()).toEqual([
      "/works",
      "/admin/works",
      "/admin/works/trash",
    ]);
  });
});
