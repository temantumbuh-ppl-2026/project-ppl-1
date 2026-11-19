"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { MotionCard } from "./home-dashboard-primitives";

type StreakDay = {
  day: string;
  score: number | null;
};

export function HomeDashboardHeroCard({
  currentStreak,
  longestStreak,
  totalDiaries,
  streakWeek,
  getMoodColor,
}: {
  currentStreak: number;
  longestStreak: number;
  totalDiaries: number;
  streakWeek: StreakDay[];
  getMoodColor: (score: number) => string;
}) {
  return (
    <MotionCard
      custom={1}
      className="rounded-[1.15rem] p-4"
      style={{
        background: "var(--tt-dashboard-hero-bg)",
        boxShadow: "var(--tt-dashboard-hero-shadow)",
        minHeight: 220,
      }}
    >
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.11em] text-white/80">
        Mood Streak
      </p>

      {/* Big streak number */}
      <div className="mb-4 flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.08, rotate: -6 }}
          transition={{ duration: 0.22 }}
          className="flex h-12 w-10 items-center justify-center rounded-xl"
        >
          <Flame
            size={40}
            className="text-[var(--tt-dashboard-warning)] drop-shadow-[0_0_10px_rgba(255,190,92,0.4)]"
          />
        </motion.div>

        <div className="flex items-end gap-1.5">
          <span className="text-[42px] font-black leading-none text-white">
            {currentStreak}
          </span>
          <span className="mb-1.5 text-[13px] font-semibold text-white/70">
            Hari
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-2 gap-2 mt-8">
        <motion.div
          whileHover={{ backgroundColor: "rgba(255,255,255,0.16)" }}
          className="rounded-xl bg-white/10 px-3 py-2.5 text-center transition-colors duration-200"
        >
          <p className="text-[16px] font-black text-white">{longestStreak}</p>
          <p className="text-[9px] text-white/75 mt-0.5">Terpanjang</p>
        </motion.div>

        <motion.div
          whileHover={{ backgroundColor: "rgba(255,255,255,0.16)" }}
          className="rounded-xl bg-white/10 px-3 py-2.5 text-center transition-colors duration-200"
        >
          <p className="text-[16px] font-black text-white">{totalDiaries}</p>
          <p className="text-[9px] text-white/75 mt-0.5">Total Diary</p>
        </motion.div>
      </div>

      {/* Weekly mood bar */}
      <div className="grid grid-cols-7 gap-1">
        {streakWeek.map((d, i) => (
          <motion.div
            key={`${d.day}-${i}`}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="h-1.5 w-full rounded-full transition-all duration-200"
              style={{
                background:
                  d.score !== null
                    ? getMoodColor(d.score)
                    : "rgba(255,255,255,0.18)",
              }}
            />
            <span className="text-[6px] text-white/50">{d.day[0]}</span>
          </motion.div>
        ))}
      </div>
    </MotionCard>
  );
}
