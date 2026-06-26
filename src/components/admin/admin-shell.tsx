"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode, SVGProps } from "react";

import { SignOutButton } from "@/components/admin/sign-out-button";
import {
  ADMIN_NAVIGATION_ITEMS,
  isAdminNavigationItemActive,
  type AdminNavigationIcon,
} from "@/lib/admin/navigation";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="admin-shell-sidebar">
        <Link className="admin-shell-brand" href="/admin">
          <span className="admin-shell-mark">T</span>
          <span>
            <strong>Theodore</strong>
            <small>内容管理后台</small>
          </span>
        </Link>

        <div className="admin-shell-nav-region">
          <p className="admin-shell-label">WORKSPACE</p>
          <nav className="admin-shell-nav" aria-label="后台导航">
            {ADMIN_NAVIGATION_ITEMS.map((item) => {
              const active = isAdminNavigationItemActive(pathname, item.href);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={active ? "active" : undefined}
                  href={item.href}
                  key={item.href}
                >
                  <AdminNavigationIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="admin-shell-footer">
          <Link className="btn" href="/">
            返回网站
          </Link>
          <SignOutButton />
        </div>
      </aside>
      <div className="admin-shell-content">{children}</div>
    </div>
  );
}

function AdminNavigationIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: AdminNavigationIcon }) {
  const paths: Record<AdminNavigationIcon, ReactNode> = {
    overview: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    plans: <><path d="M7 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="m9 9 1.5 1.5L14 7M9 15h6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1A7 7 0 0 0 14.4 5L14 2h-4l-.4 3a7 7 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 9.6 19l.4 3h4l.4-3a7 7 0 0 0 2.1-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" /></>,
    works: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 7h.01M10 7h.01M13 7h.01" /></>,
    collections: <><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z" /><path d="M5 5.5v15M9 7h6M9 11h6" /></>,
    projects: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    photos: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m5 18 5-5 3 3 2-2 4 4" /></>,
    music: <><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>,
    media: <><path d="M4 7h16v12H4zM8 7l2-3h4l2 3" /><circle cx="12" cy="13" r="3" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
