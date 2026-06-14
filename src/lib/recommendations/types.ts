export type HomeRecommendation = {
  id: string;
  type: "article" | "video" | "project";
  title: string;
  reason: string;
  href: string;
};
