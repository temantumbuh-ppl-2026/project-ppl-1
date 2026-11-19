import { describe, expect, it } from "vitest";

import {
  buildWeekForDate,
  buildWeeksFromLogs,
  getStartOfWeek,
} from "@/features/home/utils";
import type { MoodLog } from "@/features/home/types";

const TZ = "Asia/Jakarta";

function log(id: string, isoLocalNoon: string, moodScore: number): MoodLog {
  // 12:00 WIB = 05:00 UTC, aman dari pergeseran hari.
  return {
    id,
    moodScore,
    note: `catatan ${id}`,
    createdAt: new Date(`${isoLocalNoon}T05:00:00.000Z`).toISOString(),
  };
}

describe("buildWeekForDate", () => {
  const today = new Date(2026, 9, 18, 10, 0, 0); // Minggu, 18 Okt 2026

  it("membangun minggu Minggu–Sabtu yang memuat tanggal di tahun lain", () => {
    const logs = [log("a", "2025-12-30", 2), log("b", "2026-01-02", 5)];
    const week = buildWeekForDate(logs, TZ, new Date(2026, 0, 1), today);

    const dates = week.days.map((d) => d.fullDate!.toDateString());
    expect(dates[0]).toBe(new Date(2025, 11, 28).toDateString());
    expect(dates[6]).toBe(new Date(2026, 0, 3).toDateString());

    expect(week.days[2]?.score).toBe(2); // Selasa 30 Des 2025
    expect(week.days[5]?.score).toBe(5); // Jumat 2 Jan 2026
    expect(week.days[5]?.note).toBe("catatan b");
  });

  it("hari tanpa catatan bernilai null, bukan skor netral atau nol", () => {
    const week = buildWeekForDate([], TZ, new Date(2026, 9, 14), today);
    expect(week.days.every((d) => d.score === null)).toBe(true);
  });

  it("menandai hari ini dan mengosongkan skor untuk tanggal mendatang", () => {
    const week = buildWeekForDate(
      [log("t", "2026-10-18", 4)],
      TZ,
      today,
      today,
    );
    expect(week.days[0]?.today).toBe(true);
    expect(week.days[0]?.score).toBe(4);
    expect(week.days.slice(1).every((d) => d.score === null)).toBe(true);
  });

  it("sama dengan minggu terakhir buildWeeksFromLogs untuk hari ini", () => {
    const logs = [log("x", "2026-10-13", 3), log("y", "2026-10-17", 1)];
    const viaWeeks = buildWeeksFromLogs(logs, TZ, 1)[0]!;
    const viaDate = buildWeekForDate(logs, TZ, new Date());
    expect(viaDate.days.map((d) => d.score)).toEqual(
      viaWeeks.days.map((d) => d.score),
    );
  });
});

describe("getStartOfWeek", () => {
  it("mengembalikan hari Minggu pukul 00:00", () => {
    const start = getStartOfWeek(new Date(2026, 9, 21, 15, 30));
    expect(start.getDay()).toBe(0);
    expect(start.getDate()).toBe(18);
    expect(start.getHours()).toBe(0);
  });
});
