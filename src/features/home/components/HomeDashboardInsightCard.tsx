"use client";

import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { MotionCard } from "./home-dashboard-primitives";

export function HomeDashboardInsightCard({
  isPremium,
  onClick,
  onKeyDown,
}: {
  isPremium: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}) {
  return (
    <MotionCard custom={4} className="tt-dashboard-card rounded-[1.15rem]">
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex h-full min-h-[88px] cursor-pointer items-center gap-3 p-4"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="text-[14px] font-extrabold"
              style={{ color: "var(--tt-dashboard-text)" }}
            >
              Lihat Insight
            </h3>
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="rounded-full px-2 py-0.5 text-[8px] font-black"
              style={{
                background: "var(--tt-dashboard-warning-soft)",
                color: "var(--tt-dashboard-warning)",
              }}
            >
              Premium
            </motion.span>
          </div>
          <p
            className="mt-1 text-[11px]"
            style={{ color: "var(--tt-dashboard-text-2)" }}
          >
            Analisis premium emosimu
          </p>
        </div>

        <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.18 }}>
          {isPremium ? (
            <ArrowRight
              size={15}
              style={{ color: "var(--tt-dashboard-text-2)" }}
            />
          ) : (
            <Lock size={13} style={{ color: "var(--tt-dashboard-text-2)" }} />
          )}
        </motion.div>
      </div>
    </MotionCard>
  );
}
