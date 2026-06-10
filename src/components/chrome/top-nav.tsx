"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NavIcon } from "@/components/icons";
import { navigation } from "@/data/site-content";

export function TopNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [glider, setGlider] = useState({ x: 8, y: 8 });
  const activeId = pathname === "/" || pathname === "/album" ? "home" : pathname.slice(1);

  const moveTo = (element: HTMLElement | null) => {
    if (element) setGlider({ x: element.offsetLeft, y: element.offsetTop });
  };

  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>("[data-active='true']") ?? null;
    moveTo(active);
  }, [pathname]);

  return (
    <nav
      ref={navRef}
      className="top-nav glass"
      aria-label="页面导航"
      onPointerLeave={() => moveTo(navRef.current?.querySelector<HTMLElement>("[data-active='true']") ?? null)}
    >
      <span className="nav-glider" style={{ transform: `translate3d(${glider.x}px, ${glider.y}px, 0)` }} />
      {navigation.map((item, index) => {
        const active = activeId === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={index === 0 ? "avatar-link" : "nav-link"}
            data-active={active}
            aria-label={item.label}
            title={item.label}
            onPointerEnter={(event) => moveTo(event.currentTarget)}
          >
            {index === 0 ? <span className="avatar">T</span> : <NavIcon name={item.id} />}
          </Link>
        );
      })}
    </nav>
  );
}
