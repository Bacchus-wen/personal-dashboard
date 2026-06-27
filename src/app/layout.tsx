import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { cloneDefaultSiteConfiguration } from "@/lib/site-settings/defaults";

// Editorial Latin display serif. Chinese falls back to system serif via the
// --font-display stack in globals.css. Only the Latin subset is downloaded.
const editorialSerif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-editorial-serif",
  display: "swap",
});
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configuration = await getSiteSettingsRepository()
    .getPublished()
    .catch(() => cloneDefaultSiteConfiguration());

  return (
    <html lang="zh-CN" className={editorialSerif.variable}>
      <body data-theme={configuration.settings.themeId} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('site-theme');if(t==='paper-editorial'||t==='night-radio'){document.body.dataset.theme=t;}}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
