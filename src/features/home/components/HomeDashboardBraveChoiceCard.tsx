"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { MotionCard, DonutRing } from "./home-dashboard-primitives";
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

  return (
    <>
      <MotionCard
        custom={2}
        className="tt-dashboard-card rounded-[1.15rem] p-4"
      >
        <div className="flex h-full flex-col">
          <p
            className="mb-3 text-[11px] font-bold uppercase tracking-[0.11em]"
            style={{ color: "var(--tt-dashboard-text-2)" }}
          >
            Brave Choice
          </p>

          {showSkeleton ? (
            <div className="flex flex-1 items-center gap-3">
              <div className="flex flex-1 items-center gap-2 sm:gap-3">
                <div
                  className="h-[42px] w-[42px] shrink-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(110deg, rgba(196,224,220,0.45) 8%, rgba(255,255,255,0.75) 18%, rgba(196,224,220,0.45) 33%)",
                    backgroundSize: "200% 100%",
                    animation: "tt-skeleton 1.35s linear infinite",
                  }}
                />
                <div className="flex flex-col gap-1.5">
                  <div
                    className="h-5 w-16 rounded-md"
                    style={{
                      background:
                        "linear-gradient(110deg, rgba(196,224,220,0.45) 8%, rgba(255,255,255,0.75) 18%, rgba(196,224,220,0.45) 33%)",
                      backgroundSize: "200% 100%",
                      animation: "tt-skeleton 1.35s linear infinite",
                    }}
                  />
                  <div
                    className="h-3 w-20 rounded-md"
                    style={{
                      background:
                        "linear-gradient(110deg, rgba(196,224,220,0.45) 8%, rgba(255,255,255,0.75) 18%, rgba(196,224,220,0.45) 33%)",
                      backgroundSize: "200% 100%",
                      animation: "tt-skeleton 1.35s linear infinite",
                    }}
                  />
                </div>
              </div>
              <div
                className="h-9 w-9 shrink-0 rounded-full sm:h-11 sm:w-11"
                style={{
                  background:
                    "linear-gradient(110deg, rgba(196,224,220,0.45) 8%, rgba(255,255,255,0.75) 18%, rgba(196,224,220,0.45) 33%)",
                  backgroundSize: "200% 100%",
                  animation: "tt-skeleton 1.35s linear infinite",
                }}
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center gap-3">
              {/* Left: stats */}
              <div className="flex flex-1 items-center gap-2 sm:gap-3">
                <motion.div
                  whileHover={{ scale: 1.06, rotate: 4 }}
                  transition={{ duration: 0.22 }}
                  className="relative flex shrink-0 items-center justify-center"
                >
                  <DonutRing
                    pct={pct}
                    color="var(--tt-dashboard-warning)"
                    size={42}
                    stroke={4}
                  />
                  <span
                    className="absolute text-[10px] font-black sm:text-[12px]"
                    style={{ color: "var(--tt-dashboard-text)" }}
                  >
                    {pct}%
                  </span>
                </motion.div>

                <div className="flex flex-col justify-center">
                  <p
                    className="text-[18px] font-black leading-none sm:text-[22px]"
                    style={{ color: "var(--tt-dashboard-text)" }}
                  >
                    {correct}/{total}
                  </p>
                  <p
                    className="mt-0.5 text-[10px] font-semibold sm:text-[12px]"
                    style={{ color: "var(--tt-dashboard-text-2)" }}
                  >
                    pilihan benar
                  </p>
                </div>
              </div>

              {/* Right: round play button */}
              <motion.button
                type="button"
                onClick={handlePlay}
                whileHover={{
                  scale: 1.08,
                  boxShadow: "0 12px 32px rgba(26,150,136,0.35)",
                }}
                whileTap={{ scale: 0.92 }}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full sm:h-11 sm:w-11"
                style={{
                  background:
                    "var(--gradient-brand-btn, linear-gradient(135deg, #144949 0%, #1a9688 100%))",
                  boxShadow: "0 6px 18px rgba(26,150,136,0.25)",
                }}
                aria-label="Mulai Brave Choice Quiz"
                title="Mulai Brave Choice"
              >
                <Play size={16} color="white" fill="white" />
              </motion.button>
            </div>
          )}
        </div>
      </MotionCard>

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
