import type { Metadata } from "next";
import "./globals.css";
import { cloneDefaultSiteConfiguration } from "@/lib/site-settings/defaults";
import { getSiteSettingsRepository } from "@/lib/site-settings/server-repository";
import {
  publicMediaUrlForPath,
  resolveMediaDisplayUrl,
} from "@/lib/media/display";

export async function generateMetadata(): Promise<Metadata> {
  const configuration = await getSiteSettingsRepository()
    .getPublished()
    .catch(() => cloneDefaultSiteConfiguration());
  return {
    title: {
      default: configuration.settings.siteTitle,
      template: `%s · ${configuration.settings.displayName}`,
    },
    description: configuration.settings.siteDescription,
    icons: {
      icon: resolveMediaDisplayUrl(
        configuration.settings.faviconPath,
        publicMediaUrlForPath,
      ) ?? configuration.settings.faviconPath,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
