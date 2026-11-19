"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import { InsightPageHeader } from "./InsightPageHeader";
import { InsightRecommendationSection } from "./InsightRecommendationSection";
import { InsightReflectionSection } from "./InsightReflectionSection";
import { InsightTrendSection } from "./InsightTrendSection";
import { SurfaceCard } from "./insight-primitives";
import { PageLoader } from "@/components/ui/manual/page-loader";
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
    <main
      className="h-full min-h-0 overflow-hidden"
      style={{
        background: "var(--tt-dashboard-page-bg)",
        fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
      }}
    >
      <div className="tt-dashboard-scroll-y h-full overflow-y-auto px-4 py-4 md:px-6 md:py-5">
        <div className="pb-6">
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

          <div className="flex flex-col gap-5 mt-4">
            <InsightTrendSection
              selectedMonth={selectedMonth}
              hasTrendData={hasTrendData}
              trendData={trendData}
              peakMood={peakMood}
              lowMood={lowMood}
              avgMood={avgMood}
              stableDays={stableDays}
            />

            {/* Secondary "Tampilkan Insight" button — visible and prominent */}
            {isToday && !hasInsight && !isGenerating && (
              <button
                type="button"
                onClick={handleGenerateTodayInsight}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl text-[14px] font-semibold text-white transition-all hover:translate-y-[-1px] sm:h-14 sm:text-[15px]"
                style={{
                  background: "var(--gradient-brand-btn)",
                  boxShadow: "0 12px 28px rgba(26,150,136,0.20)",
                }}
              >
                <Sparkles size={18} />
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
          </div>

          {isGenerating ? null : (
            <InsightRecommendationSection selectedInsight={selectedInsight} />
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Skeleton Typing Animation ────────────────────────────────────────────────

function InsightSkeletonTyping() {
  return (
    <SurfaceCard className="overflow-hidden">
      <style>{`
        @keyframes insightShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .insight-shimmer {
          background: linear-gradient(90deg, rgba(26,150,136,0.08) 25%, rgba(26,150,136,0.16) 50%, rgba(26,150,136,0.08) 75%);
          background-size: 200% 100%;
          animation: insightShimmer 1.5s ease-in-out infinite;
        }
      `}</style>
      <div
        className="border-b px-6 py-5"
        style={{ borderColor: "rgba(25,39,44,0.06)" }}
      >
        <p
          className="text-[17px] font-bold"
          style={{ color: "var(--tt-dashboard-brand-deep)" }}
        >
          Refleksi AI Harian
        </p>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--tt-dashboard-text-2)" }}
        >
          Sedang menganalisis data harianmu...
        </p>
      </div>
      <div className="space-y-4 px-6 py-6">
        <div className="space-y-3">
          <div className="insight-shimmer h-4 w-[92%] rounded-full" />
          <div
            className="insight-shimmer h-4 w-[78%] rounded-full"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="insight-shimmer h-4 w-[85%] rounded-full"
            style={{ animationDelay: "0.4s" }}
          />
          <div
            className="insight-shimmer h-4 w-[63%] rounded-full"
            style={{ animationDelay: "0.6s" }}
          />
        </div>
        <div className="mt-6 space-y-3">
          <div
            className="insight-shimmer h-4 w-[72%] rounded-full"
            style={{ animationDelay: "0.8s" }}
          />
          <div
            className="insight-shimmer h-4 w-[58%] rounded-full"
            style={{ animationDelay: "1.0s" }}
          />
          <div
            className="insight-shimmer h-4 w-[45%] rounded-full"
            style={{ animationDelay: "1.2s" }}
          />
        </div>
      </div>
    </SurfaceCard>
  );
}
