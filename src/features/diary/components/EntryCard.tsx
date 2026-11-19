// ============================================================
//  src/features/diary/components/EntryCard.tsx
// ============================================================

import { Lock } from "lucide-react";
import { colors as C, fonts } from "../constants/tokens";
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

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        cursor: "pointer",
        border: isActive ? `1.5px solid ${C.ink}` : `1px solid ${C.bdL}`,
        background: isActive ? C.inkS : C.white,
        transition: "all 0.14s",
        userSelect: "none",
        outline: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between", // ⬅️ KEY
          gap: 8,
          marginBottom: 6,
        }}
      >
        {/* LEFT SIDE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
          }}
        >
          <MoodFace score={displayMood} size={20} />

          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: isActive ? C.ink : C.muted,
              fontFamily: fonts.serif,
              margin: 0,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            {entry.dateLabel}
          </p>
        </div>

        {/* RIGHT SIDE */}
        {isPast && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexShrink: 0,
            }}
          >
            <Lock size={10} color={C.sub} />
            <span
              style={{
                fontSize: 10,
                color: C.sub,
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              Hanya baca
            </span>
          </div>
        )}
      </div>

      <p
        style={{
          fontSize: 11,
          color: C.muted,
          fontStyle: "italic",
          lineHeight: 1.45,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          margin: 0,
        }}
      >
        &ldquo;{entry.preview}&rdquo;
      </p>
    </div>
  );
}
