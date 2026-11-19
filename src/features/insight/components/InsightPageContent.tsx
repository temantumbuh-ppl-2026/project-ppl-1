"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import { InsightPageHeader } from "./InsightPageHeader";
import { InsightRecommendationSection } from "./InsightRecommendationSection";
import { InsightReflectionSection } from "./InsightReflectionSection";
import { InsightTrendSection } from "./InsightTrendSection";
import { SurfaceCard, TopCardHeader } from "./insight-primitives";
import { PageLoader } from "@/components/ui/manual/page-loader";
import "./insight-redesign.css";
import {
  getDateKeyInTimeZone,
  getTodayDateString,
  getUserTimeZone,
} from "../lib/insight-data";
import type { DayInsight } from "../lib/insight-types";
import {
  countStableDays,
  getAverageMood,
  getLowMood,
  getMonthData,
  getPeakMood,
} from "../lib/insight-utils";

const EMPTY_INSIGHT_MAP: Record<string, Omit<DayInsight, "date">> = {};
const EMPTY_MOOD_MAP: Record<string, number> = {};

export default function InsightPageContent() {
  const [timezone] = useState(() => getUserTimeZone());
  const [todayDate] = useState(() => getTodayDateString(timezone));
  const [selectedDate, setSelectedDate] = useState(() =>
    getTodayDateString(timezone),
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data: insightData,
    isLoading,
    refetch: refetchInsightData,
  } = useQuery({
    queryKey: ["insight-page-data", timezone],
    queryFn: async () => {
      const [insightRes, moodRes] = await Promise.all([
        fetch("/api/insight"),
        fetch(`/api/mood?timezone=${encodeURIComponent(timezone)}`),
      ]);

      const nextInsightMap: Record<string, Omit<DayInsight, "date">> = {};
      const nextMoodMap: Record<string, number> = {};

      if (insightRes.ok) {
        const { data } = await insightRes.json();
        Object.assign(nextInsightMap, data || {});
      }

      if (moodRes.ok) {
        const { data } = await moodRes.json();
        if (Array.isArray(data)) {
          data.forEach(
            (mood: { createdAt: string | Date; moodScore: number }) => {
              const dateStr = getDateKeyInTimeZone(
                new Date(mood.createdAt),
                timezone,
              );
              nextMoodMap[dateStr] = mood.moodScore;
            },
          );
        }
      }

      return {
        insightMap: nextInsightMap,
        moodMap: nextMoodMap,
      };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const insightMap = insightData?.insightMap ?? EMPTY_INSIGHT_MAP;
  const moodMap = insightData?.moodMap ?? EMPTY_MOOD_MAP;

  const availableDates = useMemo(() => {
    const dateSet = new Set<string>([
      ...Object.keys(insightMap),
      ...Object.keys(moodMap),
      todayDate,
    ]);
    return Array.from(dateSet).sort();
  }, [insightMap, moodMap, todayDate]);

  const currentIndex = availableDates.indexOf(selectedDate);
  const effectiveDate =
    availableDates[currentIndex] ?? availableDates[availableDates.length - 1];

  const selectedInsight = insightMap[effectiveDate];
  const hasInsight = Boolean(selectedInsight);
  const isToday = effectiveDate === todayDate;
  const canGenerateToday = !hasInsight;

  const selectedDateObj = useMemo(
    () => new Date(`${effectiveDate}T00:00:00`),
    [effectiveDate],
  );

  const selectedYear = selectedDateObj.getFullYear();
  const selectedMonth = selectedDateObj.getMonth();

  const trendData = useMemo(
    () => getMonthData(selectedYear, selectedMonth, moodMap),
    [selectedYear, selectedMonth, moodMap],
  );

  const avgMood = useMemo(() => getAverageMood(trendData), [trendData]);
  const peakMood = useMemo(() => getPeakMood(trendData), [trendData]);
  const lowMood = useMemo(() => getLowMood(trendData), [trendData]);
  const stableDays = useMemo(() => countStableDays(trendData), [trendData]);
  const hasTrendData = trendData.some((item) => item.mood !== null);

  function handlePrevDate() {
    if (currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  }

  function handleNextDate() {
    if (currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  }

  function handleDateChange(newDate: string) {
    if (!newDate) return;
    setSelectedDate(newDate);
  }

  async function handleGenerateTodayInsight() {
    if (!canGenerateToday || isGenerating) return;

    try {
      setIsGenerating(true);
      const res = await fetch("/api/insight/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: effectiveDate, timezone }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghasilkan Insight.");
        return;
      }

      toast.success("Insight berhasil dihasilkan untuk hari ini!");
      await refetchInsightData();
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return <PageLoader message="Memuat insight..." />;
  }

  return (
    <main className="tt-insight">
      <div className="ins-scroll tt-dashboard-scroll-y">
        <div className="ins-page">
          <InsightPageHeader
            effectiveDate={effectiveDate}
            availableDates={availableDates}
            currentIndex={currentIndex}
            dateInputRef={dateInputRef}
            isToday={isToday}
            hasInsight={hasInsight}
            isGenerating={isGenerating}
            onGenerateTodayInsight={handleGenerateTodayInsight}
            onPrevDate={handlePrevDate}
            onNextDate={handleNextDate}
            onDateChange={handleDateChange}
          />

          <InsightTrendSection
            selectedMonth={selectedMonth}
            hasTrendData={hasTrendData}
            trendData={trendData}
            peakMood={peakMood}
            lowMood={lowMood}
            avgMood={avgMood}
            stableDays={stableDays}
          />

          {/* Tombol sekunder "Tampilkan Insight" agar mudah ditemukan */}
          {isToday && !hasInsight && !isGenerating && (
            <button
              type="button"
              onClick={handleGenerateTodayInsight}
              className="ins-cta"
            >
              <Sparkles size={18} aria-hidden="true" />
              Tampilkan Insight Hari Ini
            </button>
          )}

          {isGenerating ? (
            <InsightSkeletonTyping />
          ) : (
            <InsightReflectionSection
              effectiveDate={effectiveDate}
              availableDates={availableDates}
              isToday={isToday}
              selectedInsight={selectedInsight}
            />
          )}

          {isGenerating ? null : (
            <InsightRecommendationSection selectedInsight={selectedInsight} />
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Skeleton Typing Animation ───────────────────────────────────────────────

function InsightSkeletonTyping() {
  const widths = ["92%", "78%", "85%", "63%", "72%", "58%", "45%"];

  return (
    <SurfaceCard>
      <TopCardHeader
        title="Refleksi AI Harian"
        subtitle="Sedang menganalisis data harianmu..."
      />
      <div role="status" aria-live="polite" aria-busy="true">
        {widths.map((width, index) => (
          <div
            key={`${width}-${index}`}
            className="ins-bar ins-shimmer"
            style={{ width, animationDelay: `${index * 0.2}s` }}
          />
        ))}
      </div>
    </SurfaceCard>
  );
}
