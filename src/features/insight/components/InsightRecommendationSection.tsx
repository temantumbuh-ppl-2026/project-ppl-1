"use client";

import type { ActionPriority, DayInsight } from "../lib/insight-types";
import {
  InsightPlaceholderCard,
  PriorityBadge,
  SurfaceCard,
  TopCardHeader,
} from "./insight-primitives";
import { cn } from "../lib/insight-utils";

const PRIORITY_ORDER: Record<ActionPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

// Warna latar dibedakan per prioritas, dan labelnya tetap tampil sebagai teks
// agar status tidak hanya disampaikan lewat warna.
const PRIORITY_TONE: Record<ActionPriority, "peach" | "yellow" | "mint"> = {
  High: "peach",
  Medium: "yellow",
  Low: "mint",
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
    <SurfaceCard>
      <TopCardHeader
        kicker="Langkah yang bisa dicoba"
        title="Rekomendasi Dukungan"
        subtitle="Beberapa langkah yang bisa kamu coba hari ini, mulai dari yang paling penting. Pilih yang terasa paling ringan."
      />

      {hasInsight && sortedActions.length > 0 ? (
        <div className="ins-reco">
          {sortedActions.map((action, index) => (
            <article
              key={`${action.label}-${index}`}
              className={cn(
                "ins-reco-item",
                `tone-${PRIORITY_TONE[action.priority]}`,
              )}
            >
              <span className="ins-reco-num" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="ins-reco-body">
                <strong>{action.label}</strong>
                <PriorityBadge priority={action.priority} />
                <p>{action.desc}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 4 }}>
          <InsightPlaceholderCard title="Rekomendasi utama" />
          <InsightPlaceholderCard title="Langkah berikutnya" />
        </div>
      )}
    </SurfaceCard>
  );
}
