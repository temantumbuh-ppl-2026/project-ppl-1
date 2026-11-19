"use client";

import { motion } from "framer-motion";
import { MoodDayCard } from "./MoodDayCard";
import { WeekFilterBar } from "./WeekFilterBar";
import { fadeUp } from "./home-dashboard-motion";
import type { WeekData } from "../types";

export function HomeDashboardMoodHistory({
  selectedDate,
  onDateChange,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  currentWeek,
  custom = 7,
}: {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  onPrev: () => void;
  onNext: () => void;
  disablePrev: boolean;
  disableNext: boolean;
  currentWeek?: WeekData;
  custom?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={custom}
      className="mt-3 pb-4"
    >
      <div
        className="tt-dashboard-card relative overflow-visible rounded-[1.15rem] p-4 pb-2"
        style={{ isolation: "isolate" }}
      >
        {/* Header row — always inline: title left, filter right */}
        <div className="relative z-10 mb-4 flex flex-nowrap items-center justify-between gap-2">
          {/* Title — shrinks but never wraps below the filter */}
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-[15px] font-extrabold"
              style={{ color: "var(--tt-dashboard-text)" }}
            >
              Riwayat Mood
            </h2>
            <p
              className="truncate text-[10px]"
              style={{ color: "var(--tt-dashboard-text-2)" }}
            >
              {currentWeek?.label ?? "Belum ada data"}
            </p>
          </div>

          {/* Filter — never shrinks or wraps */}
          <div className="shrink-0">
            <WeekFilterBar
              selectedDate={selectedDate}
              onDateChange={onDateChange}
              onPrev={onPrev}
              onNext={onNext}
              disablePrev={disablePrev}
              disableNext={disableNext}
            />
          </div>
        </div>

        {/* Day cards */}
        {currentWeek?.days?.length ? (
          <div className="relative z-20 -mx-4 overflow-x-auto overflow-y-visible px-4 pb-2 pt-4">
            <div className="relative">
              <div className="relative grid min-w-[700px] grid-flow-col auto-cols-[88px] gap-2 md:min-w-0 md:grid-flow-row md:auto-cols-auto md:grid-cols-7">
                {currentWeek.days.map((d, i) => (
                  <motion.div
                    key={`${d.day}-${d.date}-${i}`}
                    className="relative z-0 overflow-visible"
                    style={{ isolation: "isolate" }}
                    whileHover={{
                      y: -8,
                      scale: 1.02,
                      zIndex: 60,
                      transition: {
                        duration: 0.2,
                        ease: [0.16, 1, 0.3, 1] as const,
                      },
                    }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="relative overflow-visible">
                      <MoodDayCard d={d} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl border px-4 py-8 text-center text-sm"
            style={{
              borderColor: "var(--tt-dashboard-card-border)",
              color: "var(--tt-dashboard-text-2)",
              background: "var(--tt-dashboard-brand-soft)",
            }}
          >
            Belum ada data mood untuk filter yang dipilih.
          </div>
        )}
      </div>
    </motion.div>
  );
}
