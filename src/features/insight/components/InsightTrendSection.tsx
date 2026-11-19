"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartTooltip,
  SurfaceCard,
  TopCard,
  TopCardHeader,
  TrendPlaceholder,
} from "./insight-primitives";
import { MONTHS_ID } from "../lib/insight-data";
import type { TrendPoint } from "../lib/insight-types";
import { getAvgLabel } from "../lib/insight-utils";
import { MoodFaceIcon, getMoodLabel } from "@/components/mood/mood-face-icons";

/* === Helper Tooltip Button === */
function HelperTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Tutup tooltip kalau klik di luar (untuk mobile)
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Lihat penjelasan"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex h-5 w-5 items-center justify-center rounded-full transition-colors"
        style={{
          background: "rgba(25,39,44,0.06)",
          color: "var(--tt-dashboard-text-2)",
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-1/2 top-full z-20 mt-2 w-[200px] -translate-x-1/2 rounded-xl px-3 py-2 text-[11px] font-medium leading-4 shadow-lg"
          style={{
            background: "rgba(25,39,44,0.95)",
            color: "#FFFFFF",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Arrow */}
          <span
            className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45"
            style={{ background: "rgba(25,39,44,0.95)" }}
          />
          {text}
        </div>
      )}
    </div>
  );
}

