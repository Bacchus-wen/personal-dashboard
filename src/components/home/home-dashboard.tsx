"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FloatingTools } from "@/components/chrome/floating-tools";
import { RecentPlanWidget } from "@/components/home/recent-plan-widget";
import { AdminIcon, NavIcon } from "@/components/icons";
import { navigation, socials } from "@/data/site-content";
import type { Plan } from "@/lib/plans/types";

function Greeting() {
  const [text, setText] = useState("Good Evening");
  useEffect(() => {
    const update = () => {
      const hour = new Date().getHours();
      setText(hour < 5 ? "Good Night" : hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : hour < 22 ? "Good Evening" : "Good Night");
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return <h1>{text}</h1>;
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, []);
  return <section className="clock glass card lift"><div className="clock-time">{now?.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }) ?? "--:--"}</div><small>{now?.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" }) ?? "今天"}</small></section>;
}

function Calendar() {
  return <section className="calendar glass card lift"><h3>June 2026</h3><div className="calendar-grid">{"一二三四五六日".split("").map((day) => <span key={day}>{day}</span>)}{Array.from({ length: 30 }, (_, i) => i + 1).map((day) => <span className={day === 10 ? "today" : ""} key={day}>{day}</span>)}</div></section>;
}

export function HomeDashboard({ planCandidates }: { planCandidates: Plan[] | null }) {
  return (
    <>
    <FloatingTools />
    <main className="home-shell">
      <aside className="home-side glass">
        <div className="profile"><span className="avatar">T</span><div><strong>Theodore</strong><span className="status">正在记录生活</span></div></div>
        <p className="side-label">GENERAL</p>
        <nav className="side-menu" aria-label="主页导航">{navigation.slice(1).map((item) => <Link key={item.id} href={item.href}><NavIcon name={item.id} />{item.label}</Link>)}<Link href="/admin"><AdminIcon />管理后台</Link></nav>
      </aside>
      <div className="home-main">
        <Link className="album-preview glass lift" href="/album" aria-label="进入相册"><div className="photo-strip">{[1, 2, 3, 4].map((item) => <span className="mini-photo" key={item} />)}</div><span className="preview-label">Album · 最近的光影</span></Link>
        <section className="welcome glass card lift"><div><div className="welcome-mark">TH</div><p className="eyebrow">PERSONAL SPACE</p><Greeting /><p>I&apos;m Theodore, nice to meet you.</p></div></section>
        <section className="socials">{socials.map((social) => <a className="glass" href="#" key={social}>{social}</a>)}</section>
        <div className="home-bottom">
          <Link className="story glass card lift" href="/album"><div className="story-row"><div className="thumb" /><div><span className="eyebrow">PHOTO NOTE</span><h3>暮色之后的散步</h3><p>短暂离开屏幕，收集城市边缘的颜色。</p></div></div></Link>
          <Link className="recommend glass card lift" href="/resources"><span className="eyebrow">随机推荐</span><h3>CSS · Glass & Light</h3><p>关于柔光背景与可读性平衡的随手笔记。</p><div className="metrics mono"><span>Views —</span><span>Marks —</span></div></Link>
        </div>
      </div>
      <aside className="home-widgets"><Clock /><Calendar /><RecentPlanWidget candidates={planCandidates} /></aside>
    </main>
    </>
  );
}
