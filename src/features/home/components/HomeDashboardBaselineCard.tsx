"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MotionCard } from "./home-dashboard-primitives";
import type { BaselineResponse } from "../types";

type HomeDashboardBaselineCardProps = {
  baseline: BaselineResponse | null;
};

export function HomeDashboardBaselineCard({
  baseline,
}: HomeDashboardBaselineCardProps) {
  if (!baseline) return null;

  const levelLabel = baseline.isBeginner ? "Beginner" : "Intermediate";

  return (
    <MotionCard
      custom={5}
      className="tt-dashboard-card rounded-[1.15rem] p-3 sm:p-4"
    >
      {/* Desktop: side by side */}
      <div className="hidden h-full items-center justify-between gap-3 sm:flex">
        <div className="min-w-0 flex-1">
          <p
            className="text-[14px] font-extrabold"
            style={{ color: "var(--tt-dashboard-text)" }}
          >
            Baseline Assessment
          </p>
          <motion.div
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className="mt-2 w-fit"
          >
            <Link
              href="/baseline"
              className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] font-bold transition-colors hover:opacity-80"
              style={{ color: "var(--tt-dashboard-brand)" }}
            >
              Kerjakan kembali
              <ArrowRight size={12} />
            </Link>
          </motion.div>
        </div>

        <div
          className="flex shrink-0 flex-col items-center justify-center rounded-2xl px-4 py-3"
          style={{
            background: baseline.isBeginner
              ? "rgba(26, 150, 136, 0.10)"
              : "rgba(214, 161, 27, 0.10)",
            border: baseline.isBeginner
              ? "1.5px solid rgba(26, 150, 136, 0.22)"
              : "1.5px solid rgba(214, 161, 27, 0.22)",
          }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{ color: "var(--tt-dashboard-text-2)" }}
          >
            Level
          </p>
          <p
            className="whitespace-nowrap text-[18px] font-black leading-tight"
            style={{
              color: baseline.isBeginner
                ? "var(--tt-dashboard-brand)"
                : "var(--tt-dashboard-warning)",
            }}
          >
            {levelLabel}
          </p>
        </div>
      </div>

      {/* Mobile: stacked vertically */}
      <div className="flex h-full flex-col sm:hidden">
        <p
          className="text-[12px] font-extrabold"
          style={{ color: "var(--tt-dashboard-text)" }}
        >
          Baseline Assessment
        </p>

        <motion.div
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          className="mt-1.5 w-fit"
        >
          <Link
            href="/baseline"
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold transition-colors hover:opacity-80"
            style={{ color: "var(--tt-dashboard-brand)" }}
          >
            Kerjakan kembali
            <ArrowRight size={11} />
          </Link>
        </motion.div>

        <div
          className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5"
          style={{
            background: baseline.isBeginner
              ? "rgba(26, 150, 136, 0.10)"
              : "rgba(214, 161, 27, 0.10)",
            border: baseline.isBeginner
              ? "1px solid rgba(26, 150, 136, 0.22)"
              : "1px solid rgba(214, 161, 27, 0.22)",
          }}
        >
          <span
            className="text-[8px] font-bold uppercase tracking-[0.08em]"
            style={{ color: "var(--tt-dashboard-text-2)" }}
          >
            Level
          </span>
          <span
            className="text-[13px] font-black"
            style={{
              color: baseline.isBeginner
                ? "var(--tt-dashboard-brand)"
                : "var(--tt-dashboard-warning)",
            }}
          >
            {levelLabel}
          </span>
        </div>
      </div>
    </MotionCard>
  );
}
