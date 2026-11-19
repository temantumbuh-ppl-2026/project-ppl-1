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
    indexBg: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
    indexShadow: "0 8px 18px rgba(220,38,38,0.28)",
    cardBg: "#FFFFFF",
    border: "rgba(220,38,38,0.18)",
    elevation: "0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(220,38,38,0.06)",
    dotColor: "#DC2626",
    headerLabelColor: "#DC2626",
  },
  Medium: {
    indexBg: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    indexShadow: "0 8px 18px rgba(217,119,6,0.22)",
    cardBg: "#FFFFFF",
    border: "rgba(217,119,6,0.16)",
    elevation: "0 1px 2px rgba(16,24,40,0.04), 0 6px 16px rgba(217,119,6,0.05)",
    dotColor: "#D97706",
    headerLabelColor: "#D97706",
  },
  Low: {
    indexBg: "linear-gradient(135deg, #1A9688 0%, #4ECFC3 100%)",
    indexShadow: "0 8px 18px rgba(26,150,136,0.22)",
    cardBg: "#FFFFFF",
    border: "rgba(26,150,136,0.14)",
    elevation:
      "0 1px 2px rgba(16,24,40,0.04), 0 6px 16px rgba(26,150,136,0.04)",
    dotColor: "#1A9688",
    headerLabelColor: "#1A9688",
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
              "linear-gradient(135deg, rgba(26,150,136,0.04) 0%, rgba(78,207,195,0.02) 100%)",
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
                        color: "#FFFFFF",
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
