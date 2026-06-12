import { describe, expect, it } from "vitest";

import { getDeadlineLabel } from "./date-label";

describe("getDeadlineLabel", () => {
  const today = new Date(2026, 5, 11);

  it("marks a past deadline as overdue", () => {
    expect(getDeadlineLabel("2026-06-10", today)).toEqual({
      tone: "danger",
      text: "已逾期 1 天",
    });
  });

  it("marks the current local day as due today", () => {
    expect(getDeadlineLabel("2026-06-11", today)).toEqual({
      tone: "danger",
      text: "今天截止",
    });
  });

  it("marks the next three days as due soon", () => {
    expect(getDeadlineLabel("2026-06-14", today)).toEqual({
      tone: "warning",
      text: "剩余 3 天",
    });
  });

  it("uses a neutral label for later deadlines", () => {
    expect(getDeadlineLabel("2026-06-15", today)).toEqual({
      tone: "neutral",
      text: "2026-06-15",
    });
  });

  it("describes a missing deadline", () => {
    expect(getDeadlineLabel(null, today)).toEqual({
      tone: "neutral",
      text: "暂未设定截止日期",
    });
  });
});
