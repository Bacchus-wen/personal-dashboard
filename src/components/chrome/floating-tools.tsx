"use client";

import { useEffect, useState } from "react";

import { MoonIcon, SunIcon, UpIcon, WavesIcon } from "@/components/icons";

type ThemeId = "paper-editorial" | "night-radio";

function readTheme(): ThemeId {
  return document.body.dataset.theme === "night-radio"
    ? "night-radio"
    : "paper-editorial";
}

export function FloatingTools() {
  const [theme, setTheme] = useState<ThemeId | null>(null);

  useEffect(() => {
    // Sync the toggle icon to the theme applied by the inline pre-paint script
    // in the root layout. Reading the DOM on mount avoids a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readTheme());
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

  return (
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
    </div>
  );
}
