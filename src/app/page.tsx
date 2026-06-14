import { HomeDashboard } from "@/components/home/home-dashboard";
import { pickRandomHomePhotos } from "@/lib/photos/home-selection";
import { getPhotoRepository } from "@/lib/photos/server-repository";
import { getPlanRepository } from "@/lib/plans/server-repository";
import { loadHomeRecommendation } from "@/lib/recommendations/server-repository";
import { cloneDefaultSiteConfiguration } from "@/lib/site-settings/defaults";
import { getSiteSettingsRepository } from "@/lib/site-settings/server-repository";

async function loadHomePlans() {
  try {
    return await getPlanRepository().getHomePlanCandidates();
  } catch {
    return null;
  }
}

async function loadHomePhotos() {
  try {
    return pickRandomHomePhotos(await getPhotoRepository().listPublic(), 3);
  } catch {
    return null;
  }
}

export default async function Home() {
  const [planCandidates, configuration, recommendation, photos] = await Promise.all([
    loadHomePlans(),
    getSiteSettingsRepository()
      .getPublished()
      .catch(() => cloneDefaultSiteConfiguration()),
    loadHomeRecommendation(),
    loadHomePhotos(),
  ]);
  return (
    <HomeDashboard
      configuration={configuration}
      photos={photos}
      planCandidates={planCandidates}
      recommendation={recommendation}
    />
  );
}
