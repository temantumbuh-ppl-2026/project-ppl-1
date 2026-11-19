"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartTooltip,
  TopCard,
  TopCardHeader,
  TrendPlaceholder,
} from "./insight-primitives";
import { MONTHS_ID } from "../lib/insight-data";
import type { TrendPoint } from "../lib/insight-types";
import { cn, getAvgLabel } from "../lib/insight-utils";
import { MoodFaceIcon, getMoodLabel } from "@/components/mood/mood-face-icons";

type StatTone = "mint" | "peach" | "sky" | "lilac";

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
      className="ins-tip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Lihat penjelasan"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="ins-tip-btn"
      >
        <span aria-hidden="true">i</span>
      </button>

      {open && (
        <div className="ins-tip-pop" role="tooltip">
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
  tone,
}: {
  value: string;
  score: number | null;
  label: string;
  helper: string;
  tone: StatTone;
}) {
  return (
    <article className={cn("ins-stat", `tone-${tone}`)}>
      <div className="ins-stat-main">
        {score !== null && <MoodFaceIcon score={score} size={44} />}
        <p>
          <strong>{value}</strong>
          {score !== null && <small>{getMoodLabel(score)}</small>}
        </p>
      </div>

      <div className="ins-stat-label">
        <span>{label}</span>
        <HelperTooltip text={helper} />
      </div>
    </article>
  );
}

/* === Plain Stat Box (non-mood) === */
function PlainStatBox({
  value,
  label,
  helper,
  tone,
}: {
  value: string;
  label: string;
  helper: string;
  tone: StatTone;
}) {
  return (
    <article className={cn("ins-stat", `tone-${tone}`)}>
      <div className="ins-stat-main">
        <span className="ins-stat-sym" aria-hidden="true">
          ✦
        </span>
        <p>
          <strong>{value}</strong>
        </p>
      </div>

      <div className="ins-stat-label">
        <span>{label}</span>
        <HelperTooltip text={helper} />
      </div>
    </article>
  );
}

const Y_LABELS: Record<number, string> = {
  5: "Sangat senang",
  3: "Biasa saja",
  1: "Sangat sedih",
};

const SCORE_LEGEND: Array<[number, string]> = [
  [1, "Sangat Sedih"],
  [2, "Sedih"],
  [3, "Biasa Aja"],
  [4, "Senang"],
  [5, "Sangat Senang"],
];

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
  const monthName = MONTHS_ID[selectedMonth].toLowerCase();
  const monthShort = MONTHS_ID[selectedMonth].slice(0, 3);

  if (!hasTrendData) {
    return (
      <TopCard>
        <TopCardHeader
          kicker="Jejak bulanan"
          title="Tren Mood"
          subtitle={`Gambaran mood kamu selama bulan ${monthName}.`}
        />
        <TrendPlaceholder />
      </TopCard>
    );
  }

  const avgMoodRounded = Math.round(avgMood);

  return (
    <>
      {/* === RINGKASAN MOOD === */}
      <section className="ins-overview" aria-labelledby="ins-overview-title">
        <div className="ins-overview-copy">
          <span className="ins-kicker">Ringkasan mood</span>
          <h2 id="ins-overview-title">
            Ada banyak hal kecil yang sudah kamu lewati.
          </h2>
          <p>Statistik mood kamu sepanjang bulan {monthName}.</p>
        </div>

        <div className="ins-stats">
          <MoodStatBox
            value={`${peakMood}/5`}
            score={peakMood}
            label="Mood terbaik"
            helper="Nilai mood tertinggi yang muncul bulan ini."
            tone="mint"
          />
          <MoodStatBox
            value={`${lowMood}/5`}
            score={lowMood}
            label="Mood terendah"
            helper="Nilai mood paling rendah yang sempat tercatat."
            tone="peach"
          />
          <MoodStatBox
            value={`${avgMood}/5`}
            score={avgMoodRounded}
            label={getAvgLabel(avgMood)}
            helper="Rata-rata mood sepanjang bulan."
            tone="sky"
          />
          <PlainStatBox
            value={`${stableDays} hari`}
            label="Hari cukup stabil"
            helper="Jumlah hari dengan mood di level cukup baik."
            tone="lilac"
          />
        </div>

        {/* Keterangan skor */}
        <div className="ins-legend">
          <span>Keterangan skor mood</span>
          <div>
            {SCORE_LEGEND.map(([score, text]) => (
              <p key={score}>
                <MoodFaceIcon score={score} size={20} />
                {score} = {text}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* === GRAFIK TREN === */}
      <TopCard>
        <TopCardHeader
          kicker={`Jejak ${monthName}`}
          title="Tren Mood"
          subtitle={`Pergerakan mood harian sepanjang bulan ${monthName}. Naik turun itu wajar, grafik ini hanya membantu melihat pola.`}
        />
        <div className="ins-chart">
          <div className="ins-chart-plot">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
                      stopColor="var(--teal)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--teal)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                {[1, 3, 5].map((value) => (
                  <ReferenceLine
                    key={value}
                    y={value}
                    stroke="#dce8e5"
                    strokeDasharray="4 7"
                  />
                ))}

                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={28}
                  tickMargin={12}
                  tickFormatter={(day: number) => `${day} ${monthShort}`}
                  tick={{
                    fill: "#71808a",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily:
                      "var(--font-plus-jakarta), system-ui, sans-serif",
                  }}
                />

                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 3, 5]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={14}
                  width={108}
                  tickFormatter={(value: number) => Y_LABELS[value] ?? ""}
                  tick={{
                    fill: "#7b888f",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily:
                      "var(--font-plus-jakarta), system-ui, sans-serif",
                  }}
                />

                <Tooltip
                  cursor={{ stroke: "#dce8e5", strokeWidth: 1 }}
                  content={<ChartTooltip />}
                />

                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="var(--teal-dark)"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="url(#moodAreaGradient)"
                  dot={{
                    r: 5,
                    strokeWidth: 4,
                    fill: "var(--tt-surface)",
                    stroke: "var(--teal)",
                  }}
                  activeDot={{
                    r: 7,
                    strokeWidth: 4,
                    fill: "var(--tt-surface)",
                    stroke: "var(--teal)",
                  }}
                  connectNulls={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>{" "}
      </TopCard>
    </>
  );
}
