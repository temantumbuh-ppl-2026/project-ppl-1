"use client";

import { useState } from "react";
import { Compass, Loader2, Play } from "lucide-react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { DonutRing } from "./home-dashboard-primitives";
import { BraveChoiceModal } from "@/features/diary/components/BraveChoiceModal";
import { useBraveChoice } from "@/features/diary/hooks/useBraveChoice";
import type { UserProfile } from "@/features/diary/types";

export function HomeDashboardBraveChoiceCard({
  correct,
  total,
  pct,
  userId,
  plan,
}: {
  correct: number;
  total: number;
  pct: number;
  userId?: string;
  plan?: "free" | "premium";
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isFetchingStats = useIsFetching({ queryKey: ["brave-choice-stats"] });

  const userProfile: UserProfile | null = userId
    ? {
        id: userId,
        name: "",
        plan: plan ?? "free",
        diarySessionsUsedThisMonth: 0,
        quizUsedToday: 0,
        streakDays: 0,
        totalEntries: 0,
      }
    : null;

  const quiz = useBraveChoice(userProfile);

  const handlePlay = () => {
    void quiz.loadQuiz();
  };

  const handleClose = () => {
    quiz.closeModal();
    setIsRefreshing(true);
    void queryClient
      .invalidateQueries({ queryKey: ["brave-choice-stats"] })
      .then(() => {
        setIsRefreshing(false);
      });
  };

  const planCfg = quiz.planCfg;

  const showSkeleton = isRefreshing || (isFetchingStats > 0 && isRefreshing);

  const hasPlayed = total > 0;

  return (
    <>
      <article className="support-card" aria-labelledby="brave-choice-title">
        <div className="support-icon peach" aria-hidden="true">
          <Compass size={23} />
        </div>
        <span className={`support-badge ${hasPlayed ? "success" : ""}`}>
          {hasPlayed ? `${pct}% tepat` : "Belum ada aktivitas"}
        </span>
        <h3 id="brave-choice-title">Brave Choice</h3>
        <p>Jelajahi pilihan dan konsekuensinya lewat situasi sehari-hari.</p>

        {showSkeleton ? (
          <div className="support-skeleton" aria-hidden="true" />
        ) : hasPlayed ? (
          <div className="brave-stats">
            <div className="brave-ring" aria-hidden="true">
              <DonutRing pct={pct} color="#A86500" size={48} stroke={5} />
              <b>{pct}%</b>
            </div>
            <p>
              <strong>
                {correct}/{total}
              </strong>
              pilihan benar
            </p>
          </div>
        ) : null}

        <div className="support-actions">
          <button
            type="button"
            className="support-action"
            onClick={handlePlay}
            disabled={quiz.isLoading}
            aria-busy={quiz.isLoading}
          >
            {quiz.isLoading ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Play size={15} fill="currentColor" aria-hidden="true" />
            )}
            {hasPlayed ? "Main lagi" : "Mulai Brave Choice"}
          </button>
        </div>
      </article>

      <BraveChoiceModal
        isOpen={quiz.showModal}
        onClose={handleClose}
        quiz={quiz.currentQuiz}
        isLoading={quiz.isLoading}
        isResetting={quiz.isResetting}
        isQuestionPoolExhausted={quiz.isQuestionPoolExhausted}
        isQuotaReached={quiz.isQuotaReached}
        quizRemaining={
          quiz.quizRemaining === Infinity ? 999 : quiz.quizRemaining
        }
        quizPerDay={planCfg.quizPerDay === Infinity ? 999 : planCfg.quizPerDay}
        plan={plan ?? "free"}
        canLoadNext={plan === "premium" || quiz.quizRemaining > 0}
        onNextQuiz={quiz.loadNextQuiz}
        onResetQuestions={quiz.handleResetQuestions}
        onUpgrade={() => {
          quiz.closeModal();
          router.push("/subscription");
        }}
        onAnswerSubmit={quiz.handleAnswerSubmit}
        onContinueWriting={() => {
          handleClose();
          router.push("/diary");
        }}
      />
    </>
  );
}
