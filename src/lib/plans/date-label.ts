export type DeadlineLabel = {
  tone: "danger" | "warning" | "neutral";
  text: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function localDayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getDeadlineLabel(
  deadline: string | null,
  today = new Date(),
): DeadlineLabel {
  if (!deadline) {
    return { tone: "neutral", text: "暂未设定截止日期" };
  }

  const days = Math.round(
    (localDayNumber(parseLocalDate(deadline)) - localDayNumber(today)) /
      DAY_IN_MS,
  );

  if (days < 0) {
    return { tone: "danger", text: `已逾期 ${Math.abs(days)} 天` };
  }
  if (days === 0) {
    return { tone: "danger", text: "今天截止" };
  }
  if (days <= 3) {
    return { tone: "warning", text: `剩余 ${days} 天` };
  }

  return { tone: "neutral", text: deadline };
}
