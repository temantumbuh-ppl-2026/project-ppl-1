import type { MoodLog, WeekData, MoodDay } from "./types";

export const DAY_LABELS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export const MONTH_LABELS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Asia/Jakarta";
  }
}

export function getLocalDateString(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().split("T")[0]!;
  }
}

export function getWeekOfMonth(date: Date) {
  return Math.ceil(date.getDate() / 7);
}

export function buildWeeksFromLogs(
  logs: MoodLog[],
  timezone: string,
  totalWeeks = 24,
): WeekData[] {
  const logByDate = new Map<string, MoodLog>();

  for (const log of logs) {
    const key = getLocalDateString(new Date(log.createdAt), timezone);
    if (!logByDate.has(key)) {
      logByDate.set(key, log);
    }
  }

  const today = new Date();
  const todayDow = today.getDay();
  const weeks: WeekData[] = [];

  for (let w = totalWeeks - 1; w >= 0; w--) {
    const days: MoodDay[] = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - todayDow - w * 7);

    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + d);

      const isToday = dayDate.toDateString() === today.toDateString();
      const isFuture = dayDate > today;
      const key = getLocalDateString(dayDate, timezone);
      const log = logByDate.get(key) ?? null;

      days.push({
        day: DAY_LABELS_ID[dayDate.getDay()]!,
        date: dayDate.getDate(),
        month: dayDate.toLocaleDateString("id-ID", { month: "short" }),
        score: isFuture ? null : (log?.moodScore ?? null),
        note: log?.note ?? null,
        today: isToday,
        fullDate: dayDate,
      });
    }

    const first = days[0]!;
    const last = days[6]!;
    const firstDate = first.fullDate ?? new Date();

    const monthIndex = firstDate.getMonth();
    const year = firstDate.getFullYear();
    const monthName = MONTH_LABELS_ID[monthIndex]!;
    const weekOfMonth = getWeekOfMonth(firstDate);

    weeks.push({
      id: `${year}-${monthIndex + 1}-w${weekOfMonth}-${first.date}-${last.date}`,
      label: `${first.date} – ${last.date} ${last.month} ${year}`,
      shortLabel: `Minggu ${weekOfMonth}`,
      monthYearLabel: `${monthName} ${year}`,
      weekOfMonth,
      year,
      monthIndex,
      monthName,
      days,
    });
  }

  return weeks;
}

export function computeLongestStreak(
  logs: MoodLog[],
  timezone: string,
): number {
  if (!logs.length) return 0;

  const dates = [
    ...new Set(
      logs.map((l) => getLocalDateString(new Date(l.createdAt), timezone)),
    ),
  ].sort();

  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round(
      (new Date(`${dates[i]}T00:00:00Z`).getTime() -
        new Date(`${dates[i - 1]}T00:00:00Z`).getTime()) /
        86400000,
    );

    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
  }

  return longest;
}

export function getUniqueYears(weeks: WeekData[]) {
  return [...new Set(weeks.map((w) => w.year))].sort((a, b) => a - b);
}

export function getUniqueMonthsByYear(weeks: WeekData[], year: number) {
  const monthMap = new Map<number, string>();

  weeks
    .filter((w) => w.year === year)
    .forEach((w) => {
      if (!monthMap.has(w.monthIndex)) {
        monthMap.set(w.monthIndex, w.monthName);
      }
    });

  return [...monthMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([value, label]) => ({ value, label }));
}

export function getUniqueWeeksByMonthYear(
  weeks: WeekData[],
  year: number,
  monthIndex: number,
) {
  return weeks
    .filter((w) => w.year === year && w.monthIndex === monthIndex)
    .sort((a, b) => a.weekOfMonth - b.weekOfMonth)
    .map((w) => ({
      value: w.id,
      label: `Minggu ${w.weekOfMonth}`,
    }));
}

export function getInitialSelectedWeek(weeks: WeekData[]) {
  return weeks[weeks.length - 1] ?? null;
}

export function findWeekByDate(
  weeks: WeekData[],
  date: Date,
): WeekData | undefined {
  const targetTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();

  return weeks.find((week) =>
    week.days.some((day) => {
      if (!day.fullDate) return false;
      const dayTime = new Date(
        day.fullDate.getFullYear(),
        day.fullDate.getMonth(),
        day.fullDate.getDate(),
      ).getTime();
      return dayTime === targetTime;
    }),
  );
}
