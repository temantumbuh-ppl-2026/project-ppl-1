"use client";

import type { ActionPriority, DayInsight } from "../lib/insight-types";
import {
  InsightPlaceholderCard,
  PriorityBadge,
  SurfaceCard,
} from "./insight-primitives";

const PRIORITY_ORDER: Record<ActionPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const PRIORITY_VISUAL: Record<
  ActionPriority,
  {
    indexBg: string;
    indexShadow: string;
    cardBg: string;
    border: string;
    elevation: string;
    dotColor: string;
    headerLabelColor: string;
  }
> = {
  High: {
    indexBg: "var(--tt-attention-text)",
    indexShadow:
      "0 8px 18px color-mix(in srgb, var(--tt-attention-text) 28%, transparent)",
    cardBg: "var(--tt-surface)",
    border: "var(--tt-attention-border)",
    elevation:
      "0 1px 2px rgba(16,24,40,0.04), 0 8px 20px color-mix(in srgb, var(--tt-attention-text) 6%, transparent)",
    dotColor: "var(--tt-attention-text)",
    headerLabelColor: "var(--tt-attention-text)",
  },
  Medium: {
    indexBg: "var(--tt-warning-text)",
    indexShadow:
      "0 8px 18px color-mix(in srgb, var(--tt-warning-text) 22%, transparent)",
    cardBg: "var(--tt-surface)",
    border: "color-mix(in srgb, var(--tt-warning-text) 16%, transparent)",
    elevation:
      "0 1px 2px rgba(16,24,40,0.04), 0 6px 16px color-mix(in srgb, var(--tt-warning-text) 5%, transparent)",
    dotColor: "var(--tt-warning-text)",
    headerLabelColor: "var(--tt-warning-text)",
  },
  Low: {
    indexBg: "var(--tt-button-primary)",
    indexShadow:
      "0 8px 18px color-mix(in srgb, var(--tt-primary-500) 22%, transparent)",
    cardBg: "var(--tt-surface)",
    border: "color-mix(in srgb, var(--tt-primary-500) 14%, transparent)",
    elevation:
      "0 1px 2px rgba(16,24,40,0.04), 0 6px 16px color-mix(in srgb, var(--tt-primary-500) 4%, transparent)",
    dotColor: "var(--tt-primary-500)",
    headerLabelColor: "var(--tt-primary-500)",
  },
};

export function InsightRecommendationSection({
  selectedInsight,
}: {
  selectedInsight?: Omit<DayInsight, "date">;
}) {
  const hasInsight = Boolean(selectedInsight);

  const sortedActions = hasInsight
    ? [...(selectedInsight?.actions ?? [])].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
      )
    : [];

  return (
    <div
      className="mt-5"
      style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}
    >
      <SurfaceCard className="overflow-hidden">
        {/* Header — TANPA garis aksen kiri */}
        <div
          className="border-b px-6 py-5"
          style={{
            borderColor: "rgba(25,39,44,0.06)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--tt-primary-500) 4%, transparent) 0%, color-mix(in srgb, var(--tt-primary-300) 2%, transparent) 100%)",
          }}
        >
          <p
            className="text-[17px] font-bold leading-6 tracking-[-0.01em]"
            style={{ color: "var(--tt-dashboard-brand-deep)" }}
          >
            Rekomendasi Dukungan
          </p>
          <p
            className="mt-1 text-sm leading-6"
            style={{ color: "var(--tt-dashboard-text-2)" }}
          >
            Beberapa langkah yang bisa kamu coba hari ini, mulai dari yang
            paling penting.
          </p>
        </div>

        <div className="space-y-4 px-6 py-6">
          {hasInsight && sortedActions.length > 0 ? (
            sortedActions.map((action, index) => {
              const visual = PRIORITY_VISUAL[action.priority];

              return (
                <div
                  key={`${action.label}-${index}`}
                  className="relative overflow-hidden rounded-[24px] border transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md"
                  style={{
                    background: visual.cardBg,
                    borderColor: visual.border,
                    boxShadow: visual.elevation,
                  }}
                >
                  <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:gap-5">
                    {/* Number circle */}
                    <div
                      className="mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-bold"
                      style={{
                        background: visual.indexBg,
                        color: "var(--tt-surface)",
                        boxShadow: visual.indexShadow,
                      }}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                        <p
                          className="text-[16px] font-bold leading-7 tracking-[-0.005em]"
                          style={{ color: "var(--tt-dashboard-text)" }}
                        >
                          {action.label}
                        </p>
                        <PriorityBadge priority={action.priority} />
                      </div>

                      <p
                        className="mt-2 text-sm leading-7"
                        style={{ color: "var(--tt-dashboard-text-2)" }}
                      >
                        {action.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              <InsightPlaceholderCard title="Rekomendasi utama" />
              <InsightPlaceholderCard title="Langkah berikutnya" />
            </>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
