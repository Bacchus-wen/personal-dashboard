import { HomeDashboard } from "@/components/home/home-dashboard";
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

export default async function Home() {
  const [planCandidates, configuration, recommendation] = await Promise.all([
    loadHomePlans(),
    getSiteSettingsRepository()
      .getPublished()
      .catch(() => cloneDefaultSiteConfiguration()),
    loadHomeRecommendation(),
  ]);
  return (
    <HomeDashboard
      configuration={configuration}
      planCandidates={planCandidates}
      recommendation={recommendation}
    />
  );
}
