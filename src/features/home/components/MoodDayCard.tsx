"use client";

import type { CSSProperties } from "react";
import { MoodFaceIcon, getMoodLabel } from "@/components/mood/mood-face-icons";
import { MOOD_COLORS } from "@/lib/mood/palette";
import type { MoodDay } from "../types";

const FULL_DAY = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export type MoodDayState = "recorded" | "empty" | "future";

export function getMoodDayState(d: MoodDay, today: Date): MoodDayState {
  if (d.score !== null) return "recorded";
  if (d.fullDate && d.fullDate > today && !d.today) return "future";
  return "empty";
}

/** Variabel warna kartu mengikuti palet mood redesign. */
export function moodToneStyle(score: number | null): CSSProperties {
  const tone = score !== null ? MOOD_COLORS[score] : undefined;
  if (!tone) return {};
  return {
    "--day-color": tone.stroke,
    "--day-tint": tone.bg,
    "--day-tint-strong": `${tone.stroke}38`,
    "--day-border": `${tone.stroke}59`,
    "--detail-color": tone.stroke,
    "--detail-tint": tone.bg,
  } as CSSProperties;
}

export function getMoodDayStatusLabel(d: MoodDay, state: MoodDayState) {
  if (state === "recorded") return getMoodLabel(d.score);
  if (state === "future") return "Belum tiba";
  return "Belum dicatat";
}

export function MoodDayCard({
  d,
  today,
  selected,
  onSelect,
}: {
  d: MoodDay;
  today: Date;
  selected: boolean;
  onSelect: (date: Date) => void;
}) {
  const state = getMoodDayState(d, today);
  const label = getMoodDayStatusLabel(d, state);
  const fullDay = d.fullDate ? FULL_DAY[d.fullDate.getDay()] : d.day;
  const longDate = d.fullDate
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d.fullDate)
    : `${d.date} ${d.month}`;

  return (
    <button
      type="button"
      className={`dash-day ${state} ${d.today ? "today" : ""} ${selected ? "selected" : ""}`}
      style={moodToneStyle(d.score)}
      disabled={state === "future"}
      aria-pressed={state === "future" ? undefined : selected}
      aria-label={`${fullDay}, ${longDate}: ${label}${d.today ? " (hari ini)" : ""}`}
      onClick={() => d.fullDate && onSelect(d.fullDate)}
    >
      <span aria-hidden="true">
        {d.day}
        <b>{d.date}</b>
      </span>
      <i aria-hidden="true">
        {state === "recorded" ? (
          <MoodFaceIcon score={d.score} size={30} />
        ) : (
          "·"
        )}
      </i>
      <strong aria-hidden="true">{label}</strong>
      {d.today ? <small aria-hidden="true">Hari ini</small> : null}
    </button>
  );
}
