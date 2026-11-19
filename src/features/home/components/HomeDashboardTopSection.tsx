"use client";

import { HomeDashboardHeroCard } from "./HomeDashboardHeroCard";
import { HomeDashboardBraveChoiceCard } from "./HomeDashboardBraveChoiceCard";
import { HomeDashboardParentReportCard } from "./HomeDashboardParentReportCard";
import { HomeDashboardInsightCard } from "./HomeDashboardInsightCard";
import { HomeDashboardBaselineCard } from "./HomeDashboardBaselineCard";
import type { BaselineResponse, WeekData } from "../types";

type ParentStatus = "pending" | "verified" | "expired" | null;
type ReportType = "free_summary" | "premium_pdf" | null;
type ReportStatus = "sent" | "failed" | null;

type StreakDay = {
  day: string;
  score: number | null;
};

export function HomeDashboardTopSection({
  currentStreak,
  longestStreak,
  totalDiaries,
  streakWeek,
  getMoodColor,
  braveChoice,
  parentEmail,
  parentStatus,
  lastReportSentAt,
  lastReportType,
  lastReportStatus,
  currentWeek,
  year,
  timezone,
  isPremium,
  baseline,
  userId,
  onInsightClick,
  onInsightKeyDown,
  onReportSent,
}: {
  currentStreak: number;
  longestStreak: number;
  totalDiaries: number;
  streakWeek: StreakDay[];
  getMoodColor: (score: number) => string;
  braveChoice: {
    pct: number;
    correct: number;
    total: number;
  };
  parentEmail: string | null;
  parentStatus: ParentStatus;
  lastReportSentAt?: string | null;
  lastReportType?: ReportType;
  lastReportStatus?: ReportStatus;
  currentWeek?: WeekData;
  year: number;
  timezone: string;
  isPremium: boolean;
  baseline: BaselineResponse | null;
  userId?: string;
  onInsightClick: () => void;
  onInsightKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onReportSent?: () => Promise<void> | void;
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-[280px_1fr]">
      <HomeDashboardHeroCard
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        totalDiaries={totalDiaries}
        streakWeek={streakWeek}
        getMoodColor={getMoodColor}
      />

      <div className="grid grid-cols-2 gap-3">
        <HomeDashboardBraveChoiceCard
          correct={braveChoice.correct}
          total={braveChoice.total}
          pct={braveChoice.pct}
          userId={userId}
          plan={isPremium ? "premium" : "free"}
        />

        <HomeDashboardParentReportCard
          parentEmail={parentEmail}
          parentStatus={parentStatus}
          lastReportSentAt={lastReportSentAt}
          lastReportType={lastReportType}
          lastReportStatus={lastReportStatus}
          currentWeek={currentWeek}
          year={year}
          timezone={timezone}
          onReportSent={onReportSent}
        />

        <HomeDashboardInsightCard
          isPremium={isPremium}
          onClick={onInsightClick}
          onKeyDown={onInsightKeyDown}
        />

        {baseline ? <HomeDashboardBaselineCard baseline={baseline} /> : <div />}
      </div>
    </div>
  );
}
