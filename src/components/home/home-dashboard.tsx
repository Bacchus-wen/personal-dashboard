"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";

import { FloatingTools } from "@/components/chrome/floating-tools";
import { HomeAlbumPreview } from "@/components/home/home-album-preview";
import { RecentPlanWidget } from "@/components/home/recent-plan-widget";
import { AdminIcon, NavIcon } from "@/components/icons";
import { navigation } from "@/data/site-content";
import {
  publicMediaUrlForPath,
  resolveMediaDisplayUrl,
} from "@/lib/media/display";
import { MOBILE_HOME_MODULE_ORDER } from "@/lib/site-settings/defaults";
import type {
  HomeLayoutItem,
  HomeModuleId,
  PublishedSiteConfiguration,
} from "@/lib/site-settings/types";
import type { Plan } from "@/lib/plans/types";
import type { PublicPhoto } from "@/lib/photos/types";
import type { HomeRecommendation } from "@/lib/recommendations/types";

function Greeting() {
  const [text, setText] = useState("Good Evening");
  useEffect(() => {
    const update = () => {
      const hour = new Date().getHours();
      setText(
        hour < 5
          ? "Good Night"
          : hour < 12
            ? "Good Morning"
            : hour < 18
              ? "Good Afternoon"
              : hour < 22
                ? "Good Evening"
                : "Good Night",
      );
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
  return (
    <section className="clock glass card lift">
      <div className="clock-time">
        {now?.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) ?? "--:--"}
      </div>
      <small>
        {now?.toLocaleDateString("zh-CN", {
          month: "long",
          day: "numeric",
          weekday: "short",
        }) ?? "今天"}
      </small>
    </section>
  );
}

function Calendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return (
    <section className="calendar glass card lift">
      <h3>
        {now.toLocaleDateString("en-US", { month: "long" })} {year}
      </h3>
      <div className="calendar-grid">
        {"一二三四五六日".split("").map((day) => (
          <span key={day}>{day}</span>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: days }, (_, index) => index + 1).map((day) => (
          <span className={day === now.getDate() ? "today" : ""} key={day}>
            {day}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProfileAvatar({
  displayName,
  path,
}: {
  displayName: string;
  path: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="avatar">{displayName.slice(0, 1)}</span>;
  return (
    // External avatar URLs are user-configurable, so next/image cannot know their hosts.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="avatar profile-avatar"
      src={resolveMediaDisplayUrl(path, publicMediaUrlForPath) ?? path}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}

function moduleStyle(item: HomeLayoutItem) {
  return {
    "--grid-x": item.x,
    "--grid-y": item.y,
    "--grid-width": item.width,
    "--grid-height": item.height,
    "--mobile-order": MOBILE_HOME_MODULE_ORDER.indexOf(item.moduleId) + 1,
  } as CSSProperties;
}

function HomeModule({
  item,
  children,
}: {
  item: HomeLayoutItem;
  children: ReactNode;
}) {
  return (
    <div
      className="home-module"
      data-home-module={item.moduleId}
      style={moduleStyle(item)}
    >
      {children}
    </div>
  );
}

export function HomeDashboard({
  configuration,
  photos,
  planCandidates,
  recommendation,
}: {
  configuration: PublishedSiteConfiguration;
  photos: PublicPhoto[] | null;
  planCandidates: Plan[] | null;
  recommendation: HomeRecommendation | null;
}) {
  const { settings, socialLinks, layout } = configuration;
  const positions = Object.fromEntries(
    layout.map((item) => [item.moduleId, item]),
  ) as Record<HomeModuleId, HomeLayoutItem>;
  const visible = settings.moduleVisibility;

  return (
    <>
      <FloatingTools />
      <main className="home-shell">
        <HomeModule item={positions.navigation}>
          <aside className="home-side glass">
            <div className="profile">
              <ProfileAvatar
                displayName={settings.displayName}
                path={settings.avatarPath}
              />
              <div>
                <strong>{settings.displayName}</strong>
                <span className="status">{settings.statusText}</span>
              </div>
            </div>
            <p className="side-label">GENERAL</p>
            <nav className="side-menu" aria-label="主页导航">
              {navigation.slice(1).map((item) => (
                <Link key={item.id} href={item.href}>
                  <NavIcon name={item.id} />
                  {item.label}
                </Link>
              ))}
              <Link href="/admin">
                <AdminIcon />
                管理后台
              </Link>
            </nav>
          </aside>
        </HomeModule>

        {visible.album ? (
          <HomeModule item={positions.album}>
            <HomeAlbumPreview photos={photos} />
          </HomeModule>
        ) : null}

        <HomeModule item={positions.welcome}>
          <Link className="welcome glass card lift" href="/about">
            <div>
              <div className="welcome-mark">
                {settings.displayName.slice(0, 2).toUpperCase()}
              </div>
              <p className="eyebrow">PERSONAL SPACE</p>
              <Greeting />
              <p>I&apos;m {settings.displayName}, nice to meet you.</p>
            </div>
          </Link>
        </HomeModule>

        <HomeModule item={positions.socials}>
          <section className="socials">
            {socialLinks
              .filter((link) => link.enabled)
              .map((social) => (
                <a
                  className="glass"
                  href={social.href}
                  key={social.id}
                  rel={
                    social.href.startsWith("https://")
                      ? "noreferrer noopener"
                      : undefined
                  }
                  target={
                    social.href.startsWith("https://") ? "_blank" : undefined
                  }
                >
                  {social.label}
                </a>
              ))}
          </section>
        </HomeModule>

        {visible.recommendation && recommendation ? (
          <HomeModule item={positions.recommendation}>
            <a
              className="recommend glass card lift"
              href={recommendation.href}
              rel="noreferrer noopener"
              target="_blank"
            >
              <span className="eyebrow">随机推荐 · {recommendation.type}</span>
              <h3>{recommendation.title}</h3>
              <p>{recommendation.reason}</p>
            </a>
          </HomeModule>
        ) : null}

        {visible.recentPlans ? (
          <HomeModule item={positions.recentPlans}>
            <RecentPlanWidget candidates={planCandidates} />
          </HomeModule>
        ) : null}

        {visible.clock ? (
          <HomeModule item={positions.clock}>
            <Clock />
          </HomeModule>
        ) : null}

        {visible.calendar ? (
          <HomeModule item={positions.calendar}>
            <Calendar />
          </HomeModule>
        ) : null}

        {visible.music ? (
          <HomeModule item={positions.music}>
            <section className="music-widget glass card lift">
              <span aria-hidden="true">♪</span>
              <div>
                <strong>Close To You</strong>
                <div className="music-progress" />
              </div>
              <button type="button" aria-label="播放音乐">
                ▶
              </button>
            </section>
          </HomeModule>
        ) : null}
        {settings.filingNumber ? (
          <a
            className="home-filing"
            href={settings.filingUrl ?? undefined}
            rel={settings.filingUrl ? "noreferrer noopener" : undefined}
            target={settings.filingUrl ? "_blank" : undefined}
          >
            {settings.filingNumber}
          </a>
        ) : null}
      </main>
    </>
  );
}
