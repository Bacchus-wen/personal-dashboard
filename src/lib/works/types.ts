import type { WorkStatus, WorkVisibility } from "./constants";

export type WorkScreenshot = {
  id?: string;
  imagePath: string;
  caption: string | null;
  sortOrder: number;
};

export type Work = {
  id: string;
  name: string;
  slug: string | null;
  summary: string | null;
  description: string | null;
  coverPath: string | null;
  techStack: string[];
  status: WorkStatus;
  visibility: WorkVisibility;
  startedOn: string | null;
  completedOn: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  websiteAvailable: boolean;
  featured: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  seoImagePath: string | null;
  screenshots: WorkScreenshot[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkScreenshotInput = {
  imagePath: string;
  caption: string | null;
  sortOrder: number | string;
};

export type WorkInput = {
  name: string;
  slug: string | null;
  summary: string | null;
  description: string | null;
  coverPath: string | null;
  techStack: string[];
  status: string;
  visibility: string;
  startedOn: string | null;
  completedOn: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  websiteAvailable: boolean;
  featured: boolean;
  sortOrder: number | string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoImagePath: string | null;
  screenshots: WorkScreenshotInput[];
};

export type ValidWorkInput = Omit<
  WorkInput,
  "status" | "visibility" | "sortOrder" | "screenshots"
> & {
  status: WorkStatus;
  visibility: WorkVisibility;
  sortOrder: number;
  screenshots: WorkScreenshot[];
};

export type WorkFieldErrors = Partial<Record<keyof WorkInput, string[]>>;

export type WorkValidationResult =
  | { ok: true; data: ValidWorkInput; errors: WorkFieldErrors }
  | { ok: false; data?: undefined; errors: WorkFieldErrors };

export type WorkActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: WorkFieldErrors;
  workId?: string;
};

export type WorkListResult = {
  works: Work[];
  availableTech: string[];
};
