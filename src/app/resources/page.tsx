import { permanentRedirect } from "next/navigation";

import { RESOURCES_REDIRECT_TARGET } from "@/lib/navigation/redirects";

export default function ResourcesPage() {
  permanentRedirect(RESOURCES_REDIRECT_TARGET);
}
