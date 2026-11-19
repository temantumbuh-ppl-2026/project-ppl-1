"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { MOOD_COLORS } from "@/lib/mood/palette";
import type { BaselineResponse } from "../types";

type HomeDashboardBaselineCardProps = {
  baseline: BaselineResponse | null;
};

// Warna level mengikuti palet mood redesign: Beginner = teal (skor 3),
// Intermediate = amber (skor 5). Belum dikerjakan memakai warna netral.
const LEVEL_COLORS = {
  beginner: MOOD_COLORS[3].stroke,
  intermediate: MOOD_COLORS[5].stroke,
  empty: "var(--muted)",
} as const;

// Baseline bersifat opsional (FE-03): kartu hanya menawarkan, tidak mewajibkan.
export function HomeDashboardBaselineCard({
  baseline,
}: HomeDashboardBaselineCardProps) {
  const levelColor = !baseline
    ? LEVEL_COLORS.empty
    : baseline.isBeginner
      ? LEVEL_COLORS.beginner
      : LEVEL_COLORS.intermediate;

  const levelLabel = !baseline
    ? "Belum diisi"
    : baseline.isBeginner
      ? "Beginner"
      : "Intermediate";

  return (
    <article className="support-card" aria-labelledby="baseline-title">
      <div className="support-icon yellow" aria-hidden="true">
        <Sparkles size={23} />
      </div>
      <h3 id="baseline-title">Refleksi Awal</h3>
      <p>
        <b>Baseline Assessment</b> · Kenali gaya refleksimu tanpa menghalangi
        fitur utama.
      </p>
      <div className="support-meta">
        <span>Level saat ini</span>
        <strong style={{ color: levelColor }}>{levelLabel}</strong>
      </div>

      <div className="support-actions">
        <Link className="support-action" href="/baseline">
          {baseline ? "Kerjakan kembali" : "Mulai refleksi"}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
