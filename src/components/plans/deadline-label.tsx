"use client";

import { useSyncExternalStore } from "react";

import { getDeadlineLabel } from "@/lib/plans/date-label";

const subscribe = () => () => {};

export function DeadlineLabel({ deadline }: { deadline: string | null }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const label = hydrated
    ? getDeadlineLabel(deadline)
    : { tone: "neutral", text: deadline ?? "暂未设定截止日期" };

  return <span className={`pill deadline-${label.tone}`}>{label.text}</span>;
}
