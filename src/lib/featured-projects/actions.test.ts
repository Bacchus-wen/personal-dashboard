import { describe, expect, it, vi } from "vitest";

import { AdminAccessError } from "../auth/guard";
import {
  createFeaturedProjectActionService,
  getFeaturedProjectMutationRevalidationPaths,
} from "./actions";
import type { FeaturedProjectRepository } from "./repository";
import type { FeaturedProject, FeaturedProjectInput } from "./types";

function input(overrides: Partial<FeaturedProjectInput> = {}): FeaturedProjectInput {
  return {
    name: "Focused Toolkit",
    repositoryUrl: "https://github.com/example/focused-toolkit",
    summary: "Small and focused.",
    recommendation: "A useful example.",
    coverPath: null,
    language: "TypeScript",
    tags: ["Tools"],
    starCount: "12400",
    starRecordedOn: "2026-06-14",
    visibility: "public",
    featured: true,
    sortOrder: 0,
    ...overrides,
  };
}

function repository() {
  return {
    getById: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue({ id: "project-id" }),
    moveToTrash: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    permanentlyDelete: vi.fn().mockResolvedValue(undefined),
  } as unknown as FeaturedProjectRepository;
}

function project(overrides: Partial<FeaturedProject> = {}): FeaturedProject {
  return {
    id: "project-id",
    name: "Focused Toolkit",
    repositoryUrl: "https://github.com/example/focused-toolkit",
    summary: "Small and focused.",
    recommendation: "A useful example.",
    coverPath:
      "projects/project-id/cover/00000000-0000-4000-8000-000000000001.webp",
    language: "TypeScript",
    tags: ["Tools"],
    starCount: 12400,
    starRecordedOn: "2026-06-14",
    visibility: "public",
    featured: true,
    sortOrder: 0,
    deletedAt: null,
    createdAt: "2026-06-15T00:00:00.000Z",
    updatedAt: "2026-06-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("createFeaturedProjectActionService", () => {
  const adminUserId = "admin-user-id";

  it("rejects anonymous and non-admin writes before repository calls", async () => {
    const projects = repository();
    const service = createFeaturedProjectActionService({
      repository: projects,
      adminUserId,
    });

    await expect(service.create(null, input())).rejects.toEqual(
      new AdminAccessError("UNAUTHENTICATED"),
    );
    await expect(service.create("other-user", input())).rejects.toEqual(
      new AdminAccessError("FORBIDDEN"),
    );
    expect(projects.save).not.toHaveBeenCalled();
  });

  it("returns field errors without writing invalid public input", async () => {
    const projects = repository();
    const service = createFeaturedProjectActionService({
      repository: projects,
      adminUserId,
    });

    const result = await service.create(
      adminUserId,
      input({ repositoryUrl: "", recommendation: "" }),
    );

    expect(result.fieldErrors?.repositoryUrl).toBeDefined();
    expect(projects.save).not.toHaveBeenCalled();
  });

  it("writes normalized valid input for the administrator", async () => {
    const projects = repository();
    const service = createFeaturedProjectActionService({
      repository: projects,
      adminUserId,
    });

    await service.create(adminUserId, input({ tags: [" Tools ", "tools"] }));

    expect(projects.save).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ tags: ["Tools"], starCount: 12400 }),
    );
  });

  it("uses repository trash, restore, and permanent-delete operations", async () => {
    const projects = repository();
    const service = createFeaturedProjectActionService({
      repository: projects,
      adminUserId,
    });

    await service.moveToTrash(adminUserId, "project-id");
    await service.restore(adminUserId, "project-id");
    await service.permanentlyDelete(adminUserId, "project-id");

    expect(projects.moveToTrash).toHaveBeenCalledWith("project-id");
    expect(projects.restore).toHaveBeenCalledWith("project-id");
    expect(projects.permanentlyDelete).toHaveBeenCalledWith("project-id");
  });

  it("cleans obsolete system cover files after an update saves", async () => {
    const projects = repository();
    const deleteMediaObject = vi.fn().mockResolvedValue(undefined);
    vi.mocked(projects.getById).mockResolvedValue(project());
    const service = createFeaturedProjectActionService({
      repository: projects,
      adminUserId,
      deleteMediaObject,
    });

    await service.update(
      adminUserId,
      "project-id",
      input({
        coverPath:
          "projects/project-id/cover/00000000-0000-4000-8000-000000000002.webp",
      }),
    );

    expect(deleteMediaObject).toHaveBeenCalledWith(
      "projects/project-id/cover/00000000-0000-4000-8000-000000000001.webp",
      "replace_old_file",
    );
  });

  it("keeps a successful update even if obsolete cover cleanup fails", async () => {
    const projects = repository();
    const deleteMediaObject = vi
      .fn()
      .mockRejectedValue(new Error("cleanup failed"));
    vi.mocked(projects.getById).mockResolvedValue(project());
    const service = createFeaturedProjectActionService({
      repository: projects,
      adminUserId,
      deleteMediaObject,
    });

    const result = await service.update(
      adminUserId,
      "project-id",
      input({
        coverPath:
          "projects/project-id/cover/00000000-0000-4000-8000-000000000002.webp",
      }),
    );

    expect(result.ok).toBe(true);
    expect(projects.save).toHaveBeenCalled();
  });

  it("cleans system cover files after permanent delete", async () => {
    const projects = repository();
    const deleteMediaObject = vi.fn().mockResolvedValue(undefined);
    vi.mocked(projects.getById).mockResolvedValue(project());
    const service = createFeaturedProjectActionService({
      repository: projects,
      adminUserId,
      deleteMediaObject,
    });

    await service.permanentlyDelete(adminUserId, "project-id");

    expect(projects.permanentlyDelete).toHaveBeenCalledWith("project-id");
    expect(deleteMediaObject).toHaveBeenCalledWith(
      "projects/project-id/cover/00000000-0000-4000-8000-000000000001.webp",
      "delete_asset_file",
    );
  });
});

describe("getFeaturedProjectMutationRevalidationPaths", () => {
  it("includes homepage, public, and admin paths", () => {
    expect(getFeaturedProjectMutationRevalidationPaths()).toEqual([
      "/",
      "/projects",
      "/admin/projects",
      "/admin/projects/trash",
    ]);
  });
});
