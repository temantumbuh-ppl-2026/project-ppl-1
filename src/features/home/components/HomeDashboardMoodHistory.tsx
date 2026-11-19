"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { MoodFaceIcon } from "@/components/mood/mood-face-icons";
import {
  MoodDayCard,
  getMoodDayState,
  getMoodDayStatusLabel,
  moodToneStyle,
} from "./MoodDayCard";
import { WeekFilterBar } from "./WeekFilterBar";
import { isSameLocalDay } from "../utils";
import type { WeekData } from "../types";

function formatRange(week: WeekData) {
  const first = week.days[0]?.fullDate;
  const last = week.days[6]?.fullDate;
  if (!first || !last) return week.label;

  const sameYear = first.getFullYear() === last.getFullYear();
  const sameMonth = sameYear && first.getMonth() === last.getMonth();

  if (sameMonth) {
    const monthYear = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(last);
    return `${first.getDate()}–${last.getDate()} ${monthYear}`;
  }

  const fmt = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `${fmt.format(first)} – ${fmt.format(last)}${sameYear ? ` ${last.getFullYear()}` : ""}`;
}

export function HomeDashboardMoodHistory({
  week,
  today,
  selectedDate,
  onSelectDay,
  onPickDate,
  onPrev,
  onNext,
  onToday,
  disablePrev,
  disableNext,
  isFetching,
  isError,
  onRetry,
}: {
  week: WeekData;
  today: Date;
  selectedDate: Date;
  onSelectDay: (date: Date) => void;
  onPickDate: (date: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  disablePrev: boolean;
  disableNext: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const isCurrentWeek = week.days.some((d) => d.today);
  const selected =
    week.days.find(
      (d) => d.fullDate && isSameLocalDay(d.fullDate, selectedDate),
    ) ?? null;
  const selectedState = selected ? getMoodDayState(selected, today) : "empty";
  const note = typeof selected?.note === "string" ? selected.note.trim() : "";

  const selectedDateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(selectedDate);

  return (
    <section className="dash-mood-card" aria-labelledby="mood-history-title">
      <div className="dash-section-header">
        <div>
          <span className="dash-kicker">Riwayat perasaan</span>
          <h2 id="mood-history-title">
            {isCurrentWeek ? "Perasaanmu minggu ini" : "Perasaanmu minggu itu"}
          </h2>
          <p aria-live="polite">{formatRange(week)}</p>
        </div>

        <WeekFilterBar
          selectedDate={selectedDate}
          today={today}
          onDateChange={onPickDate}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
          disablePrev={disablePrev}
          disableNext={disableNext}
          isCurrentWeek={isCurrentWeek}
        />
      </div>

      {isError ? (
        <div className="dash-state error" role="alert">
          <AlertCircle size={22} aria-hidden="true" />
          <p style={{ margin: 0 }}>
            Riwayat mood gagal dimuat. Coba lagi untuk melihat catatanmu.
          </p>
          <button
            type="button"
            className="support-action"
            onClick={onRetry}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : null}
            Coba lagi
          </button>
        </div>
      ) : (
        <>
          <div className="dash-mood-grid">
            {week.days.map((d, i) => (
              <MoodDayCard
                key={`${week.id}-${i}`}
                d={d}
                today={today}
                selected={
                  !!d.fullDate && isSameLocalDay(d.fullDate, selectedDate)
                }
                onSelect={onSelectDay}
              />
            ))}
          </div>

          <div
            className={`dash-mood-detail ${selectedState === "recorded" ? "recorded" : "empty"}`}
            style={moodToneStyle(selected?.score ?? null)}
            aria-live="polite"
          >
            <div className="detail-face" aria-hidden="true">
              {selected && selectedState === "recorded" ? (
                <MoodFaceIcon score={selected.score} size={32} />
              ) : (
                "·"
              )}
            </div>
            <div>
              <span>{selectedDateLabel}</span>
              <strong>
                {selected
                  ? getMoodDayStatusLabel(selected, selectedState)
                  : "Belum dicatat"}
              </strong>
              <p>
                {selectedState === "recorded"
                  ? note
                    ? `Catatan: “${note}”`
                    : "Kamu mencatat mood tanpa catatan tambahan."
                  : "Tidak ada check-in mood pada tanggal ini. Tidak apa-apa—kamu bisa mulai lagi kapan saja."}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
