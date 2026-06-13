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
