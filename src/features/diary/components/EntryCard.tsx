// ============================================================
//  src/features/diary/components/EntryCard.tsx
// ============================================================

import { Lock } from "lucide-react";
import { getMoodLabel } from "@/components/mood/mood-face-icons";
import type { DiaryEntry } from "../types";
import { MoodFace } from "./MoodFace";

type Props = {
  entry: DiaryEntry;
  isActive: boolean;
  onClick: () => void;
};

type MoodScore = 1 | 2 | 3 | 4 | 5;

type DiaryEntryWithMoodFallback = DiaryEntry & {
  mood?: number | string | null;
  moodScore?: number | string | null;
  latestMoodScore?: number | string | null;
  selectedMood?: number | string | null;
  score?: number | string | null;
  moodLog?: {
    moodScore?: number | string | null;
    score?: number | string | null;
  } | null;
};

function clampMoodScore(value: number): MoodScore {
  if (value <= 1) return 1;
  if (value >= 5) return 5;

  const rounded = Math.round(value);

  if (rounded === 1) return 1;
  if (rounded === 2) return 2;
  if (rounded === 3) return 3;
  if (rounded === 4) return 4;
  return 5;
}

function normalizeMood(value: unknown): MoodScore | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampMoodScore(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return clampMoodScore(parsed);
    }
  }

  return null;
}

function resolveMood(entry: DiaryEntryWithMoodFallback): MoodScore {
  const candidates = [
    entry.mood,
    entry.moodScore,
    entry.latestMoodScore,
    entry.selectedMood,
    entry.score,
    entry.moodLog?.moodScore,
    entry.moodLog?.score,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeMood(candidate);
    if (normalized !== null) return normalized;
  }

  return 3;
}

export function EntryCard({ entry, isActive, onClick }: Props) {
  const isPast = !entry.isToday;
  const safeEntry = entry as DiaryEntryWithMoodFallback;
  const displayMood = resolveMood(safeEntry);
  const preview = entry.preview?.trim() ?? "";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={`dy-entry ${isActive ? "is-active" : ""}`}
    >
      <span className="dy-entry-face" aria-hidden="true">
        <MoodFace score={displayMood} size={26} />
      </span>

      <span className="dy-entry-body">
        <span className="dy-entry-date">{entry.dateLabel}</span>
        <span className="dy-entry-lock">
          {getMoodLabel(displayMood)}
          {isPast ? (
            <>
              <span aria-hidden="true">·</span>
              <Lock size={12} aria-hidden="true" /> Hanya baca
            </>
          ) : null}
        </span>
        <span className={`dy-entry-preview ${preview ? "" : "is-empty"}`}>
          {preview ? `“${preview}”` : "Belum ada cerita"}
        </span>
      </span>
    </button>
  );
}
