import type { ActionPriority } from "./insight-types";

export function getDateKeyInTimeZone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      throw new Error("Invalid date parts");
    }

    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().split("T")[0];
  }
}

export function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
}

export function getTodayDateString(timeZone = getUserTimeZone()): string {
  return getDateKeyInTimeZone(new Date(), timeZone);
}

export const MONTHS_ID = [
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

export const PRIORITY_STYLE: Record<
  ActionPriority,
  { label: string; bg: string; text: string; ring: string; panel: string }
> = {
  High: {
    label: "Prioritas tinggi",
    bg: "var(--tt-attention-bg)",
    text: "var(--tt-attention-text)",
    ring: "var(--tt-attention-border)",
    panel: "var(--tt-attention-bg)",
  },
  Medium: {
    label: "Prioritas sedang",
    bg: "var(--tt-warning-bg)",
    text: "var(--tt-warning-text)",
    ring: "color-mix(in srgb, var(--tt-warning-text) 30%, transparent)",
    panel: "var(--tt-warning-bg)",
  },
  Low: {
    label: "Prioritas ringan",
    bg: "var(--tt-success-bg)",
    text: "var(--tt-success-text)",
    ring: "color-mix(in srgb, var(--tt-success-text) 30%, transparent)",
    panel: "var(--tt-success-bg)",
  },
};
