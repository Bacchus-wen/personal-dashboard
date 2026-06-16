import type { ReactNode } from "react";
import { FloatingTools } from "@/components/chrome/floating-tools";
import { PageAction } from "@/components/chrome/page-action";
import { TopNav } from "@/components/chrome/top-nav";
import { getVisibleNavigationItems } from "@/lib/navigation/server";

export async function PageShell({
  eyebrow,
  title,
  description,
  action = "编辑",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
  children: ReactNode;
}) {
  const navigationItems = await getVisibleNavigationItems();

  return (
    <>
      <TopNav items={navigationItems} />
      <PageAction label={action} />
      <FloatingTools />
      <main className="page">
        <header className="page-head">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {children}
      </main>
    </>
  );
}
