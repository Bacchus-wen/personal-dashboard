"use client";

import { SunIcon, UpIcon } from "@/components/icons";

export function FloatingTools() {
  const toggleQuiet = () => document.body.classList.toggle("quiet");
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="floating-tools">
      <button className="tool-btn" aria-label="切换背景氛围" title="切换背景氛围" onClick={toggleQuiet}>
        <SunIcon />
      </button>
      <button className="tool-btn" aria-label="返回顶部" title="返回顶部" onClick={scrollTop}>
        <UpIcon />
      </button>
    </div>
  );
}
