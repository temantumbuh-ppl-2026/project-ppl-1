import { MONTHS_ID } from "./insight-data";
import type { TrendPoint } from "./insight-types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDateID(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} ${MONTHS_ID[month - 1]} ${year}`;
}

export function getDayDifference(fromDate: string, toDate: string) {
  const a = new Date(`${fromDate}T00:00:00`);
  const b = new Date(`${toDate}T00:00:00`);
  const diffMs = a.getTime() - b.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getRelativeLabel(dateStr: string, allDates: string[]) {
  const sorted = [...allDates].sort();
  const latest = sorted[sorted.length - 1];
  const diff = getDayDifference(latest, dateStr);

  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  return `${diff} hari lalu`;
}

export function getEmotionalStatus(score: number) {
  if (score >= 4.5) {
    return {
      label: "Kondisi emosional sangat baik",
      color: "var(--tt-dashboard-success)",
      bg: "var(--tt-dashboard-success-soft)",
    };
  }
  if (score >= 3.5) {
    return {
      label: "Kondisi emosional baik",
      color: "var(--tt-dashboard-success)",
      bg: "var(--tt-dashboard-success-soft)",
    };
  }
  if (score >= 2.5) {
    return {
      label: "Kondisi cukup stabil",
      color: "var(--tt-dashboard-brand)",
      bg: "var(--tt-dashboard-brand-soft)",
    };
  }
  if (score >= 1.5) {
    return {
      label: "Perlu menjaga kondisi emosional",
      color: "var(--tt-dashboard-warning)",
      bg: "var(--tt-dashboard-warning-soft)",
    };
  }
  return {
    label: "Perlu perhatian lebih",
    color: "var(--tt-dashboard-danger)",
    bg: "#FEF2F2",
  };
}

export function getMonthData(
  year: number,
  monthIndexZeroBased: number,
  moodMap: Record<string, number>,
): TrendPoint[] {
  const daysInMonth = new Date(year, monthIndexZeroBased + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const iso = `${year}-${String(monthIndexZeroBased + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const mood = moodMap[iso] || null;
    return { day, mood, iso };
  });
}

export function getAverageMood(data: TrendPoint[]) {
  const valid = data.filter((item) => item.mood !== null) as { mood: number }[];
  if (!valid.length) return 0;
  return Number(
    (valid.reduce((sum, item) => sum + item.mood, 0) / valid.length).toFixed(1),
  );
}

export function getPeakMood(data: TrendPoint[]) {
  const valid = data.filter((item) => item.mood !== null) as { mood: number }[];
  if (!valid.length) return 0;
  return Math.round(Math.max(...valid.map((item) => item.mood)));
}

export function getLowMood(data: TrendPoint[]) {
  const valid = data.filter((item) => item.mood !== null) as { mood: number }[];
  if (!valid.length) return 0;
  return Math.round(Math.min(...valid.map((item) => item.mood)));
}

export function countStableDays(data: TrendPoint[], threshold = 3.5) {
  const valid = data.filter((item) => item.mood !== null) as { mood: number }[];
  return valid.filter((item) => item.mood >= threshold).length;
}

export function getAvgLabel(avgMood: number) {
  if (avgMood >= 4.5) return "Sangat baik";
  if (avgMood >= 3.5) return "Cenderung baik";
  if (avgMood >= 2.5) return "Cukup stabil";
  if (avgMood >= 1.5) return "Perlu dijaga";
  return "Perlu perhatian";
}