/* === Mood Stat Box === */
function MoodStatBox({
  value,
  score,
  label,
  helper,
  valueColor,
}: {
  value: string;
  score: number | null;
  label: string;
  helper: string;
  valueColor: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-[20px] border p-4 sm:p-5"
      style={{
        borderColor: "rgba(25,39,44,0.06)",
        background: "linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        {score !== null && <MoodFaceIcon score={score} size={42} />}
        <div className="flex flex-col">
          <span
            className="text-xl font-bold leading-7 tracking-[-0.01em] sm:text-2xl"
            style={{ color: valueColor }}
          >
            {value}
          </span>
          {score !== null && (
            <span
              className="text-xs font-semibold"
              style={{ color: valueColor }}
            >
              {getMoodLabel(score)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <p
          className="text-sm font-semibold leading-5"
          style={{ color: "var(--tt-dashboard-brand-deep)" }}
        >
          {label}
        </p>
        <HelperTooltip text={helper} />
      </div>
    </div>
  );
}

/* === Plain Stat Box (non-mood) === */
function PlainStatBox({
  value,
  label,
  helper,
  valueColor,
}: {
  value: string;
  label: string;
  helper: string;
  valueColor: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-[20px] border p-4 sm:p-5"
      style={{
        borderColor: "rgba(25,39,44,0.06)",
        background: "linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full"
          style={{ background: "rgba(124,58,237,0.10)" }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l2.83-2.83" />
            <path d="M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <span
          className="text-xl font-bold leading-7 tracking-[-0.01em] sm:text-2xl"
          style={{ color: valueColor }}
        >
          {value}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <p
          className="text-sm font-semibold leading-5"
          style={{ color: "var(--tt-dashboard-brand-deep)" }}
        >
          {label}
        </p>
        <HelperTooltip text={helper} />
      </div>
    </div>
  );
}

/* === Main Section === */
export function InsightTrendSection({
  selectedMonth,
  hasTrendData,
  trendData,
  peakMood,
  lowMood,
  avgMood,
  stableDays,
}: {
  selectedMonth: number;
  hasTrendData: boolean;
  trendData: TrendPoint[];
  peakMood: number;
  lowMood: number;
  avgMood: number;
  stableDays: number;
}) {
  if (!hasTrendData) {
    return (
      <TopCard>
        <TopCardHeader
          title="Tren Mood"
          subtitle={`Gambaran mood kamu selama bulan ${MONTHS_ID[selectedMonth].toLowerCase()}.`}
        />
        <TrendPlaceholder />
      </TopCard>
    );
  }

  const avgMoodRounded = Math.round(avgMood);

  return (
    <div
      className="flex flex-col gap-5"
      style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}
    >
      {/* === KPI CARD === */}
      <SurfaceCard>
        <div
          className="border-b px-4 py-4 sm:px-6 sm:py-5"
          style={{
            borderColor: "rgba(25,39,44,0.06)",
            background:
              "linear-gradient(135deg, rgba(26,150,136,0.04) 0%, rgba(78,207,195,0.02) 100%)",
          }}
        >
          <p
            className="text-base font-bold leading-6 tracking-[-0.01em] sm:text-[17px]"
            style={{ color: "var(--tt-dashboard-brand-deep)" }}
          >
            Ringkasan Mood
          </p>
          <p
            className="mt-1 text-xs leading-5 sm:text-sm sm:leading-6"
            style={{ color: "var(--tt-dashboard-text-2)" }}
          >
            Statistik mood kamu sepanjang bulan{" "}
            {MONTHS_ID[selectedMonth].toLowerCase()}.
          </p>
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-7">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <MoodStatBox
              value={`${peakMood}/5`}
              score={peakMood}
              label="Mood terbaik"
              helper="Nilai mood tertinggi yang muncul bulan ini."
              valueColor="var(--tt-dashboard-success)"
            />
            <MoodStatBox
              value={`${lowMood}/5`}
              score={lowMood}
              label="Mood terendah"
              helper="Nilai mood paling rendah yang sempat tercatat."
              valueColor="var(--tt-dashboard-danger)"
            />
            <MoodStatBox
              value={`${avgMood}/5`}
              score={avgMoodRounded}
              label={getAvgLabel(avgMood)}
              helper="Rata-rata mood sepanjang bulan."
              valueColor="var(--tt-dashboard-brand-deep)"
            />
            <PlainStatBox
              value={`${stableDays} hari`}
              label="Hari cukup stabil"
              helper="Jumlah hari dengan mood di level cukup baik."
              valueColor="#7C3AED"
            />
          </div>
        </div>

        {/* Mood Scale Legend */}
        <div
          className="border-t px-4 py-4 sm:px-6 sm:py-5"
          style={{ borderColor: "rgba(25,39,44,0.06)" }}
        >
          <p
            className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ color: "var(--tt-dashboard-text-2)" }}
          >
            Keterangan Skor Mood
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
            <div className="flex items-center gap-1.5">
              <MoodFaceIcon score={1} size={18} />
              <span
                className="text-[11px] font-medium sm:text-[12px]"
                style={{ color: "var(--tt-dashboard-text-2)" }}
              >
                1 = Sangat Sedih
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MoodFaceIcon score={2} size={18} />
              <span
                className="text-[11px] font-medium sm:text-[12px]"
                style={{ color: "var(--tt-dashboard-text-2)" }}
              >
                2 = Sedih
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MoodFaceIcon score={3} size={18} />
              <span
                className="text-[11px] font-medium sm:text-[12px]"
                style={{ color: "var(--tt-dashboard-text-2)" }}
              >
                3 = Biasa Aja
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MoodFaceIcon score={4} size={18} />
              <span
                className="text-[11px] font-medium sm:text-[12px]"
                style={{ color: "var(--tt-dashboard-text-2)" }}
              >
                4 = Senang
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MoodFaceIcon score={5} size={18} />
              <span
                className="text-[11px] font-medium sm:text-[12px]"
                style={{ color: "var(--tt-dashboard-text-2)" }}
              >
                5 = Sangat Senang
              </span>
            </div>
          </div>
        </div>
      </SurfaceCard>

      {/* === CHART CARD === */}
      <TopCard>
        <TopCardHeader
          title="Tren Mood"
          subtitle={`Pergerakan mood harian sepanjang bulan ${MONTHS_ID[selectedMonth].toLowerCase()}.`}
        />

        <div className="flex flex-1 flex-col px-3 py-4 sm:px-6 sm:py-6">
          <div
            className="flex flex-1 flex-col rounded-[20px] border p-3 sm:rounded-[24px] sm:p-5"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)",
              borderColor: "rgba(25,39,44,0.06)",
            }}
          >
            <div className="h-[260px] sm:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 8, right: 8, left: -28, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="moodAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--tt-dashboard-brand)"
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="60%"
                        stopColor="var(--tt-dashboard-brand)"
                        stopOpacity={0.1}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--tt-dashboard-brand)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(25,39,44,0.06)"
                  />

                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={16}
                    tickMargin={12}
                    tick={{
                      fill: "var(--tt-dashboard-text-3)",
                      fontSize: 11,
                      fontFamily:
                        "var(--font-plus-jakarta), system-ui, sans-serif",
                    }}
                  />

                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    width={32}
                    tick={{
                      fill: "var(--tt-dashboard-text-3)",
                      fontSize: 11,
                      fontFamily:
                        "var(--font-plus-jakarta), system-ui, sans-serif",
                    }}
                  />

                  <Tooltip
                    cursor={{
                      stroke: "rgba(26,150,136,0.16)",
                      strokeWidth: 1,
                    }}
                    content={<ChartTooltip />}
                  />

                  <ReferenceLine
                    y={3.5}
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                  />

                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="var(--tt-dashboard-brand-deep)"
                    strokeWidth={3}
                    fill="url(#moodAreaGradient)"
                    dot={{
                      r: 4,
                      strokeWidth: 2,
                      fill: "#FFFFFF",
                      stroke: "var(--tt-dashboard-brand)",
                    }}
                    activeDot={{
                      r: 6,
                      strokeWidth: 0,
                      fill: "var(--tt-dashboard-brand)",
                    }}
                    connectNulls={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-2">
                <span
                  className="h-[4px] w-7 rounded-full"
                  style={{ background: "var(--tt-dashboard-brand-deep)" }}
                />
                <span
                  className="text-[11px] font-medium sm:text-xs"
                  style={{ color: "var(--tt-dashboard-text-2)" }}
                >
                  Mood harian
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="h-[2px] w-7 rounded-full"
                  style={{
                    background:
                      "repeating-linear-gradient(to right, #F59E0B 0 4px, transparent 4px 7px)",
                  }}
                />
                <span
                  className="text-[11px] font-medium sm:text-xs"
                  style={{ color: "var(--tt-dashboard-text-2)" }}
                >
                  Batas cukup stabil
                </span>
              </div>
            </div>
          </div>
        </div>
      </TopCard>
    </div>
  );
}
