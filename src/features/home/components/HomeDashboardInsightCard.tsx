"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Lock } from "lucide-react";

// Pengguna premium diarahkan ke /insight, pengguna gratis ke /subscription
// (sama dengan pengecekan paket existing).
export function HomeDashboardInsightCard({
  isPremium,
}: {
  isPremium: boolean;
}) {
  return (
    <article className="support-card" aria-labelledby="insight-title">
      <div className="support-icon lilac" aria-hidden="true">
        <BarChart3 size={23} />
      </div>
      <span className={`support-badge ${isPremium ? "success" : "premium"}`}>
        {isPremium ? "Aktif" : "Premium"}
      </span>
      <h3 id="insight-title">Insight</h3>
      <p>Lihat ringkasan pola dari mood dan cerita yang kamu catat.</p>

      <div className="support-actions">
        {isPremium ? (
          <Link className="support-action" href="/insight">
            Lihat Insight <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <Link className="support-action locked" href="/subscription">
            <Lock size={15} aria-hidden="true" /> Buka dengan Premium
          </Link>
        )}
      </div>
    </article>
  );
}
