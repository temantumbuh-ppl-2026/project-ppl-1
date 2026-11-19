"use client";

import {
  EmptyReflectionState,
  InsightPlaceholderCard,
  NotebookReflection,
  QuoteBlock,
  TopCard,
  TopCardHeader,
} from "./insight-primitives";
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
    <TopCard>
      <TopCardHeader
        title="Refleksi AI Harian"
        subtitle={`${getRelativeLabel(effectiveDate, availableDates)} - ${formatDateID(effectiveDate)}`}
        right={
          hasInsight && selectedInsight && moodStatus ? (
            <div
              className="shrink-0 rounded-2xl border px-4 py-3 text-right"
              style={{
                background: "rgba(255,255,255,0.7)",
                borderColor: "rgba(25,39,44,0.06)",
              }}
            >
              <div className="flex items-end justify-end gap-1">
                <span
                  className="text-[40px] font-bold leading-none tracking-[-0.03em]"
                  style={{ color: "var(--tt-dashboard-brand-deep)" }}
                >
                  {selectedInsight.mood}
                </span>
                <span
                  className="pb-1 text-base font-semibold leading-none"
                  style={{ color: "var(--tt-dashboard-text-2)" }}
                >
                  /5
                </span>
              </div>

              <span
                className="mt-2 inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold"
                style={{
                  background: moodStatus.bg,
                  color: moodStatus.color,
                  fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
                }}
              >
                {moodStatus.label}
              </span>
            </div>
          ) : null
        }
      />

      <div
        className="flex flex-col gap-5 px-6 py-6 xl:flex-1"
        style={{
          fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
        }}
      >
        {hasInsight && selectedInsight ? (
          <>
            {/* Notebook-style reflection */}
            <NotebookReflection text={selectedInsight.reflection} />

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Pola yang terlihat — TANPA dot kiri */}
              <div
                className="relative overflow-hidden rounded-[28px] border px-6 py-6"
                style={{
                  background:
                    "linear-gradient(180deg, #F8FCFB 0%, #F2F9F7 100%)",
                  borderColor: "rgba(25,39,44,0.06)",
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-[0.12em]"
                  style={{ color: "var(--tt-dashboard-text-2)" }}
                >
                  Pola yang terlihat
                </p>
                <p
                  className="mt-3 text-sm leading-7"
                  style={{ color: "var(--tt-dashboard-text)" }}
                >
                  {selectedInsight.pattern}
                </p>
              </div>

              {/* Pengingat hari ini — TANPA card, TANPA dot kiri */}
              <div className="flex flex-col gap-3 px-2">
                <p
                  className="text-xs font-bold uppercase tracking-[0.12em]"
                  style={{ color: "var(--tt-dashboard-text-2)" }}
                >
                  Pengingat hari ini
                </p>
                <QuoteBlock text={selectedInsight.affirmation} />
              </div>
            </div>
          </>
        ) : (
          <>
            <EmptyReflectionState isToday={isToday} />
            <div className="grid gap-5 lg:grid-cols-2">
              <InsightPlaceholderCard title="Pola yang terlihat" />
              <InsightPlaceholderCard title="Pengingat hari ini" />
            </div>
          </>
        )}
      </div>
    </TopCard>
  );
}
