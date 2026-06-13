import { permanentRedirect } from "next/navigation";

import { BLOGS_REDIRECT_TARGET } from "@/lib/navigation/redirects";

export default function BlogsPage() {
  permanentRedirect(BLOGS_REDIRECT_TARGET);
}
