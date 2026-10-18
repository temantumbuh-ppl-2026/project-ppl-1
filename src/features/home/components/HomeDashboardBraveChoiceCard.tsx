"use client";

import { useState } from "react";
import { ArrowRight, Compass, Loader2 } from "lucide-react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BraveChoiceModal } from "@/features/diary/components/BraveChoiceModal";
import { useBraveChoice } from "@/features/diary/hooks/useBraveChoice";
import type { UserProfile } from "@/features/diary/types";

// `total` berasal dari /api/diary/brave-choice/stats (jumlah jawaban tersimpan).
// Skenario bisa muncul lagi, jadi ditampilkan sebagai "latihan diselesaikan",
// bukan jumlah skenario unik. Data ketepatan tetap internal dan tidak ditampilkan.
export function HomeDashboardBraveChoiceCard({
  total,
  userId,
  plan,
}: {
  total: number;
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

  // Tombol tidak di-disable saat memuat agar fokus tetap pada pemicu dan bisa
  // dikembalikan setelah modal ditutup; pembukaan ganda dicegah di sini.
  const handlePlay = () => {
    if (quiz.showModal || quiz.isLoading) return;
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
  const showSkeleton = isRefreshing && isFetchingStats > 0;
  const hasActivity = total > 0;
  const isFree = (plan ?? "free") === "free";

  return (
    <>
      <article className="support-card" aria-labelledby="brave-choice-title">
        <div className="support-icon peach" aria-hidden="true">
          <Compass size={23} />
        </div>
        <h3 id="brave-choice-title">Brave Choice</h3>
        <p>Jelajahi pilihan dan konsekuensinya lewat situasi sehari-hari.</p>

        {showSkeleton ? (
          <div className="support-skeleton" aria-hidden="true" />
        ) : (
          <div className="brave-activity" aria-live="polite">
            <p>
              {hasActivity ? (
                <>
                  <strong>{total}</strong> latihan diselesaikan
                </>
              ) : (
                "Mulai dari satu situasi sederhana."
              )}
            </p>
          </div>
        )}

        {isFree && Number.isFinite(quiz.quizRemaining) ? (
          <p className="brave-quota">
            Sisa kesempatan hari ini: {quiz.quizRemaining}
          </p>
        ) : null}

        <div className="support-actions">
          <button
            type="button"
            className="support-action"
            onClick={handlePlay}
            aria-busy={quiz.isLoading}
            aria-haspopup="dialog"
          >
            {quiz.isLoading ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : null}
            {hasActivity ? "Coba Skenario Lain" : "Jelajahi Pilihan"}
            <ArrowRight size={16} aria-hidden="true" />
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
        loadError={quiz.loadError}
        onRetryLoad={() => void quiz.loadNextQuiz()}
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
        origin="dashboard"
      />
    </>
  );
}
