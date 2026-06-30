"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { MoonIcon, SunIcon, UpIcon, WavesIcon } from "@/components/icons";

type ThemeId = "paper-editorial" | "night-radio";

function readTheme(): ThemeId {
  return document.body.dataset.theme === "night-radio"
    ? "night-radio"
    : "paper-editorial";
}

export function FloatingTools() {
  const [theme, setTheme] = useState<ThemeId | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync the toggle icon to the theme applied by the inline pre-paint script
    // in the root layout, and mark mounted so the portal only renders on the
    // client. Reading the DOM on mount avoids a hydration mismatch.
    /* eslint-disable react-hooks/set-state-in-effect */
    setTheme(readTheme());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const toggleQuiet = () => document.body.classList.toggle("quiet");
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const toggleTheme = () => {
    const next: ThemeId =
      readTheme() === "night-radio" ? "paper-editorial" : "night-radio";
    document.body.dataset.theme = next;
    try {
      localStorage.setItem("site-theme", next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    setTheme(next);
  };

  const isDark = theme === "night-radio";

  // Render at the top of <body> so the fixed position is always relative to the
  // viewport, never trapped by a transformed/scrollable ancestor container.
  if (!mounted) return null;

  return createPortal(
    <div className="floating-tools">
      <button
        className="tool-btn"
        aria-label={isDark ? "切换到亮色主题" : "切换到暗色主题"}
        title={isDark ? "切换到亮色主题" : "切换到暗色主题"}
        onClick={toggleTheme}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
      <button
        className="tool-btn"
        aria-label="切换背景氛围"
        title="切换背景氛围"
        onClick={toggleQuiet}
      >
        <WavesIcon />
      </button>
      <button
        className="tool-btn"
        aria-label="返回顶部"
        title="返回顶部"
        onClick={scrollTop}
      >
        <UpIcon />
      </button>
    </div>,
    document.body,
  );
}
