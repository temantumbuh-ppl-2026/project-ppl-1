"use client";

import {
  EmptyReflectionState,
  InsightPlaceholderCard,
  NotebookReflection,
  QuoteBlock,
  TopCard,
} from "./insight-primitives";
import { getMoodLabel } from "@/components/mood/mood-face-icons";
import type { DayInsight } from "../lib/insight-types";
import {
  formatDateID,
  getEmotionalStatus,
  getRelativeLabel,
} from "../lib/insight-utils";

export function InsightReflectionSection({
  effectiveDate,
  availableDates,
  isToday,
  selectedInsight,
}: {
  effectiveDate: string;
  availableDates: string[];
  isToday: boolean;
  selectedInsight?: Omit<DayInsight, "date">;
}) {
  const hasInsight = Boolean(selectedInsight);
  const moodStatus = selectedInsight
    ? getEmotionalStatus(selectedInsight.mood)
    : null;

  return (
    <div className="ins-reflect-grid">
      <TopCard>
        <div className="ins-reflect-title">
          <div className="min-w-0">
            <span className="ins-kicker">
              {isToday ? "Refleksi AI hari ini" : "Refleksi AI harian"}
            </span>
            <h2>
              {hasInsight && selectedInsight
                ? getMoodLabel(Math.round(selectedInsight.mood))
                : "Refleksi AI Harian"}
            </h2>
            <p>{`${getRelativeLabel(effectiveDate, availableDates)} - ${formatDateID(effectiveDate)}`}</p>
            {hasInsight && moodStatus ? (
              <span
                className="ins-status"
                style={{ background: moodStatus.bg, color: moodStatus.color }}
              >
                {moodStatus.label}
              </span>
            ) : null}
          </div>

          {hasInsight && selectedInsight ? (
            <div
              className="ins-score"
              role="img"
              aria-label={`Skor mood ${selectedInsight.mood} dari 5`}
            >
              <strong>{selectedInsight.mood}</strong>
              <span>/5</span>
            </div>
          ) : null}
        </div>

        {hasInsight && selectedInsight ? (
          <>
            <NotebookReflection text={selectedInsight.reflection} />

            <div className="ins-pattern">
              <span>Pola yang terlihat</span>
              <p>{selectedInsight.pattern}</p>
            </div>
          </>
        ) : (
          <>
            <EmptyReflectionState isToday={isToday} />
            <InsightPlaceholderCard title="Pola yang terlihat" />
          </>
        )}
      </TopCard>

      {hasInsight && selectedInsight ? (
        <QuoteBlock text={selectedInsight.affirmation} />
      ) : (
        <InsightPlaceholderCard title="Pengingat hari ini" />
      )}
    </div>
  );
}
